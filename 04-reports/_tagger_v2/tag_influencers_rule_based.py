#!/usr/bin/env python3
"""Rule-based tagger for untagged Influencer/Postboost video ads.

Vision pipeline can't reliably tag these (Meta thumbs are end plates, not
cover frames -- see project_vision_tagging_stream.md). But the ad_name is
enough on its own:

    Influencer / Postboost video featuring a named tutor
        -> production_cue = UGC-polished
        -> specificity    = Named-tutor
        -> source         = rule-influencer
        -> confidence     = High

We DO NOT set `language` here (per feedback_language_field_is_one_axis.md --
never override language from bare ad-name tokens).

Idempotent: only writes ads not already in creative_tags_v3, so re-running
won't overwrite higher-confidence rows from the vision pipeline.

Usage: python3 tag_influencers_rule_based.py [--dry-run]
"""
import json, re, sys, urllib.request, urllib.error
from datetime import datetime

SUPA_URL = "https://lcixlyyzlnzeiqjdbxfh.supabase.co"
SUPA_KEY = "sb_publishable_3vFEM4zGI7Rx9z7H4cLmhw_xt6nkw4u"
PATTERN  = re.compile(r"Influencer|Postboost", re.IGNORECASE)


def http(method, url, *, body=None, headers=None):
    req = urllib.request.Request(url, method=method)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=data, timeout=120) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def supabase_get(path):
    h = {"apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY}
    out, offset, page = [], 0, 1000
    while True:
        h["Range"] = f"{offset}-{offset+page-1}"
        s, raw = http("GET", SUPA_URL + "/rest/v1/" + path, headers=h)
        if s not in (200, 206):
            sys.exit(f"GET {path} -> {s} {raw[:200]!r}")
        chunk = json.loads(raw)
        out.extend(chunk)
        if len(chunk) < page:
            return out
        offset += page


def supabase_upsert(rows):
    h = {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + SUPA_KEY,
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    return http(
        "POST",
        SUPA_URL + "/rest/v1/creative_tags_v3?on_conflict=ad_name",
        body=rows, headers=h,
    )


def main():
    dry_run = "--dry-run" in sys.argv

    all_ads = supabase_get("creative_tags?select=ad_name")
    tagged  = supabase_get("creative_tags_v3?select=ad_name")
    tagged_set = {r["ad_name"] for r in tagged}

    untagged   = [r["ad_name"] for r in all_ads if r["ad_name"] not in tagged_set]
    candidates = [n for n in untagged if PATTERN.search(n)]
    print(f"untagged total: {len(untagged)}  influencer/postboost candidates: {len(candidates)}")

    today = datetime.now().date().isoformat()
    rows = [{
        "ad_name":        name,
        "production_cue": "UGC-polished",
        "specificity":    "Named-tutor",
        "confidence":     "High",
        "source":         "rule-influencer",
        "notes":          "Rule-based: ad_name matches Influencer/Postboost pattern (named-tutor UGC video).",
        "tagged_at":      today,
    } for name in candidates]

    if not rows:
        print("nothing to write.")
        return
    if dry_run:
        for r in rows[:5]:
            print("  DRY", r["ad_name"][:80])
        print(f"  ... ({len(rows)} total, dry-run only)")
        return

    written = 0
    for i in range(0, len(rows), 50):
        chunk = rows[i:i+50]
        s, raw = supabase_upsert(chunk)
        if s in (200, 201, 204):
            written += len(chunk)
        else:
            sys.exit(f"upsert chunk {i} -> {s} {raw[:300]!r}")
    print(f"upserted: {written}")


if __name__ == "__main__":
    main()
