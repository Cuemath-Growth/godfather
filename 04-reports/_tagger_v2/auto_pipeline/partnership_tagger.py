#!/usr/bin/env python3
"""Rule-based tagger for true partnership/dark-post videos that have no
asset_feed_spec (Meta's permission scope blocks asset access).

Approach: extract talent name from ad_name -> look up canonical tag set
from influencer_tags_v3.csv (227 rows of human-validated tags for the
54-creator roster). If we have a match, write the same tags with
source=v3-influencer-rule (Medium confidence — different creative may
deliver same script, but performance variation is real).

Usage: python3 partnership_tagger.py [--dry-run] [--limit N]
"""
import csv, json, sys, re, base64, urllib.request, urllib.parse, urllib.error
from datetime import datetime
from pathlib import Path
from collections import Counter, defaultdict

sys.path.insert(0, "/tmp/vision_tagger")
from vision_tagger import (
    supabase_get, supabase_upsert_v3,
    load_or_build_name_to_id, fetch_creative_for_ad,
    derive_account_id, market_from_name, http,
)

ROSTER_CSV = "/Users/nainajethalia/Documents/CM Brain /godfather/04-reports/_tagger_v2/influencer_tags_v3.csv"

def normalize_talent(name):
    """ARIGELA KEERTHI PRIYA -> 'arigela keerthi priya'; 'Priya Anand' -> 'priya anand'."""
    return re.sub(r"[\s_-]+", " ", (name or "").strip().lower())

def load_canonical_talent_tags():
    """Per-talent canonical tag set, voting on the most common value per field
    when a creator has multiple ads. Fields: hook_frame, master_frame,
    close_type, specificity, pain_target, production_cue, language, plus
    evidence quotes (use the first non-empty)."""
    rows = list(csv.DictReader(open(ROSTER_CSV)))
    by_talent = defaultdict(list)
    for r in rows:
        t = normalize_talent(r.get("talent",""))
        if t: by_talent[t].append(r)
    out = {}
    for t, group in by_talent.items():
        def vote(field):
            c = Counter(r[field] for r in group if r.get(field))
            return c.most_common(1)[0][0] if c else None
        def first(field):
            for r in group:
                if r.get(field): return r[field]
            return ""
        out[t] = {
            "hook_frame":     vote("hook_frame"),
            "master_frame":   vote("master_frame"),
            "close_type":     vote("close_type"),
            "specificity":    vote("specificity") or "Anonymous",
            "pain_target":    vote("pain_target"),
            "production_cue": "UGC-polished",  # all influencer ads are UGC
            "language":       vote("language") or "English",
            "evidence_hook":  first("evidence_hook"),
            "evidence_close": first("evidence_close"),
            "evidence_pain":  first("evidence_pain"),
            "n_ads":          len(group),
        }
    return out

# Patterns for extracting talent from ad_name (in priority order).
TALENT_PATTERNS = [
    # ..._Influencer-<Name>_<date> or ..._Influencer-<Name>-<suffix>
    re.compile(r"_Influencer-([A-Za-z][A-Za-z\-_ ]+?)(?:[-_](?:V\d|2[0-9]s|\d{6})|$)", re.IGNORECASE),
    # ..._Postboost_Video_<Name>_<date>
    re.compile(r"_Postboost.*?_Video_([A-Za-z][A-Za-z\-_ ]+?)_(\d{6}|\d{4})", re.IGNORECASE),
    # ..._Perf_Edit_NA_Video_Perf_Telegu_Influencer_<Name>_<market>_<date>
    re.compile(r"_Influencer_([A-Za-z][A-Za-z\-_ ]+?)_(?:US|UK|IN|AUS|NZ|SG|MEA|UAE|KSA)_", re.IGNORECASE),
    # Generic: ..._Video_<Name>_<date> where name follows underscore-Video-underscore
    re.compile(r"_Video_([A-Za-z][A-Za-z\-_ ]+?)_(\d{6})$", re.IGNORECASE),
    # Edited-<Name>
    re.compile(r"_Edited-([A-Za-z][A-Za-z\-_ ]+?)(?:[_-]\d{6})", re.IGNORECASE),
    # Testimonial-<Name>
    re.compile(r"_Testimonial2?-([A-Za-z][A-Za-z\-_ ]+?)(?:[_-]\d{6}|[_-]V\d|$)", re.IGNORECASE),
    # Standalone Influencer-Inhouse-edited-video-<Name>_<date>
    re.compile(r"-video-([A-Za-z][A-Za-z\-_ ]+?)_\d{6}", re.IGNORECASE),
]

def extract_talent_from_name(ad_name):
    for pat in TALENT_PATTERNS:
        m = pat.search(ad_name)
        if m:
            cand = m.group(1).strip().strip("-_")
            cand = re.sub(r"[-_]+", " ", cand).strip()
            # drop trailing duration tokens like "20s", "13s"
            cand = re.sub(r"\s+\d+s$", "", cand, flags=re.IGNORECASE).strip()
            if cand and len(cand) > 1 and not cand.isdigit():
                return cand
    return None

def find_partnership_ads(canonical_talents, force_no_afs_check=False):
    """Pull untagged-with-stored ads, classify by AFS availability, and try to
    match talent. Returns list of dicts ready to write."""
    s, rows = supabase_get("creative_tags?select=ad_name,stored_thumbnail&stored_thumbnail=not.is.null")
    s2, tagged = supabase_get("creative_tags_v3?select=ad_name")
    tagged_set = {r["ad_name"] for r in tagged}
    rows = [r for r in rows if r["ad_name"] not in tagged_set]
    print(f"[partnership] {len(rows)} untagged candidates after dedup")

    # Build name->id cache for AFS check
    n2i_by_acct = {}
    for acct in ("act_5215842511824318","act_888586384639855","act_925205080936963"):
        n2i_by_acct[acct] = load_or_build_name_to_id(acct)

    found = []
    for r in rows:
        name = r["ad_name"]
        acct = derive_account_id(r["stored_thumbnail"])
        if not acct: continue
        ad_id = n2i_by_acct.get(acct, {}).get(name)
        # Check AFS — partnership videos have empty asset_feed_spec.videos
        has_afs_video = False
        if ad_id and not force_no_afs_check:
            c = fetch_creative_for_ad(ad_id) or {}
            vids = ((c.get("asset_feed_spec") or {}).get("videos")) or []
            has_afs_video = bool(vids and vids[0].get("thumbnail_url"))
        # Only target ads WITHOUT a workable AFS thumb (true partnership)
        if has_afs_video: continue
        talent = extract_talent_from_name(name)
        if not talent: continue
        canon = canonical_talents.get(normalize_talent(talent))
        if not canon: continue  # talent not in our roster
        found.append({"ad_name": name, "talent": talent, "canon": canon, "account_id": acct})
    return found

def main(args):
    canonical = load_canonical_talent_tags()
    print(f"[partnership] loaded {len(canonical)} talents from roster CSV")
    if args.show_talents:
        for t, v in sorted(canonical.items()):
            print(f"  {t} (n={v['n_ads']})")
        return
    candidates = find_partnership_ads(canonical, force_no_afs_check=args.skip_afs_check)
    print(f"[partnership] {len(candidates)} ads matched talent + no-AFS filter")
    if args.limit: candidates = candidates[:args.limit]

    written, skipped = 0, 0
    for c in candidates:
        canon = c["canon"]
        row = {
            "ad_name":       c["ad_name"],
            "hook_frame":    canon["hook_frame"],
            "master_frame":  canon["master_frame"],
            "close_type":    canon["close_type"],
            "specificity":   canon["specificity"],
            "pain_target":   canon["pain_target"],
            "production_cue":canon["production_cue"],
            "language":      canon["language"],
            "evidence_hook": canon["evidence_hook"],
            "evidence_close":canon["evidence_close"],
            "evidence_pain": canon["evidence_pain"],
            "confidence":    "Medium",  # rule-based, not direct vision
            "notes":         f"Rule-based tags from talent='{c['talent']}' canonical set ({canon['n_ads']} ref ads in roster).",
            "source":        "v3-influencer-rule",
            "tagged_at":     datetime.now().date().isoformat(),
        }
        if args.dry_run:
            print(f"  DRY {c['ad_name'][:60]} -> {c['talent']} -> {row['hook_frame']}/{row['master_frame']}/{row['close_type']}")
            written += 1
            continue
        s, raw = supabase_upsert_v3(row)
        if s in (200, 201, 204):
            written += 1
            print(f"  OK  {c['ad_name'][:60]} -> {c['talent']} -> {row['hook_frame']}/{row['master_frame']}/{row['close_type']}")
        else:
            skipped += 1
            print(f"  ERR {c['ad_name'][:60]} {s} {str(raw)[:120]}")

    print()
    print(f"=== summary ===  written: {written}  skipped: {skipped}")

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--show-talents", action="store_true", help="print all talents loaded from roster")
    ap.add_argument("--skip-afs-check", action="store_true", help="skip per-ad AFS check (faster, but may double-tag)")
    main(ap.parse_args())
