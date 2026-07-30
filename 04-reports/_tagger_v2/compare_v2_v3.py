#!/usr/bin/env python3
"""Distribution stats for v3 + flip count vs creative_tags_v2_2.csv."""
import csv
from collections import Counter, defaultdict

V3 = "/Users/nainajethalia/Documents/Brain/godfather/04-reports/_tagger_v2/influencer_tags_v3.csv"
V2 = "/Users/nainajethalia/Documents/Brain/godfather/04-reports/_tagger_v2/creative_tags_v2_2.csv"


def load_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    v3_rows = load_csv(V3)

    # Distributions on v3
    fields = ["hook_frame", "master_frame", "close_type", "pain_target", "language", "specificity"]
    print("=== v3 distributions (n=226) ===")
    for fld in fields:
        c = Counter(r[fld] for r in v3_rows)
        print(f"\n[{fld}]")
        for k, v in c.most_common():
            print(f"   {v:>4}  {k}")

    # Index v2 by ad_name (one row each)
    v2_rows = load_csv(V2)
    v2_index = {}
    for r in v2_rows:
        v2_index[r["ad_name"]] = r

    # Flips
    flip_hook = 0
    flip_master = 0
    flip_close = 0
    any_flip = 0
    matched = 0
    flip_examples = []

    for r in v3_rows:
        prev = v2_index.get(r["ad_name"])
        if prev is None:
            continue
        matched += 1
        h_flip = (prev.get("hook_frame", "") or "") != r["hook_frame"]
        m_flip = (prev.get("master_frame", "") or "") != r["master_frame"]
        c_flip = (prev.get("close_type", "") or "") != r["close_type"]
        if h_flip:
            flip_hook += 1
        if m_flip:
            flip_master += 1
        if c_flip:
            flip_close += 1
        if h_flip or m_flip or c_flip:
            any_flip += 1
            flip_examples.append({
                "talent": r["talent"],
                "ad_name": r["ad_name"],
                "hook_v2": prev.get("hook_frame", ""), "hook_v3": r["hook_frame"], "h_flip": h_flip,
                "master_v2": prev.get("master_frame", ""), "master_v3": r["master_frame"], "m_flip": m_flip,
                "close_v2": prev.get("close_type", ""), "close_v3": r["close_type"], "c_flip": c_flip,
            })

    print(f"\n=== flip counts vs v2_2 (matched {matched}/{len(v3_rows)} influencer ads) ===")
    print(f"hook_frame flipped: {flip_hook}")
    print(f"master_frame flipped: {flip_master}")
    print(f"close_type flipped: {flip_close}")
    print(f"any_flip: {any_flip}")

    # Top 5 flip examples (prefer rows where multiple flipped, then unique talents)
    print("\n=== top 5 flip examples (one per talent where possible) ===")
    seen_talents = set()
    chosen = []
    # Sort by flip count descending then high spend not available — by ad_name length stable.
    flip_examples.sort(key=lambda x: -(int(x["h_flip"]) + int(x["m_flip"]) + int(x["c_flip"])))
    for ex in flip_examples:
        if ex["talent"] in seen_talents:
            continue
        seen_talents.add(ex["talent"])
        chosen.append(ex)
        if len(chosen) >= 5:
            break

    for i, ex in enumerate(chosen, 1):
        print(f"\n[{i}] {ex['talent']}")
        print(f"    ad: {ex['ad_name']}")
        if ex["h_flip"]:
            print(f"    hook:    {ex['hook_v2'] or '(blank)'}  ->  {ex['hook_v3']}")
        if ex["m_flip"]:
            print(f"    master:  {ex['master_v2'] or '(blank)'}  ->  {ex['master_v3']}")
        if ex["c_flip"]:
            print(f"    close:   {ex['close_v2'] or '(blank)'}  ->  {ex['close_v3']}")


if __name__ == "__main__":
    main()
