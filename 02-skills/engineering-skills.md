# Engineering Skills — Data Pipeline + QA/Debugging

> **Purpose:** Codify the data pipeline knowledge that prevents session-killing bugs. Every join, every normalization, every known anti-pattern — documented once, referenced forever.
> **Created:** April 16, 2026 | **Source:** 9-commit CRM→Meta matching overhaul + 4 months of pipeline debugging

---

## SHARED DATA BLOCKS

All engineering skills reference these. Updated when the pipeline changes.

### UTM Schema (Confirmed Apr 16, 2026)

**Source:** Perf UTM Nomenclature doc + verified against actual sheet headers.

Cuemath's UTM parameters do NOT follow standard web analytics conventions:

| UTM Parameter | Standard Meaning | Cuemath Meaning (Meta) |
|---------------|-----------------|----------------------|
| `utm_source` | Traffic source | Channel: `dc_fb_m` (US/ANZ/UK), `d_fb_m` (India) |
| `utm_medium` | Medium (email, cpc) | **Campaign Name** |
| `utm_campaign` | Campaign name | **Ad Set Name** |
| `utm_term` | Keyword | **Ad Name** (new-style only) |
| `utm_content` | Ad variation | **Ad Name with placement suffix** (old-style) or **numeric Facebook ad ID** (new-style) |

**Two coexisting UTM schemes:**

| Scheme | When | `mx_utm_adcontent` | `mx_utm_term` | Matching |
|--------|------|-------------------|---------------|----------|
| Old (pre-Jan 2026) | LP campaigns | Text ad name + placement suffix | Empty | Direct match after normalizeAdName strips suffix |
| New (Jan 2026+) | Instant forms / PLA | Numeric Facebook ad ID (e.g., `120239274237860278`) | Text ad name (short creative) | Boot resolution → ad ID match + bidirectional suffix |

**India CRM exception:** No `mx_utm_adcontent` or `mx_utm_term` columns at all. Only `mx_utm_medium` (campaign) and `mx_utm_campaign` (adset). Ad-level matching impossible — campaign/adset level only via `mergeCRMWithMeta` token overlap.

### Boot Sequence

Exact order from `init()`:

```
Phase 1: localStorage cache load (instant fallback)
    ↓
Phase 2: Promise.all([
    Supabase metaAdData (32K rows, paginated)     ─┐
    Supabase oracle_actions                         │ All parallel
    Supabase library_assets                         │
    Google Sheets: fetchSheetData (CRM+cost)        │
        → then fetchPLAData (4 PLA tabs)            │ Chained sequentially
        → then fetchIndiaCRM                       ─┘
    Supabase generation_history (last 50)
])
    ↓
Phase 3: Post-load processing (sequential):
    1. buildLookupMaps()          — _campaignMap, _adMap, _tagMap
    2. Ad name resolution         — numeric IDs → names from mx_utm_term or metaAdData
    3. PLA lead tagging           — _source='pla' + _trialBooked on main-sheet PLA leads
    4. mergeCRMWithMeta()         — token overlap join for tagger enrichment
    5. Auto-hydrate tagger data   — useDashboardData() if taggerData empty
    6. invalidateAdPerfCache()    — clear stale caches
    7. Render                     — navigateTo('dashboard')
```

**Critical timing:** buildLookupMaps MUST run before any metric computation. Resolution MUST run before mergeCRMWithMeta. All data sources MUST be loaded before rendering.

### Function Registry

Referenced by function name (grep-stable). Search with: `grep -n "function <name>" index.html`

#### Data Fetching
| Function | Purpose | Inputs | Outputs |
|----------|---------|--------|---------|
| `fetchSheetData` | CRM leads + cost from Google Sheets (leads!A:BW, cost!A:O) | sheetUrl, apiKey | Populates `leadsData[]`, `costData[]` |
| `fetchPLAData` | PLA/Eval leads + cost from 4 tabs. Deduplicates by prospectid. Enriches main-sheet duplicates with `_trialBooked` | apiKey | Appends to `leadsData[]`, `costData[]` |
| `fetchIndiaCRM` | India CRM leads (different column semantics). Deduplicates by prospectid | apiKey | Appends to `leadsData[]` |
| `loadCachedAdData` | metaAdData from Supabase (paginated, 32K rows) | — | Populates `metaAdData[]` |
| `fetchMetaAdInsights` | Daily spend/impressions/clicks from Meta API (incremental sync) | force | Upserts Supabase + updates `metaAdData[]` |
| `fetchMetaCreatives` | Creative assets (thumbnails) from Meta API | force | Updates `metaCreatives[]` |

#### Normalization
| Function | Purpose | Key behavior |
|----------|---------|-------------|
| `normalizeAdName` | Strips placement suffixes, em dashes, " – Copy", normalizes separators | `_facebook_mobile_feed_fb` → removed. Hyphens → underscores |
| `normalizePLALead` | PLA lead normalization: utm_source → medium, ip_region → country_bucket, PLA QL = all leads | Returns null for non-Meta. Sets `_source: 'pla'`, `_trialBooked` |
| `normalizeIndiaLead` | India CRM: swaps mx_utm_medium→campaign, mx_utm_campaign→adcontent, overrides country to 'India' | Returns null for non-Meta. Sets `_source: 'india_crm'` |
| `extractTokens` | Token extraction for fuzzy matching: strips noise/geo tokens, min 3 chars | Used by `mergeCRMWithMeta` for ad-content-level matching |
| `stripCampaignPrefix` | Display-only: removes geo prefix + `FB_Leads-Conv_` + date suffix | NEVER use for matching — only for UI display |

#### Matching / Joining
| Function | Purpose | Match tiers |
|----------|---------|------------|
| `getAdPerformanceDaily` | **THE foundational join.** Meta daily spend ↔ CRM daily leads, keyed by normalizedAdName + date | 1. Exact name → 2. utm_term alias → 3. Ad ID (_origAdId = meta.ad_id) → 4. Bidirectional suffix |
| `getAdPerformance` | Aggregates daily rows by ad name. Enriches with tags. Returns canonical format for ALL views | Calls `getAdPerformanceDaily`, groups by ad, enriches from `_tagMap` |
| `mergeCRMWithMeta` | Token overlap join for tagger enrichment. 2-tier: direct ad-content (0.65 threshold) + campaign fallback | Only for `state.taggerData` enrichment. Idempotent (checks mergeKey) |
| `buildLookupMaps` | Builds `_campaignMap` (campaign→spend from costData), `_adMap` (ad→thumbnail from metaCreatives), `_tagMap` (ad→tags from taggerData) | Must run after all data loads. Called by boot + data refresh |

#### Filtering
| Function | Purpose | Key logic |
|----------|---------|----------|
| `_filterLeadsByFlow` | BAU/PLA lead filter | Checks `_source === 'pla'` OR `_isPLACampaignName(mx_utm_medium)` |
| `_filterCostByFlow` | BAU/PLA cost filter | Checks `_source === 'pla'` OR `_isPLACampaignName(campaign_name)` |
| `filterLeadsByMarket` | Geo filter for leads | Matches `country_bucket` with ME/MEA equivalence, AUS campaign detection |
| `filterCostByMarket` | Geo filter for cost | Matches `country_segment` with APAC sub-geo prefix logic |
| `_isPLACampaignName` | PLA/Eval detection | Checks for `_pla_`, `pla_`, `_eval_` etc. in campaign name |
| `_isLPCampaign` | Landing page vs instant form detection | Returns false for LeadGen/Leap/instant/on_facebook. PLA/Eval pass through |

#### Metrics
| Function | Purpose | Data source |
|----------|---------|------------|
| `getMarketMetrics` | **Dashboard KPI source of truth.** All 11 metrics from costData + leadsData directly | costData (spend), leadsData (QL/TQL/TD/TS/enrolled) |
| `getPortfolioMetrics` | Attributed + unattributed leads. Used for per-ad attribution views | getAdPerformance (attributed) + raw leadsData (unattributed) |
| `computeTQL` | Market-aware TQL: US=NRI, India=IB/IGCSE board, MEA=IB/IGCSE, others=all QL | Scalar inputs only |
| `getSpend`, `getQL`, `getTQL`, `getTD_snapshot`, `getTD_cohort`, `getTS`, `getEnrolled`, `getInvalid`, `getNRI`, `getAsian` | 10 primitive metric functions | All read from costData/leadsData with flow + market + date filters |
| `sanitizeTaggerData` | Zeros TD on false CRM matches (CPTD < market floor, TD > QL on low-QL) | Market-aware CPTD floors: US ₹5K, India ₹1.5K, MEA ₹3K |

### CRM Column Mappings

**Main CRM (leads!A:BW) — 75 columns:**
| Position | Column | Usage |
|----------|--------|-------|
| 1 (B) | `lead_created_date` | Date filtering for QLs |
| 2 (C) | `prospectid` | Deduplication key |
| 5 (F) | `country_bucket` | Geo filtering |
| 6 (G) | `ethnicity` | NRI detection |
| 7 (H) | `utm_medium` | "meta" filter (raw channel) |
| 8 (I) | `mx_utm_medium` | Campaign name (per UTM nomenclature) |
| 9 (J) | `mx_utm_campaign` | Ad Set name |
| 10 (K) | `mx_utm_adcontent` | Ad name (text) or numeric ad ID |
| 11 (L) | `mx_utm_term` | Ad name (new-style, post-Jan 2026) |
| 12 (M) | `landing_type` | Targeting type (Custom Audience, Lookalike, Interest) |
| 13 (N) | `qls` | QL flag (0/1) |
| 15 (P) | `trials_sch` | Trial scheduled (0/1) |
| 18 (S) | `trials_done` | Trial done (0/1) |
| 21 (V) | `paid` | Enrolled (0/1) |
| 72 (BU) | `board (ME)` | IB/IGCSE board for India/MEA TQL |

**Cost tab (cost!A:O) — 15 columns:**
| Position | Column | Usage |
|----------|--------|-------|
| 1 (B) | `day` | Date |
| 3 (D) | `country_segment` | Geo |
| 5 (F) | `campaign_name` | Campaign (actually adset-level in cost tab) |
| 7 (H) | `medium` | "meta" filter |
| 8 (I) | `amount_spent` | INR spend |

**India CRM — 26 columns:**
| Position | Column | Usage |
|----------|--------|-------|
| 5 (F) | `board` | IB/IGCSE for TQL |
| 7 (H) | `mx_utm_medium` | Campaign name (swapped to mx_utm_campaign by normalizer) |
| 8 (I) | `mx_utm_campaign` | Ad Set name (swapped to mx_utm_adcontent by normalizer) |
| — | `mx_utm_adcontent` | **Does not exist** |
| — | `mx_utm_term` | **Does not exist** |

### Match Rate Expectations (excl. India)

| Market | Expected | Red Flag | Source |
|--------|----------|----------|--------|
| US | >95% | <85% | Apr 2026 verified: 95.8% |
| APAC | >93% | <80% | Apr 2026 verified: 94.9% |
| MEA | >95% | <85% | Apr 2026 verified: 96.8% |
| UK | >93% | <80% | Apr 2026 verified: 95.6% |
| India | N/A | N/A | No ad-level UTMs — campaign level only |
| **Overall** | **>95%** | **<85%** | **Apr 2026: 96.0% (was 69.9% before fix)** |

**Match rate by month trend (canary metric):**
| Month | Rate | Notes |
|-------|------|-------|
| Nov 2025 | 80.6% | Few leads, old UTMs only |
| Dec 2025 | 91.7% | |
| Jan 2026 | 94.8% | First numeric IDs appear (10%) |
| Feb 2026 | 96.3% | 27% numeric |
| Mar 2026 | 96.0% | 26% numeric |
| Apr 2026 | **99.1%** | 49% numeric — highest resolution rate |

### Known Anti-Patterns

| # | Symptom | Root Cause | Fix | CHANGELOG |
|---|---------|-----------|-----|-----------|
| AP-01 | 0% PLA CRM match | Using raw `mx_utm_adcontent` (numeric ad ID) without resolving to ad name | Boot resolution: `mx_utm_term` → `mx_utm_adcontent`, fallback to metaAdData ad_id lookup | 2026-04-16 |
| AP-02 | India TQL = 0 | `leads!A:BG` range missed `board (ME)` at column 73 | Expanded to `leads!A:BW` (75 columns) | 2026-04-16 |
| AP-03 | Cost spend = 0 | `cost!A:H` missed `amount_spent` after `type` column inserted at position G | Expanded to `cost!A:O` (15 columns) | 2026-04-16 |
| AP-04 | Dashboard KPI uses wrong spend | `getPortfolioMetrics` uses Meta API spend (incomplete: India 3.6%, PLA 20%) | Dashboard KPIs use `getMarketMetrics` (reads costData directly) | 2026-04-14 |
| AP-05 | PLA QL discards 86% of leads | Checking `qualified_bucket` on PLA leads (484/560 have empty bucket) | PLA: all Meta leads are QLs (self-serve signup = qualified) | 2026-04-14 |
| AP-06 | QL=TD everywhere (100% conversion) | Flooring CRM `ql` to `td` in merge (should be independent counts) | Remove flooring — ql and trials_done are separate CRM fields | 2026-04-09 |
| AP-07 | Matched instant forms show 0 QLs | `getAdPerformance` zeroes CRM for all non-LP campaigns regardless of match | Only zero when `hasCRM=false` (no actual CRM match) | 2026-04-16 |
| AP-08 | Instant forms excluded from Sentinel/portfolio | `includeNonLP` defaults to false in `getAdPerformance` | Flipped default to true. All 15 callers now include instant forms | 2026-04-16 |
| AP-09 | PLA leads from main sheet invisible in PLA flow | `_filterLeadsByFlow` only checked `_source === 'pla'` | Added `_isPLACampaignName(mx_utm_medium)` fallback (matches `_filterCostByFlow` pattern) | 2026-04-16 |
| AP-10 | PLA TQL 3x undercounted | Main sheet PLA leads used `trials_sch` for `_trialBooked` (161 scheduled vs 516 booked) | PLA dedup enrichment: update `_trialBooked` from PLA sheet's `trial_request` | 2026-04-16 |
| AP-11 | Suffix match only one direction | CRM short name checked as suffix of Meta long name, but not vice versa | Bidirectional: also check Meta short name as suffix of CRM long name | 2026-04-16 |

---

## SKILL 1: DATA ENGINEERING

### Role

You are Sentinel's data engineer — the guardian of Godfather's data pipeline. You understand how data enters from 3 Google Sheets + 3 Meta API accounts + Supabase, how it gets normalized, matched, and joined, and what the expected shapes and rates are at each step.

When someone reports wrong numbers, missing leads, or "no CRM link" errors, you diagnose the pipeline — not the UI.

### Output Format

#### Data Pipeline Health Report

**VERDICT:** [One sentence: pipeline healthy / degraded / broken]

---

**SECTION 1: Boot Audit**
| Source | Expected | Actual | Status |
|--------|----------|--------|--------|
| leadsData (intl) | 7,000+ | [N] | [G/A/R] |
| leadsData (PLA) | 500+ | [N] | [G/A/R] |
| leadsData (India) | 6,000+ | [N] | [G/A/R] |
| costData | 5,000+ | [N] | [G/A/R] |
| metaAdData | 30,000+ | [N] | [G/A/R] |

**SECTION 2: CRM→Meta Match Rate**
| Market | Direct | Alias | Ad ID | Suffix | Unmatched | Rate | vs Expected |
|--------|--------|-------|-------|--------|-----------|------|-------------|
| US | [N] | [N] | [N] | [N] | [N] | [X]% | [G/A/R] |
| ... | | | | | | | |

**SECTION 3: Column Mapping Verification**
- leads tab columns: [count] — `board (ME)` present: [Y/N]
- cost tab columns: [count] — `amount_spent` present: [Y/N]
- India CRM columns: [count] — `mx_utm_term` present: [Y/N]

**SECTION 4: Anti-Pattern Scan**
[Check each AP-01 through AP-11. Flag any that are recurring.]

---

### Analysis Framework

#### Step 1: Verify Boot
Check console for `Boot: ALL data ready — metaAdData:X, leadsData:Y, costData:Z`. If any count is 0, the source failed.

#### Step 2: Check Resolution
Check console for `Post-boot ad resolve: X from utm_term, Y from ad ID lookup, Z empty backfilled, W PLA-tagged`. If X is 0 and there are 2026 leads, the resolution code isn't running.

#### Step 3: Check Match Rate
```js
// Run in browser console:
const ads = getAdPerformance('US');
const matched = ads.filter(a => a._hasCRM).length;
console.log(`US: ${matched}/${ads.length} = ${(matched/ads.length*100).toFixed(1)}%`);
// Repeat for APAC, MEA, UK
```

#### Step 4: Check for Anti-Patterns
```js
// AP-01: Numeric ad IDs still unresolved?
leadsData.filter(r => /^\d{10,}$/.test((r.mx_utm_adcontent||'').trim())).length
// Should be 0 after boot resolution

// AP-07: Matched instant forms zeroed?
getAdPerformance('US').filter(a => a._hasCRM && a['QL'] === 0 && a['Spent'] > 10000).length
// Should be 0

// AP-08: Instant forms included?
getAdPerformance('US').filter(a => !a._isLP).length
// Should be > 0 (instant forms present)
```

#### Step 5: Validate Column Mappings
```js
// Check a sample lead has expected fields
const sample = leadsData.find(r => r.mx_utm_term && r.lead_created_date > '2026-04-01');
console.log('adcontent:', sample?.mx_utm_adcontent?.slice(0,50), 'term:', sample?.mx_utm_term?.slice(0,50));
// adcontent should be resolved (text, not numeric)
```

### When Reporting

Lead with the verdict. If healthy: "Pipeline healthy — 96% match rate, all sources loaded." If degraded: name the specific failure and the anti-pattern number: "AP-03 recurring — cost tab returning 0 rows, check column range."

---

## SKILL 2: QA / DEBUGGING

### Role

You are Sentinel's QA engineer. When something looks wrong in the data, you follow the "pick 3, trace, verify" protocol. You never declare "sweep complete" without testing against real data samples.

### Output Format

#### Debugging Report

**VERDICT:** [Root cause in one sentence]

---

**SECTION 1: Sample Cases**
| # | Ad Name | Spend | QL | TD | Signal | Why Picked |
|---|---------|-------|----|----|--------|-----------|
| 1 | [name] | [₹] | [N] | [N] | [no CRM / 0 TD / suspicious CPTD] | Highest-spend unmatched |
| 2 | [name] | [₹] | [N] | [N] | [...] | Suspicious low-CPTD |
| 3 | [name] | [₹] | [N] | [N] | [...] | Newest unattributed |

**SECTION 2: Per-Case Trace**
For each case:
1. Raw CRM data: `mx_utm_adcontent` = ?, `mx_utm_term` = ?, `_origAdId` = ?
2. After normalization: `normalizeAdName(resolved)` = ?
3. Meta ad name: `normalizeAdName(meta_ad_name)` = ?
4. Match attempt: direct [Y/N], alias [Y/N], ad ID [Y/N], suffix [Y/N]
5. Render gate: `_isLPCampaign` = ?, `hasCRM` = ?, zeroed = ?

**SECTION 3: Diagnosis**
[Which step broke and why. Reference anti-pattern number if known.]

**SECTION 4: Fix**
[Specific code change or data correction needed.]

---

### Analysis Framework

#### Step 1: Pick 3 Problem Cases
From the live dashboard, pick:
1. **Highest-spend ad with "no CRM link"** — from Pause Now cards
2. **Suspicious low-CPTD** — CPTD < ₹5K (likely false CRM match)
3. **Newest lead with no attribution** — from Apr 2026 data

#### Step 2: Fetch CRM Data for Each
```js
// Find CRM leads for a specific ad/campaign
leadsData.filter(r => (r.mx_utm_medium||'').includes('CAMPAIGN_KEYWORD')).slice(0,3)
  .map(r => ({
    campaign: r.mx_utm_medium?.slice(0,50),
    adcontent: r.mx_utm_adcontent?.slice(0,50),
    term: r.mx_utm_term?.slice(0,50),
    origAdId: r._origAdId,
    source: r._source
  }))
```

#### Step 3: Simulate Normalization
```js
// Compare normalized names
const crmNorm = normalizeAdName('CRM_ADCONTENT_HERE');
const metaNorm = normalizeAdName('META_AD_NAME_HERE');
console.log('CRM:', crmNorm);
console.log('Meta:', metaNorm);
console.log('Direct match:', crmNorm === metaNorm);
console.log('Meta ends with CRM:', metaNorm.endsWith(crmNorm));
console.log('CRM ends with Meta:', crmNorm.endsWith(metaNorm));
```

#### Step 4: Check Render Path
```js
// Does _isLPCampaign gate block it?
_isLPCampaign({campaign: 'CAMPAIGN_NAME', adName: 'AD_NAME'})
// If false + hasCRM false → CRM zeroed. If false + hasCRM true → CRM kept.
```

#### Step 5: Verify Bidirectionally
Always check BOTH:
- **CRM→Meta:** Do CRM leads for this campaign have resolvable ad names?
- **Meta→CRM:** Does the Meta ad name normalize to something any CRM lead would match?

If CRM→Meta works but Meta→CRM fails, the join key is different on each side.

### Known Failure Modes Registry

| Symptom | Root Cause | Fix | Session |
|---------|-----------|-----|---------|
| "no CRM link" on all PLA ads | Numeric ad IDs not resolved | Boot resolution from mx_utm_term | Apr 16 |
| "no CRM link" on LeadGen/FORMS ads | getAdPerformance zeroes non-LP ads | Only zero when hasCRM=false | Apr 16 |
| "no CRM link" despite CRM leads existing | Suffix match only one direction | Bidirectional suffix in getAdPerformanceDaily | Apr 16 |
| QL=TD on every ad (100% conversion) | CRM merge floored ql to td | Removed flooring | Apr 9 |
| India CPTD wrong | India CRM UTM swap not applied | normalizeIndiaLead swaps mx_utm_medium→campaign | Apr 7 |
| PLA TQL undercounted 3x | Main sheet used trials_sch not trial_request | PLA dedup enrichment from PLA sheet | Apr 16 |
| Spend shows 0 after sheet change | Column range too narrow after new column insert | Verify A:O (cost) and A:BW (leads) cover all fields | Apr 16 |
| Match rate dropping month-over-month | UTM scheme changed (numeric ad IDs) without code update | Monitor % numeric in mx_utm_adcontent monthly | Apr 16 |

### When Reporting

NEVER say "sweep complete" or "all fixed" without:
1. Picking 3+ specific problem cases
2. Fetching their actual CRM data
3. Tracing through normalization + matching
4. Verifying the render path doesn't zero/drop them
5. Checking the console output matches expectations

Per [[feedback_sweep_means_test_data.md]]: "Don't just grep code. Fetch actual problem cases, trace through pipeline, verify output."
