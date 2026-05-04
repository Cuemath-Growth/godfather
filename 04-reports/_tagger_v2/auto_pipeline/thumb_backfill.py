#!/usr/bin/env python3
"""High-res thumbnail backfill.

The May 4 bytes-not-URLs migration cached whatever Meta's `thumbnail_url`
returned at the time -- which is force-cropped to 64x64. Cards now render
the permanent URL but the bytes themselves are tiny.

This script overwrites each Storage object with a higher-res capture:
  Static  -> creative.asset_feed_spec.images[*].hash
              -> /{account}/adimages?hashes=[h] -> permalink_url -> 1080x1080
  Video   -> creative.asset_feed_spec.videos[*].video_id
              -> /{video_id}/thumbnails -> is_preferred 1080x1920
  Fallback (perm-blocked creator video):
              -> creative.asset_feed_spec.videos[0].thumbnail_url -> 160x160

Storage path is parsed from the existing stored_thumbnail URL so the
public URL we already wrote into creative_tags doesn't change. Same key,
just crisper bytes.

Cost: $0 (Supabase Storage free tier holds plenty of headroom).
Runtime: ~30-60 min depending on Meta rate-limit backoff.
"""
import sys, json, base64, time, re, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime

sys.path.insert(0, "/tmp/vision_tagger")
from vision_tagger import (
    proxy_meta, http, fetch_bytes,
    load_or_build_name_to_id, fetch_creative_for_ad,
    resolve_asset_for_ad, fetch_static_url, fetch_video_frame_url,
    derive_account_id, supabase_get,
    SUPA_URL, SUPA_KEY,
)

LOG_DIR = Path("/tmp/vision_tagger/logs"); LOG_DIR.mkdir(parents=True, exist_ok=True)

# Object key parser: strip everything before /creative-thumbnails/
_KEY_RX = re.compile(r"/creative-thumbnails/(.+)$")

def storage_key_from_url(url):
    if not url: return None
    m = _KEY_RX.search(url)
    return m.group(1) if m else None

def storage_upload(bucket, path, raw_bytes, content_type):
    """Overwrite (upsert) an object in Supabase Storage."""
    url = f"{SUPA_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "apikey": SUPA_KEY,
        "Authorization": f"Bearer {SUPA_KEY}",
        "Content-Type": content_type or "image/jpeg",
        "x-upsert": "true",
    }
    s, raw = http("POST", url, body=raw_bytes, headers=headers, timeout=60)
    return s in (200, 201, 204), raw

def sniff_mime(b):
    if   b[:3] == b"\xff\xd8\xff": return "image/jpeg"
    elif b[:8] == b"\x89PNG\r\n\x1a\n": return "image/png"
    elif b[:6] in (b"GIF87a", b"GIF89a"): return "image/gif"
    elif b[:4] == b"RIFF" and b[8:12] == b"WEBP": return "image/webp"
    return "image/jpeg"

def existing_size(stored_url):
    """HEAD the existing object and return content-length, or None."""
    try:
        req = urllib.request.Request(stored_url, method="HEAD")
        req.add_header("User-Agent", "Mozilla/5.0")
        with urllib.request.urlopen(req, timeout=15) as r:
            return int(r.headers.get("content-length") or 0)
    except Exception:
        return None

# -------- main --------
def run(args):
    log_path = LOG_DIR / f"thumb_backfill_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
    log_f = log_path.open("w")
    def log(rec): log_f.write(json.dumps(rec)+"\n"); log_f.flush()

    print(f"[+] log -> {log_path}")
    print("[+] fetching rows with stored_thumbnail ...")
    s, rows = supabase_get("creative_tags?select=ad_name,stored_thumbnail,creative_type&stored_thumbnail=not.is.null")
    if s != 200:
        sys.exit(f"supabase fetch failed: {s} {rows}")
    print(f"    {len(rows)} candidate rows")

    # Skip rows whose existing object is already > size threshold (means a previous
    # backfill upgraded it). 64x64 JPGs are < 5KB; 1080x1080 are typically > 30KB.
    SKIP_BYTES = args.skip_above_bytes

    # Group by account for cache loading
    by_acct = {}
    for r in rows:
        acct = derive_account_id(r["stored_thumbnail"])
        if not acct: continue
        r["account_id"] = acct
        by_acct.setdefault(acct, []).append(r)

    name_to_id_by_account = {}
    for acct in by_acct:
        print(f"[+] cache for {acct} ...")
        name_to_id_by_account[acct] = load_or_build_name_to_id(acct)
        print(f"    {len(name_to_id_by_account[acct])} ads")

    targets = [r for rs in by_acct.values() for r in rs]
    if args.limit: targets = targets[:args.limit]
    print(f"[+] processing {len(targets)} targets (skip_above={SKIP_BYTES} bytes)")

    upgraded, skipped_already_big, fail_resolve, fail_fetch, fail_upload = 0, 0, 0, 0, 0
    total_bytes = 0

    for i, r in enumerate(targets, 1):
        ad_name = r["ad_name"]
        acct    = r["account_id"]
        stored  = r["stored_thumbnail"]
        ad_id   = (name_to_id_by_account.get(acct) or {}).get(ad_name)
        if not ad_id:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "lookup", "error": "not in cache"})
            continue

        # Cheap pre-check: skip if already big enough.
        if SKIP_BYTES > 0:
            sz = existing_size(stored)
            if sz is not None and sz >= SKIP_BYTES:
                skipped_already_big += 1
                if i % 50 == 0: print(f"  [{i}/{len(targets)}] skip already-big {ad_name[:60]} ({sz}B)")
                continue

        creative = fetch_creative_for_ad(ad_id)
        if not creative:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "fetch_creative", "ad_id": ad_id})
            continue

        kind, hint, fallback_url = resolve_asset_for_ad(creative)
        if not hint and not fallback_url:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "resolve", "creative_keys": list(creative.keys())})
            continue

        # Try high-res first; fall back to AFS thumbnail (160x160) for perm-blocked videos.
        full_url = None
        if kind == "static" and hint:
            full_url = fetch_static_url(acct, hint)
        elif kind == "video" and hint:
            full_url = fetch_video_frame_url(hint)
        if not full_url and fallback_url:
            full_url = fallback_url
        if not full_url:
            fail_resolve += 1
            log({"ad_name": ad_name, "stage": "resolve_url", "kind": kind, "hint": hint})
            continue

        s_dl, raw = fetch_bytes(full_url)
        if s_dl != 200 or len(raw) < 500:
            fail_fetch += 1
            log({"ad_name": ad_name, "stage": "fetch_bytes", "status": s_dl, "size": len(raw or b"")})
            continue

        path = storage_key_from_url(stored)
        if not path:
            fail_upload += 1
            log({"ad_name": ad_name, "stage": "parse_key", "url": stored})
            continue

        mime = sniff_mime(raw)
        ok, body = storage_upload("creative-thumbnails", path, raw, mime)
        if not ok:
            fail_upload += 1
            log({"ad_name": ad_name, "stage": "upload", "raw": str(body)[:200]})
            continue

        upgraded += 1
        total_bytes += len(raw)
        if i % 25 == 0 or upgraded < 5:
            print(f"  [{i}/{len(targets)}] OK {kind} {ad_name[:55]}  {len(raw)//1024}KB")
        log({"ad_name": ad_name, "stage": "ok", "kind": kind, "bytes": len(raw), "path": path})

        time.sleep(args.throttle)

    log_f.close()
    print()
    print("=== summary ===")
    print(f"  upgraded:           {upgraded}")
    print(f"  skipped already-big:{skipped_already_big}")
    print(f"  fail_resolve:       {fail_resolve}")
    print(f"  fail_fetch:         {fail_fetch}")
    print(f"  fail_upload:        {fail_upload}")
    print(f"  total bytes uploaded: {total_bytes/1024/1024:.1f} MB")
    print(f"  log: {log_path}")

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--skip-above-bytes", type=int, default=15000,
                    help="HEAD-check existing object; skip if it's already >= this many bytes (avoids re-uploading already-upgraded thumbs)")
    ap.add_argument("--throttle", type=float, default=0.15)
    run(ap.parse_args())
