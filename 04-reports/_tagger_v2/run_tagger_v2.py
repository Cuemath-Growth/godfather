#!/usr/bin/env python3
"""
Tagger v2 — content-based ad tagging.

Reads ad copy from Notion + transcript fragments + ad metadata,
calls Claude API with the strict prompt in PROMPT.md, writes
tags to creative_tags_v2.csv.

Run on the curated 16-ad list first to validate prompt + taxonomy.
Once Naina approves the output, expand to full 3,800-ad set.

Usage:
    export ANTHROPIC_API_KEY="sk-ant-..."
    python3 run_tagger_v2.py --validate         # tag the 16 priority ads
    python3 run_tagger_v2.py --full             # tag everything in priority_ads.csv
    python3 run_tagger_v2.py --diff             # diff old tags vs new tags

Environment:
    ANTHROPIC_API_KEY  required for Claude API
    MODEL              default: claude-opus-4-7

Output:
    creative_tags_v2.csv  — new tags
    creative_tags_diff.csv — old vs new comparison
    cost_log.csv          — token usage tracking
"""
import os, sys, json, csv, time, argparse
from pathlib import Path

WORK = Path("/Users/nainajethalia/Documents/Brain/godfather/04-reports/_tagger_v2")
PROMPT_FILE = WORK / "PROMPT.md"

# Lazy import — only when actually running
def _client():
    from anthropic import Anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("Set ANTHROPIC_API_KEY")
    return Anthropic(api_key=api_key)

def load_prompt():
    text = PROMPT_FILE.read_text()
    # Split system prompt from user template
    if "## User prompt template" not in text:
        sys.exit("PROMPT.md missing user template section")
    system = text.split("## User prompt template")[0]
    user_template = text.split("```\n", 2)[1].split("```")[0] if "```" in text else ""
    return system, user_template

def fetch_notion_content(notion_id):
    """Fetch Notion page content. In production this hits the Notion API.
    For Phase 1 validation, content is pre-cached in /tmp/notion_cache/."""
    cache = WORK / "notion_cache" / f"{notion_id}.json"
    if cache.exists():
        return json.loads(cache.read_text())
    return None

def fetch_transcript(ad_name, transcript_index):
    """Look up transcript by talent name in the cached transcript document."""
    if not transcript_index: return ""
    name = ad_name.lower()
    for talent, text in transcript_index.items():
        if talent.lower() in name:
            return text
    return ""

def tag_ad(client, system, user_tmpl, ad_row, notion_content, transcript):
    headline = notion_content.get("headline", "") if notion_content else ""
    primary = notion_content.get("primary_text", "") if notion_content else ""

    user = (user_tmpl
        .replace("{{ad_name}}", ad_row["ad_name"])
        .replace("{{market}}", ad_row.get("market", "Unknown"))
        .replace("{{Static or Video}}", ad_row.get("creative_type", "Unknown"))
        .replace("{{headline}}", headline or "(no headline available)")
        .replace("{{primary_text}}", primary or "(no PC available — tag from ad name + transcript only)")
        .replace("{{transcript_or_blank}}", transcript or "(none)")
    )

    resp = client.messages.create(
        model=os.getenv("MODEL", "claude-opus-4-7"),
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    text = resp.content[0].text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json\n"): text = text[5:]
    return json.loads(text), resp.usage.input_tokens, resp.usage.output_tokens

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--validate", action="store_true")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--diff", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()

    if args.diff:
        diff_old_vs_new()
        return

    system, user_tmpl = load_prompt()

    # Load curated mapping
    mapping = {}
    with open(WORK / "notion_curated_mapping.csv") as f:
        for row in csv.DictReader(f):
            mapping[row["label"]] = row["notion_id"]

    # Load priority ads
    priority = []
    with open(WORK / "priority_ads.csv") as f:
        priority = list(csv.DictReader(f))

    # Filter to ads with curated Notion mapping
    if args.validate:
        priority = [p for p in priority if p["label"] in mapping]
        print(f"Validation run: {len(priority)} ads with Notion content")

    if args.limit:
        priority = priority[:args.limit]

    # Load transcript index (built once from the Google Doc transcripts)
    transcript_idx_path = WORK / "transcript_index.json"
    transcript_idx = json.loads(transcript_idx_path.read_text()) if transcript_idx_path.exists() else {}

    client = _client()
    out_rows = []
    cost_in, cost_out = 0, 0

    for i, ad in enumerate(priority, 1):
        notion_id = mapping.get(ad["label"], "")
        notion_content = fetch_notion_content(notion_id) if notion_id else None
        transcript = fetch_transcript(ad["ad_name"], transcript_idx)

        if not notion_content and not transcript:
            print(f"  [{i}/{len(priority)}] SKIP — no content for {ad['label']}")
            continue

        try:
            tags, ti, to = tag_ad(client, system, user_tmpl, ad, notion_content, transcript)
            cost_in += ti; cost_out += to
            tags["spend"] = ad["spend"]
            tags["TD"] = ad["TD"]
            tags["section_in_deck"] = ad["section"]
            out_rows.append(tags)
            print(f"  [{i}/{len(priority)}] {ad['label']}: {tags.get('hook_frame')} / {tags.get('master_frame')} / {tags.get('close_type')}")
            time.sleep(0.5)
        except Exception as e:
            print(f"  [{i}/{len(priority)}] ERROR: {e}")

    # Save
    if out_rows:
        cols = list(out_rows[0].keys())
        out_path = WORK / "creative_tags_v2.csv"
        with open(out_path, "w") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            for r in out_rows:
                # Flatten evidence dict
                if isinstance(r.get("evidence"), dict):
                    r["evidence"] = json.dumps(r["evidence"], ensure_ascii=False)
                w.writerow(r)
        print(f"\nSaved → {out_path}")

    # Cost
    # Opus 4.7 pricing approx: $15/M input, $75/M output
    cost_usd = (cost_in/1_000_000) * 15 + (cost_out/1_000_000) * 75
    print(f"Tokens: in={cost_in:,} out={cost_out:,}  |  Cost: ${cost_usd:.2f}")


def diff_old_vs_new():
    """Side-by-side: current creative_tags vs creative_tags_v2."""
    new_rows = list(csv.DictReader(open(WORK / "creative_tags_v2.csv")))
    print(f"\n{'Section':<18}{'Label':<28}{'OLD pain_benefit':<32}→{'NEW pain_target':<22}{'NEW hook_frame':<22}")
    print("-"*125)
    # Join with priority_ads to get old pain_benefit
    p = {r["ad_name"]: r for r in csv.DictReader(open(WORK / "priority_ads.csv"))}
    for r in new_rows:
        old = p.get(r["ad_name"], {}).get("current_pain_benefit","")
        print(f"{r['section_in_deck']:<18}{r.get('ad_name','')[:26]:<28}{old[:30]:<32}→{r.get('pain_target',''):<22}{r.get('hook_frame',''):<22}")


if __name__ == "__main__":
    main()
