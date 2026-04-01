# Godfather Session — 2026-04-01 (2:30 AM – 2:00 PM, ~12 hours)

## All 16 Commits (chronological)

### AM Session (2:30–5:00 AM) — Data Architecture
1. `92199c7` — Meta API primary for spend, cross-exclusion, notes, fonts
2. `896c593` — CRM↔Meta join via utm_term alias (88% match)
3. `112f907` — Fix 4 critical bugs: double-counting, mutation, Meta≠CRM mixing, dates
4. `161e923` — getAdPerformanceDaily() — daily ad-level foundation (31K rows)
5. `c31a49a` — Rebuild getAdPerformance() to aggregate from daily
6. `f5a79ea` — Fix ₹0 spend cache bug + add mx_utm_term to slim cache

### Noon Session (12:00–1:30 PM) — Boot + Match Rate
7. `7cd0c6b` — Boot rewrite: parallel Promise.all load → single render pass
8. `f435f4a` — Filter Pause Now to CRM-matched only (reverted: hides bad performers)
9. `55f3f1e` — Creative signature matching (53%→72%) — DISABLED: cross-contaminated CPTQL
10. `f0b0247` — Disable fuzzy match, keep exact + utm_term only (98.4% of matchable ads)

### Afternoon Session (1:30–2:00 PM) — All Phases + Library
11. `1c83f48` — Phases 2,4,5,6,7,9:
    - getPortfolioMetrics() for unified KPIs
    - Remove CMO Decisions + Win/Loss Summary
    - Fix numeric ad IDs (fallback to campaign name)
    - Tag migration: 20+ intermediate→final mappings
    - Weekly trend signals (↑↓→) in Pause Now / Make More
    - Create ICP pills updated, Deep Dive hidden, Top 5/Bottom 5 auto-populate
12. `07b1b2c` — Wire Dashboard KPIs to getPortfolioMetrics (fixes geo filter)
13. `ab40e1b` — Fix Creators (wire to getAdPerformance), Library (wire matchLibraryToLens), funnel bar % (QL→TQL was showing QL→TS)
14. `caafe3b` — Wire Tagger aggregate metrics + Sentinel to clean data layer
15. `037a9da` — Library: add Settings UI + Sheets API (replaces CSV export)
16. `a0302f7` — Fix Library Settings: defer DOM population, preserve tabs config

---

## Architecture (Final State)

```
Boot: Promise.all([
  Supabase → metaAdData (32K daily rows)
  Google Sheets API → leadsData + costData
  Supabase → oracleActions
]) → invalidate caches → single render pass

Data Layer:
  getAdPerformanceDaily(market, from, to)
    → 31K daily rows (Meta spend + CRM leads, joined by name+date+utm_term alias)
  getAdPerformance(market, from, to)
    → aggregated per ad (from daily, 98.4% match rate of matchable ads)
  getPortfolioMetrics(market, from, to)
    → portfolio totals (attributed + unattributed CRM leads)

ALL views now read from this stack:
  Dashboard KPIs       → getPortfolioMetrics
  Pause Now / Make More → getAdPerformance (+ weekly trends via daily)
  Performance          → getAdPerformance + getPortfolioMetrics
  Tagger (all tabs)    → getAdPerformance (via getFilteredTaggerData)
  Creators             → getAdPerformance (via getInfluencerAds)
  Library              → getAdPerformance (via matchLibraryToLens)
  Insights             → getAdPerformance (via getGlobalFilteredTaggerData)
```

---

## Key Findings

### Match Rate Analysis
- 87% of CRM leads match Meta ad names (exact + utm_term alias)
- 98.4% of MATCHABLE ads correctly joined
- 1,732 Meta ads genuinely have 0 CRM leads (brand/slotbook/awareness)
- Fuzzy/creative signature matching DISABLED — cross-contaminated CPTQL (e.g. ₹122 when real avg is ₹16.8K)
- India runs slotbook campaigns → different funnel, no CRM leads by design

### UTM Template Discovery
- All Meta ads use: `utm_term={{ad.name}}` (dynamically inserts ad name)
- 70% of CRM leads have EMPTY mx_utm_term (older ads, UTM not captured)
- 30% have Meta ad name in mx_utm_term → used as alias join key
- CRM mx_utm_adcontent = Meta ad name for 99% of empty-term leads (old UTM template was utm_content={{ad.name}})

### Numbers Consistency (verified)
- Daily ↔ Aggregated: QL ✅, TD ✅ (perfect match)
- 0 campaign_prorated ads (was 100% before fix)
- Funnel bar: QL→TQL now shows correct 65.7% (was wrongly showing QL→TS at 40.1%)

---

## What's Working
- Single data flow across all views
- Weekly trend signals (↑↓→) on Pause Now / Make More
- Notes/feedback on every oracle card
- Tag migration for intermediate taxonomy
- Library: 284 creatives via Sheets API with tags, thumbnails, performance
- Creators wired to clean data layer
- Performance Top 5/Bottom 5 auto-populate
- Dead sections removed

## Known Limitations
- India = slotbook campaigns, no CRM leads (by design, not a bug)
- 30% of Meta ads have 0 CRM match (genuinely 0-lead)
- Tags in _tagMap use old shorthand codes (need re-tag or force migration)
- Supabase 404 on oracle_actions (needs table creation)
- localStorage at 4.44MB limit
- Library fetchTabViaAPI makes redundant metadata call per tab

---

## Still Open (for next session)

### P0: Library Redesign
User wants Library as **operational creative tracker**, not performance dashboard:
- Simplified cards: thumbnail, name, tags, deployment, notes, date
- Remove performance metrics from cards (belongs in Tagger Grid)
- Notion MCP for thumbnails
- Auto-tagging via Lens
- Human notes field per card (Supabase)
- Date picker, recent first, auto-sync new rows
- Manual + auto tag editing
- Full spec in NEXT-SESSION.md

### P1: Tagger
- Update Lens prompt to v2 taxonomy (saved in lens-taxonomy-v2.md)
- Wire Tagger to show only getAdPerformance data (kill state.taggerData dependency for metrics)

### P2: Other
- Data Explorer view (daily table like Ads Manager)
- Kill localStorage for data (Supabase-only)
- Re-run Meta backfill with actions field
- Thumbnail coverage improvement
