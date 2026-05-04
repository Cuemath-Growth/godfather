# auto_pipeline — vision tagging & thumbnail capture

Scripts here power the v3 vision-tag stream and the bytes-not-URLs thumbnail
storage. They live in the repo so they survive `/tmp` cleanup.

## Files

| File | Purpose |
|---|---|
| `vision_tagger.py` | Walks untagged ads, fetches full-res via Meta API, sends to Haiku 4.5 vision through `proxy-ai`, upserts to `creative_tags_v3`. |
| `thumb_backfill.py` | Walks rows with `stored_thumbnail`, refetches full-res (1080×1080 / 1080×1920) and overwrites the same Storage object. Same URL, crisper bytes. |
| `partnership_tagger.py` | Rule-based tag fallback for true-partnership videos (no AFS asset access). Reads talent name from ad_name → canonical tag set from `influencer_tags_v3.csv`. |
| `auto_resume.sh` | Polls Meta rate limit until clear, then builds account caches and runs a 10-ad smoke test. Use this after a quota hit. |

## Usage

```bash
# One-shot backfill of everything currently untagged
python3 vision_tagger.py

# Restrict to N ads
python3 vision_tagger.py --limit 100

# Restrict by creative_type
python3 vision_tagger.py --creative-type Static

# Dry run — fetch + resolve, no Haiku call
python3 vision_tagger.py --no-write --limit 5

# Upgrade existing 64×64 Storage objects to full-res
python3 thumb_backfill.py

# Tag partnership videos from talent roster (no spend)
python3 partnership_tagger.py
```

## Caching

All scripts use `/tmp/vision_tagger/cache/<account>_name_to_id.json` for the
Meta name→ad_id map. Rebuild with `--rebuild-cache`. Caches are ephemeral by
design — Meta's ad universe changes daily.

## Auth

No local API keys needed. All Meta + Anthropic calls go through deployed
Cloudflare Pages functions:
- `https://godfather-4t4.pages.dev/api/proxy-meta` — META_ACCESS_TOKEN
- `https://godfather-4t4.pages.dev/api/proxy-ai` — CLAUDE_API_KEY
- `https://godfather-4t4.pages.dev/api/proxy-image` — image bytes pass-through

## Long-running auto-tagging

These scripts are the *batch* layer. The *online* layer (auto-tagging on
dashboard load) lives in `functions/api/auto-vision-tag.js` (Phase 2). Dashboard
boot pings that endpoint with new ad_names; it does the same work as
`vision_tagger.py` but server-side and capped at 50 ads/call.
