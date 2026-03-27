1# Spec: Unified Data Architecture

## Problem
Oracle has its own data pipeline (getOracleMetrics → Perf Tracker + CRM direct) while Sentinel/Lens/Influencer read from tagger data (Meta API + CRM merge). Two pipelines = two sets of numbers = trust breakdown.

## Principle
**One truth, two layers:**
- **Portfolio layer** (totals): CRM direct read for TDs, NRI, Paid. This counts 100% of leads.
- **Creative layer** (breakdown): Tagger data with CRM merge for ad-level attribution.
- Both visible, gap acknowledged.

## Architecture

```
Data Sources:
  Meta API / CSV → state.taggerData (ad-level, tagged, CRM-merged)
  CRM Leads Sheet → state._crmLeads (lead-level, 100% of Meta leads)
  Perf Tracker → state._perfTrackerDaily (campaign-level spend, validation)

Portfolio Totals (Oracle KPI cards, metric ticker):
  Spend: sum from tagger data (ad-level is authoritative for Meta spend)
  TQL/TD/Paid: from CRM direct (state._crmLeads, filtered by date + geo)
  CPTD: tagger spend / CRM TDs (cross-source, most accurate)
  Delta badge: "Tagger matched X of Y CRM TDs (Z%)"

Creative Breakdown (Sentinel, Lens, Influencer, Oracle recommendations):
  ALL read from: tagger data via getFilteredTaggerData() or getInfluencerAds()
  Spend, QL, TD, NRI: from tagger data (CRM-merged)
  Tags, thumbnails, format: from tagger data
  Same filters everywhere: getGlobalDateRange() + geo sync

Oracle Synthesis:
  KPI cards → portfolio layer (CRM totals)
  Pause/Scale/Deploy → creative layer (tagger data, same as Sentinel)
  Influencer Scaling → getInfluencerAds() (same as Influencer tab)
  Market Health → tagger data grouped by geo (same as Sentinel)
  WoW comparison → tagger data, current week vs previous week

Validation Layer:
  Perf Tracker spend vs Tagger spend → delta shown in health panel
  CRM total TDs vs Tagger matched TDs → match rate shown in Oracle
```

## Changes Required

### 1. Oracle KPI cards (renderMetricTicker)
**Current:** Calls getOracleMetrics() which reads Perf Tracker + CRM directly
**Change:**
- Spend: sum from getGlobalFilteredTaggerData() (new function, applies date+geo, NO ₹5K threshold)
- TQL: from CRM direct (keep existing CRM count logic)
- TD: from CRM direct
- CPTD: tagger spend / CRM TDs
- Show match rate badge

### 2. New function: getGlobalFilteredTaggerData()
Same as getFilteredTaggerData() but WITHOUT the ₹5K spend threshold and TD sanitization.
Used by Oracle and Sentinel for unbiased totals.
Lens keeps its ₹5K threshold (it needs quality filtering for insights).

### 3. Oracle Pause/Scale/Deploy sections
**Current:** Some use getOracleMetrics, some use tagger data
**Change:** ALL use tagger data (creative-level decisions need ad-level data)

### 4. Oracle WoW comparison
**Current:** getOracleMetrics with date ranges
**Change:** tagger data filtered to this week vs last week

### 5. Sentinel
**Current:** Reads tagger data directly, no spend threshold
**Change:** Use getGlobalFilteredTaggerData() (same as Oracle) for consistency

### 6. Influencer
Already reads tagger data. Just needs TQL computation (in progress).

### 7. Lens
Keeps getFilteredTaggerData() with ₹5K threshold — this is correct for creative intelligence (noise filtering). But MUST use same date range (already done).

### 8. Health panel
Show:
- "Portfolio: X TDs (from CRM) | Creative: Y TDs (from tagger merge) | Match rate: Z%"
- Spend delta: tagger vs perf tracker

## What NOT to change
- CRM merge logic (mergeCRMWithMeta) — keeps working as-is
- Perf Tracker fetch — keeps working, used for validation
- Tag cache — untouched
- Forge — reads from Lens, untouched
- Library — untouched

## Verification
After changes, on Settings > System Health:
- "Portfolio TDs (CRM)" and "Creative TDs (tagger)" should both show
- Match rate should be 70-90% (some leads won't match)
- Spend delta should be <5%
- All tabs should show same CPTD range (not orders of magnitude apart)
