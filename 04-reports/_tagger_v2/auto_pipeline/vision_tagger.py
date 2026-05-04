#!/usr/bin/env python3
"""Vision tagger v3 — fills the v3 coverage gap by sending full-res ad creatives
to Haiku 4.5 vision through the deployed Cloudflare proxy.

Asset resolution (no ffmpeg):
  Static  -> creative.asset_feed_spec.images[*].hash
              -> /{account}/adimages?hashes=[h] -> permalink_url -> 1080x1080 jpg
  Video   -> creative.asset_feed_spec.videos[*].video_id
              -> /{video_id}?fields=thumbnails -> is_preferred 1080x1920 frame
  Fallback (boosted post w/o asset_feed_spec): creative.thumbnail_url (64x64 — skipped)

Spend gate: --limit caps the run. --dry-run does no Haiku calls.
"""
import json, base64, sys, time, argparse, urllib.request, urllib.parse, urllib.error
from datetime import datetime
from pathlib import Path

PROXY_BASE = "https://godfather-4t4.pages.dev/api"
SUPA_URL   = "https://lcixlyyzlnzeiqjdbxfh.supabase.co"
SUPA_KEY   = "sb_publishable_3vFEM4zGI7Rx9z7H4cLmhw_xt6nkw4u"
LOG_DIR    = Path("/tmp/vision_tagger/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

PROMPT_SYSTEM = open(
    "/Users/nainajethalia/Documents/CM Brain /godfather/04-reports/_tagger_v2/PROMPT.md"
).read().split("## Output schema")[0]  # vocab + rules; schema appended below explicitly.

OUTPUT_INSTRUCTIONS = """
Output a JSON object exactly matching this schema (no prose, no markdown):
{
  "ad_name": "<exact ad name passed in>",
  "hook_frame": "<vocab>",
  "master_frame": "<vocab>",
  "close_type": "<vocab>",
  "specificity": "<vocab>",
  "pain_target": "<primary>[,<secondary>]",
  "production_cue": "<vocab>",
  "language": "<vocab>",
  "evidence_hook": "<exact on-image text or visible cue supporting hook_frame>",
  "evidence_close": "<exact on-image text/CTA supporting close_type>",
  "evidence_pain": "<on-image text or scene supporting pain_target>",
  "confidence": "High|Medium|Low",
  "notes": "<one sentence flagging anything unusual, or empty>"
}

You are looking at a SINGLE FRAME from the ad (or the full static for Static creatives).
Read on-image text first, then visual cues (faces, badges, scene). Use Unclear when the
frame doesn't support a tag. Confidence Low when the frame is ambiguous (e.g., a closing
brand card with no message).
"""

_DEFAULT_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

def http(method, url, *, body=None, headers=None, timeout=120):
    req = urllib.request.Request(url, method=method)
    has_ua = False
    if headers:
        for k, v in headers.items():
            if k.lower() == "user-agent": has_ua = True
            req.add_header(k, v)
    if not has_ua:
        req.add_header("User-Agent", _DEFAULT_UA)
    data = None
    if body is not None and not isinstance(body, (bytes, bytearray)):
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    elif isinstance(body, (bytes, bytearray)):
        data = bytes(body)
    try:
        with urllib.request.urlopen(req, data=data, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()

def proxy_meta(endpoint, params=None):
    s, raw = http("POST", PROXY_BASE+"/proxy-meta", body={"endpoint": endpoint, "params": params or {}})
    try:    return s, json.loads(raw)
    except: return s, {"error": True, "raw": raw[:200].decode("utf-8","replace")}

def fetch_bytes(url, *, ua=True, timeout=60):
    """Fetch image bytes with browser UA so Facebook permalink_url returns the image."""
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"} if ua else {}
    s, raw = http("GET", url, headers=headers, timeout=timeout)
    return s, raw

def supabase_get(path, *, headers_extra=None):
    """Paginates 1000 rows at a time via Range header until exhausted."""
    h = {"apikey": SUPA_KEY, "Authorization": "Bearer "+SUPA_KEY}
    if headers_extra: h.update(headers_extra)
    out, offset, page = [], 0, 1000
    while True:
        h["Range"] = f"{offset}-{offset+page-1}"
        s, raw = http("GET", SUPA_URL+"/rest/v1/"+path, headers=h)
        if s not in (200, 206):
            return s, raw
        try:    chunk = json.loads(raw)
        except: return s, raw
        out.extend(chunk)
        if len(chunk) < page: break
        offset += page
    return 200, out

def supabase_upsert_v3(row):
    """Upsert into creative_tags_v3 — preserves existing High-confidence rows."""
    h = {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer "+SUPA_KEY,
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    s, raw = http(
        "POST",
        SUPA_URL+"/rest/v1/creative_tags_v3?on_conflict=ad_name",
        body=[row], headers=h,
    )
    return s, raw

# ---------- asset resolution ----------

def resolve_asset_for_ad(creative):
    """Return ('static'|'video'|None, payload_hint, fallback_url).
    payload_hint: image_hash for static, video_id for video.
    fallback_url: 160x160 thumbnail from asset_feed_spec — used if the high-res
    fetch (/{video_id}/thumbnails) returns permission denied.
    """
    afs = creative.get("asset_feed_spec") or {}
    images = afs.get("images") or []
    videos = afs.get("videos") or []
    if videos:
        v0 = videos[0]
        return "video", v0.get("video_id"), v0.get("thumbnail_url")
    if images:
        return "static", images[0].get("hash"), None
    if creative.get("video_id"):
        return "video", creative["video_id"], None
    return None, None, None

def fetch_static_url(account_id, image_hash):
    s, body = proxy_meta(account_id+"/adimages", {"hashes": json.dumps([image_hash]), "fields": "permalink_url,width,height"})
    if s != 200: return None
    data = (body.get("data") or [None])[0]
    return data.get("permalink_url") if data else None

def fetch_video_frame_url(video_id):
    s, body = proxy_meta(video_id, {"fields": "thumbnails{uri,width,height,is_preferred}"})
    if s != 200: return None
    thumbs = ((body.get("thumbnails") or {}).get("data")) or []
    if not thumbs: return None
    preferred = next((t for t in thumbs if t.get("is_preferred")), thumbs[0])
    return preferred.get("uri")

# ---------- ad lookup ----------

CACHE_DIR = Path("/tmp/vision_tagger/cache"); CACHE_DIR.mkdir(parents=True, exist_ok=True)

def fetch_account_name_to_id(account_id, max_pages=400, throttle=0.3):
    """Light pull: just id+name per ad (two passes, default + ARCHIVED)."""
    out = {}
    for status_filter in (None, json.dumps(["ARCHIVED"])):
        params = {"fields": "id,name", "limit": "200"}
        if status_filter: params["effective_status"] = status_filter
        s, body = proxy_meta(account_id+"/ads", params)
        pages = 0
        while True:
            pages += 1
            if s != 200:
                print(f"    [warn] page {pages} status={s} body={str(body)[:150]}")
                break
            for ad in body.get("data", []):
                n = ad.get("name"); aid = ad.get("id")
                if n and aid and n not in out: out[n] = aid
            nxt = (body.get("paging") or {}).get("next")
            if not nxt or pages >= max_pages: break
            try:
                tail = nxt.split("graph.facebook.com/", 1)[1].split("/", 1)[1]
                ep, qs = tail.split("?", 1)
                p = dict(urllib.parse.parse_qsl(qs))
                p.pop("access_token", None)
            except Exception:
                break
            time.sleep(throttle)
            s, body = proxy_meta(ep, p)
    return out

def load_or_build_name_to_id(account_id, force=False):
    cf = CACHE_DIR / f"{account_id}_name_to_id.json"
    if cf.exists() and not force:
        return json.loads(cf.read_text())
    print(f"    building cache for {account_id} (one-time, can take ~5 min) ...")
    m = fetch_account_name_to_id(account_id)
    cf.write_text(json.dumps(m))
    print(f"    cached {len(m)} ads to {cf}")
    return m

def fetch_creative_for_ad(ad_id):
    s, body = proxy_meta(ad_id, {"fields": "creative{thumbnail_url,asset_feed_spec{images,videos},video_id,object_type,id}"})
    if s != 200: return None
    return body.get("creative") or {}

_ACCT_FROM_PATH = __import__("re").compile(r"/creative-thumbnails/(act_\d+)/")
def derive_account_id(stored_thumbnail):
    if not stored_thumbnail: return None
    m = _ACCT_FROM_PATH.search(stored_thumbnail)
    return m.group(1) if m else None

def fetch_untagged_ads():
    """Untagged ads with stored_thumbnail. Account ID is parsed from the storage path
    because the `account` column is mostly empty / contains label not ID."""
    s, rows = supabase_get(
        "creative_tags?select=ad_name,account,creative_type,stored_thumbnail"
        "&stored_thumbnail=not.is.null"
    )
    if s != 200:
        sys.exit(f"supabase fetch failed: {s} {rows}")
    s2, tagged = supabase_get("creative_tags_v3?select=ad_name,confidence")
    if s2 != 200:
        sys.exit(f"supabase v3 fetch failed: {s2} {tagged}")
    # Skip ad_names already tagged at any confidence — re-tagging would just
    # overwrite Stream 5 work without new signal. (To force re-run, --force flag later.)
    tagged_set = {r["ad_name"] for r in tagged}
    out = []
    for r in rows:
        if r["ad_name"] in tagged_set: continue
        acct = derive_account_id(r.get("stored_thumbnail"))
        if not acct: continue
        r["account_id"] = acct
        out.append(r)
    return out

# ---------- haiku call ----------

def haiku_vision(ad_name, market, fmt, image_b64, mime):
    user_prompt = (
        f"Tag this Cuemath ad.\n\n"
        f"Ad name: {ad_name}\n"
        f"Market: {market}\n"
        f"Format: {fmt}\n\n"
        f"You are looking at the visual content of the ad. Read the on-image text, "
        f"badges, faces, and scene cues. Output the JSON now.\n"
        f"\n{OUTPUT_INSTRUCTIONS}"
    )
    payload = {
        "provider": "claude",
        "model": "claude-haiku-4-5-20251001",
        "system": PROMPT_SYSTEM,
        "max_tokens": 1024,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": mime or "image/jpeg", "data": image_b64}},
                {"type": "text", "text": user_prompt},
            ],
        }],
    }
    s, raw = http("POST", PROXY_BASE+"/proxy-ai", body=payload, timeout=180)
    try:    return s, json.loads(raw)
    except: return s, {"error": True, "raw": raw[:500].decode("utf-8","replace")}

def parse_haiku_json(resp):
    """Pull the JSON object from Haiku's text content."""
    if not isinstance(resp, dict): return None
    content = resp.get("content") or []
    txt = "".join(c.get("text", "") for c in content if c.get("type") == "text")
    txt = txt.strip()
    if txt.startswith("```"):
        txt = txt.strip("`")
        if txt.lower().startswith("json"): txt = txt[4:]
    # find first { ... } block
    start = txt.find("{")
    end   = txt.rfind("}")
    if start == -1 or end == -1: return None
    try:    return json.loads(txt[start:end+1])
    except: return None

# ---------- market derivation (mirror dashboard rule) ----------
def market_from_name(n):
    n = (n or "").upper()
    if any(t in n for t in ("MEA","KSA","UAE","SAUDI","QATAR","KUWAIT","OMAN","BAHRAIN")): return "MEA"
    if any(t in n for t in ("ANZ","AUSTRALIA","NZ","SG","SNG","SINGAPORE")): return "ANZ"
    if any(t in n for t in ("USA","US_","CAN","CANADA","NRI")): return "US"
    if "UK_" in n or n.startswith("UK") or "_UK_" in n: return "UK"
    if any(t in n for t in ("IND_","INDIA")): return "India"
    return "ROW"

# ---------- main ----------
def run(args):
    log_path = LOG_DIR / f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
    log_f = log_path.open("w")
    def log(rec): log_f.write(json.dumps(rec)+"\n"); log_f.flush()

    print(f"[+] log -> {log_path}")
    print("[+] fetching untagged ads from supabase...")
    targets = fetch_untagged_ads()
    print(f"    {len(targets)} candidate untagged ads (with stored_thumbnail)")
    if args.creative_type:
        targets = [t for t in targets if (t.get("creative_type") or "").lower() == args.creative_type.lower()]
        print(f"    filtered to creative_type={args.creative_type}: {len(targets)}")
    if args.account:
        targets = [t for t in targets if t.get("account_id") == args.account]
        print(f"    filtered to account={args.account}: {len(targets)}")
    if args.limit:
        targets = targets[:args.limit]
        print(f"    capped to first {args.limit}")

    # Group by account
    by_acct = {}
    for t in targets: by_acct.setdefault(t["account_id"], []).append(t)
    name_to_id_by_account = {}
    for acct in by_acct:
        print(f"[+] resolving name->id cache for {acct}")
        name_to_id_by_account[acct] = load_or_build_name_to_id(acct, force=args.rebuild_cache)
        print(f"    {len(name_to_id_by_account[acct])} ads cached for {acct}")

    success, fail_resolve, fail_fetch, fail_haiku, fail_upsert, skipped = 0,0,0,0,0,0
    spent_input_tokens = 0
    spent_output_tokens = 0
    HAIKU_IN  = 1.00 / 1_000_000   # $1 per MTok input
    HAIKU_OUT = 5.00 / 1_000_000   # $5 per MTok output

    for i, t in enumerate(targets, 1):
        ad_name = t["ad_name"]
        acct    = t["account_id"]
        ad_id   = (name_to_id_by_account.get(acct) or {}).get(ad_name)
        if not ad_id:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "lookup", "error": "ad_name not in cached /ads"})
            continue
        creative = fetch_creative_for_ad(ad_id)
        if not creative:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "fetch_creative", "ad_id": ad_id})
            continue
        kind, hint, fallback_url = resolve_asset_for_ad(creative)
        if not hint and not fallback_url:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "resolve", "error": "no asset_feed_spec or video_id", "creative_keys": list(creative.keys())})
            continue
        used_fallback = False
        if kind == "static":
            full_url = fetch_static_url(acct, hint)
        else:
            full_url = fetch_video_frame_url(hint) if hint else None
            if not full_url and fallback_url:
                full_url = fallback_url
                used_fallback = True
        if not full_url:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "resolve_url", "kind": kind, "hint": hint})
            continue

        s, raw = fetch_bytes(full_url)
        if s != 200 or len(raw) < 500:
            fail_fetch += 1
            log({"ad_name": ad_name, "stage": "fetch_bytes", "status": s, "size": len(raw or b"")})
            continue
        b64 = base64.b64encode(raw).decode()
        # Sniff bytes — Facebook serves JPEGs even at .png URLs.
        if   raw[:3] == b"\xff\xd8\xff": mime = "image/jpeg"
        elif raw[:8] == b"\x89PNG\r\n\x1a\n": mime = "image/png"
        elif raw[:6] in (b"GIF87a", b"GIF89a"): mime = "image/gif"
        elif raw[:4] == b"RIFF" and raw[8:12] == b"WEBP": mime = "image/webp"
        else: mime = "image/jpeg"

        if args.dry_run:
            print(f"  [{i}/{len(targets)}] DRY {kind} {ad_name[:80]} bytes={len(raw)}")
            log({"ad_name": ad_name, "stage": "dry_ok", "kind": kind, "bytes": len(raw)})
            success += 1
            continue

        market = market_from_name(ad_name)
        fmt    = "Static" if kind == "static" else "Video"
        s, resp = haiku_vision(ad_name, market, fmt, b64, mime)
        if s != 200:
            fail_haiku += 1
            log({"ad_name": ad_name, "stage": "haiku", "status": s, "resp": str(resp)[:300]})
            continue
        usage = resp.get("usage") or {}
        spent_input_tokens  += usage.get("input_tokens", 0)
        spent_output_tokens += usage.get("output_tokens", 0)

        parsed = parse_haiku_json(resp)
        if not parsed:
            fail_haiku += 1
            log({"ad_name": ad_name, "stage": "parse", "raw": str(resp)[:500]})
            continue

        row = {
            "ad_name":       ad_name,
            "hook_frame":    parsed.get("hook_frame"),
            "master_frame":  parsed.get("master_frame"),
            "close_type":    parsed.get("close_type"),
            "specificity":   parsed.get("specificity"),
            "pain_target":   parsed.get("pain_target"),
            "production_cue":parsed.get("production_cue"),
            "language":      parsed.get("language"),
            "evidence_hook": parsed.get("evidence_hook") or (parsed.get("evidence",{}) or {}).get("hook_quote",""),
            "evidence_close":parsed.get("evidence_close") or (parsed.get("evidence",{}) or {}).get("close_quote",""),
            "evidence_pain": parsed.get("evidence_pain") or (parsed.get("evidence",{}) or {}).get("pain_quote",""),
            "confidence":    parsed.get("confidence"),
            "notes":         parsed.get("notes",""),
            "source":        f"v3-vision-{'video-frame-lores' if (kind=='video' and used_fallback) else ('video-frame' if kind=='video' else 'static')}",
            "tagged_at":     datetime.now().date().isoformat(),
        }

        if args.no_write:
            log({"ad_name": ad_name, "stage": "would_write", "row": row})
            success += 1
            print(f"  [{i}/{len(targets)}] OK {kind} {ad_name[:60]} -> {row['hook_frame']}/{row['master_frame']}/{row['close_type']} ({row['confidence']})")
            continue

        s2, raw2 = supabase_upsert_v3(row)
        if s2 not in (200, 201, 204):
            fail_upsert += 1
            log({"ad_name": ad_name, "stage": "upsert", "status": s2, "raw": str(raw2)[:300]})
            continue

        success += 1
        log({"ad_name": ad_name, "stage": "ok", "kind": kind, "row": row, "usage": usage})
        print(f"  [{i}/{len(targets)}] OK {kind} {ad_name[:60]} -> {row['hook_frame']}/{row['master_frame']}/{row['close_type']} ({row['confidence']})")

        # tiny throttle so we're polite to Meta
        time.sleep(0.1)

    cost = spent_input_tokens*HAIKU_IN + spent_output_tokens*HAIKU_OUT
    print()
    print(f"=== run summary ===")
    print(f"  success:         {success}")
    print(f"  fail_resolve:    {fail_resolve}")
    print(f"  fail_fetch:      {fail_fetch}")
    print(f"  fail_haiku:      {fail_haiku}")
    print(f"  fail_upsert:     {fail_upsert}")
    print(f"  input tokens:    {spent_input_tokens:,}")
    print(f"  output tokens:   {spent_output_tokens:,}")
    print(f"  est cost:        ${cost:.4f}")
    print(f"  log:             {log_path}")
    log_f.close()

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None, help="cap N ads")
    ap.add_argument("--creative-type", choices=["Static","Video","unknown"], default=None)
    ap.add_argument("--account", default=None)
    ap.add_argument("--dry-run", action="store_true", help="resolve+download only, no Haiku call")
    ap.add_argument("--no-write", action="store_true", help="Haiku call but skip Supabase upsert")
    ap.add_argument("--rebuild-cache", action="store_true", help="force rebuild of name->id cache")
    args = ap.parse_args()
    run(args)
