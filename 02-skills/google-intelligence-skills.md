# Google Creative Dashboard — Master Plan v2

*Built with Godfather's bruises. Verdict-driven. Honest about Google's limits.*
*Locked Apr 28, 2026.*

---

## 0. Godfather mistakes we will NOT repeat

| Godfather mistake | Root cause | Google version prevents by |
|---|---|---|
| 100% conversion "winners" (3 TDs from 3 QLs at ₹7K) celebrated | No `QL > TD` sanity check; clamp artifacts treated as truth | All winner classification requires `QL > TD strictly` AND `QL ≥ TD × 2.5` (≤40% conv ceiling) |
| Sub-₹25K spend "winners" recommended for scaling | No volume floor on Tier classification | Hard volume gates per metric: keyword ≥100 clicks, search term ≥50 imps, asset group ≥30 conversions, campaign ≥₹25K spend, before any verdict fires |
| Fresh ads (<14d) classified before TDs landed | Ignored conversion lag; used cumulative `trials_done==='1'` | `_GOOGLE_COHORT_MATURITY_DAYS[channel]` measured per channel in Phase 0 (Search lag ≠ DGen lag ≠ PMax lag) |
| Hardcoded ₹40K/₹70K thresholds across files | No per-market threshold config | Day-1: `GOOGLE_THRESHOLDS[market][channel]` config object — every threshold reads from it. No magic numbers in render code. |
| "General (BAU/PLA)" silent fallback hid bad data | Parser silently returned label when no match found | Unclassified Google campaigns surface raw name + yellow "unclassified" badge + log to `window.__unclassifiedGoogleCampaigns` for next-pass keyword adds |
| Make More had no feedback loop | Recommendations fire-and-forget, no outcome tracking | **Day 1**: `google_recommendation_log` Supabase table. Recommended → acted/dismissed → outcome measured at +21d → decay patterns that don't move metrics. |
| Cached "General" tags stuck in Supabase after parser fix | One-way write, no re-parse on boot | Parsers idempotent + `_PARSER_VERSION` constant; if version bumps, full re-parse on boot |
| Costs tracker MTD tabs treated as truth, were NRI-filtered subset | Never measured against ground truth | **Phase 0 gate**: every data source measured against CRM truth before any UI built. Confidence interval per metric, published in `dataHealth` view. |
| Meta-only filter on leads dropped 58% of TDs silently | Filter intent not surfaced in UI | Persistent scope chip in header. Every KPI card has scope tooltip. |
| `_isPLACampaignName` substring match misclassified BAU | Used heuristic instead of canonical column | Use canonical `lead_type` column from CRM directly; substring match only as fallback |
| Tagger over-built to 6 sub-tabs, had to consolidate to 3 | Built features before deciding decisions | Verdict-driven phasing — every tab earns its place by surfacing ≥1 acted-on verdict |
| Pause Now caught only 2/10 not-serving Meta statuses | `isPaused()` defined too narrowly | Day-1: `isGoogleEntityActive()` checks status (`ENABLED` only) AND last-7d spend >0 AND `limit_reason` not catastrophic |
| Made `kill` recommendations on historical winners | No "was-a-winner" memory | Refresh-don't-Pause: if asset/keyword/campaign was Tier 1 in last 60d, recommend Refresh not Pause |
| `getMarketMetrics` got bolted on after the fact | KPI source not declared upfront | Day-1: `getGoogleMarketMetrics` is the single canonical KPI source. Documented in code header. No competing math elsewhere. |
| Never measured CRM↔Meta match rate at boot | Tribal knowledge, no monitoring | Boot-time `[Google match rate] X% (Y/Z)` log + `dataHealth` card in UI. Drop below 70% = banner alert. |
| India CRM gap discovered 3 weeks in | Didn't enumerate market-by-market data availability up front | §3 has explicit market × channel × granularity matrix |

---

## 1. Architecture

```
~/Documents/Brain/godfather/
├── index.html                       # Godfather (Meta) — unchanged
├── google.html                      # NEW — Google Creative Dashboard
├── google-ads-script.js             # NEW — runs daily inside Google Ads, writes to Sheet
├── shared/
│   └── cuemath-data.js              # NEW — extracted shared infra (~1,500 lines)
├── CHANGELOG.md                     # shared
└── 02-skills/
    └── google-intelligence-skills.md   # this file
```

**Vendor-copy reversed:** Extract `cuemath-data.js` into `shared/`, both apps load it. ~1 day extra in Phase 0, saves weeks of drift later.

---

## 2. Phase 0 — measure before building (HARD GATES)

Nothing past Phase 0 happens without these four numbers measured and published.

| Gate | What it measures | Pass threshold | If fails |
|---|---|---|---|
| **A. Match rate per channel** | % of Google CRM leads where `mx_utm_adcontent` joins to a Google Ads `ad_id`/`ad_name` | RSA ≥70%, DGen ≥50%, PMax ≥20% | Fix UTM tracking template before continuing |
| **B. Conversion lag per channel** | Days from click to TD, p50/p75/p95 | Documented number | Set `_GOOGLE_COHORT_MATURITY_DAYS[channel]` to p75 |
| **C. Conversion tracking integrity** | Google's reported conversions vs CRM TDs (last 28d) | Within ±15% | Fix Google pixel/offline upload before trusting Google's attribution |
| **D. Market × channel × granularity matrix** | Which markets have asset/keyword/PMax data | Documented per-market | Build availability badges into every view |

Phase 0 deliverable: `google-data-health.html` (or tab) showing all four, refreshed daily. **No further phases start until all 4 gates green.**

---

## 3. Data layer

**Source:** Google Ads Script → Sheet → Sheets API → dashboard.

### Sheet schema — 7 tabs, append-only daily

**Tab 1: `ad_daily`** — campaign_type, ad_id, ad_name, ad_strength, impressions, clicks, cost, conversions, view_through_conversions, market, utm_medium, utm_campaign, ad_final_url

**Tab 2: `rsa_assets_daily`** — asset_type (HEADLINE/DESCRIPTION), asset_text, asset_position, performance_label (BEST/GOOD/LOW/LEARNING/UNRATED), impressions. ⚠️ No conversions per asset — Google doesn't expose.

**Tab 3: `keyword_daily`** — keyword_text, match_type, qs_score, qs_expected_ctr, qs_ad_relevance, qs_landing_page_exp, impressions, clicks, cost, conversions

**Tab 4: `search_terms_daily`** — search_term, matched_keyword, match_type, impressions, clicks, cost, conversions, status (ADDED/EXCLUDED/NONE)

**Tab 5: `pmax_asset_groups_daily`** — asset_group_id, asset_group_name, asset_group_strength, impressions, clicks, cost, conversions

**Tab 6: `pmax_channel_breakdown_daily`** — channel (SEARCH/DISPLAY/YOUTUBE/DISCOVER/GMAIL/MAPS/SHOPPING), impressions, clicks, cost, conversions. ⚠️ Only 14d back via PMax insights API — needs daily snapshot to build history.

**Tab 7: `campaign_diagnostics_daily`** — budget, search_impression_share, search_lost_is_budget, search_lost_is_rank, display_impression_share, status, limit_reason

### Market × channel × granularity matrix

| Market | Search/RSA | DGen | PMax | Search Terms | Diagnostics |
|---|:---:|:---:|:---:|:---:|:---:|
| US | Asset+keyword | Asset | Campaign+asset group+14d channel split | ✓ | ✓ |
| ME | Asset+keyword | Asset | Campaign+asset group+14d channel split | ✓ | ✓ |
| APAC | Asset+keyword | Asset | Campaign+asset group+14d channel split | ✓ | ✓ |
| UK | Asset+keyword | Asset | Campaign+asset group+14d channel split | ✓ | ✓ |
| **India** | Campaign-level only | Campaign-level only | Campaign-level only | Limited | ✓ |

India badge displayed permanently on India views: "India: campaign-level only (no ad-level UTMs in CRM)".

---

## 4. Decision infrastructure

### 4.1 Action queue (top-level, every tab)

Every verdict flows into a unified ranked queue with severity, confidence, effort scores. Sort by `severity × confidence ÷ effort`.

### 4.2 Per-card signal contract

Every recommendation card MUST have: `signal`, `why`, `why_now` (last 24/72h diff), `action`, `severity_score` (₹/wk at stake), `confidence_score`, `effort_score`, `priority`, `guardrail_passed` (list of checks), `outcome_tracker_id`, `market_priority_weight` (US 3× / India 2× / others 1×).

### 4.3 Universal guardrails (apply before any verdict fires)

- Volume floor met (per-metric)
- Cohort matured (≥ p75 lag from Phase 0 Gate B)
- Brand-defense exception (Cuemath/competitor brand keywords protected)
- Learning-mode skipped (ads <14d, asset groups <21d)
- Disapproved/limited check
- Conversion tracking healthy (Phase 0 Gate C green)
- Recently-recommended skipped (<72h after dismissal)
- Market priority enforced (never recommend reducing US budget without confirmation)

### 4.4 Outcome tracking (Supabase)

```sql
CREATE TABLE google_recommendation_log (
  id uuid PRIMARY KEY,
  verdict_type text,
  entity_type text,
  entity_id text,
  market text,
  signal jsonb,
  recommended_at timestamp,
  acted_at timestamp,
  dismissed_at timestamp,
  outcome_measured_at timestamp,
  lift_observed numeric,
  status text
);
```

Nightly job: for `acted` recommendations, measure outcome at +21d. For verdict types where >50% of acted recommendations show no lift, decay the trigger threshold.

### 4.5 "Why now?" engine

Every alert pairs with: last 24h/72h diff, recent config changes (from Google Ads change history API), Auction Insights delta, conversion tracking delta. Surfaced as collapsible "What changed" section.

### 4.6 Brand / Non-Brand toggle (top-level, alongside BAU/PLA)

Every metric splits. Default view: Non-Brand.

---

## 5. Verdict catalog (18 verdicts, exact list)

| # | Verdict | Channels | Trigger | Action mechanism |
|---|---|---|---|---|
| 1 | Add Negative | Search, PMax | Search term ≥₹X spend over 14d, 0 TDs, not brand-protective | Bulk CSV → Google Ads |
| 2 | Pause Keyword | Search | Keyword ≥₹X spend over 14d, < market floor TDs | Bulk CSV |
| 3 | Pause Campaign | All | QL>0 over 14d but 0 TDs across mature window, no upstream cannibalization | Direct link |
| 4 | Refresh RSA Asset | Search | Performance label drift Best→Low / asset >90d / ad strength dropped | Suggested replacement copy from top siblings |
| 5 | Refresh Asset Group | DGen, PMax | Asset group >60d declining / strength dropped | Brief generated from top siblings |
| 6 | Scale Up Keyword | Search | Tier 1 mature AND `lost_is_budget` >10% | Quantified: "+₹X → +Y TDs" |
| 7 | Scale Up Asset Group | DGen, PMax | Tier 1 mature AND budget-capped | Reallocate or clone with new audience signal |
| 8 | Reallocate Budget | All | High-performer at cap + low-performer with headroom | Quantified, reversible |
| 9 | Cannibalization Alert | PMax vs Brand/Generic | Brand IS dropped >5pp coincident with PMax change; or PMax+Generic same-keyword overlap | Quantified incrementality estimate |
| 10 | Geographic Bid-Up | Search, DGen | Per-DMA/state CPTD significantly better than account avg AND not at full IS | Per-state recommendations |
| 11 | Theme Expansion | Search | Theme cluster of search terms high-converting, only matched by broad — exact missing | Bulk export |
| 12 | Day-Part Optimization | All | Hour×day TD-rate matrix shows 2x+ swings while bids flat | Suggested schedule |
| 13 | Disapproved Ads Alert | All | Disapproved/limited count >0 | Per-ad list |
| 14 | Conversion Tracking Health | Account | Phase 0 Gate C drift >15% | Diagnostic checklist |
| 15 | Brand Health Alert | Brand Search | Brand IS <90% OR competitor entered top 3 in Auction Insights | Quantified |
| 16 | Pollinate to Meta | Cross-channel | Top Google insight not yet in Meta | One-click export to Godfather brief generator |
| 17 | Audience Signal Saturation | DGen, PMax | CPM up >40% over 28d on custom segment, CTR declining | Build lookalike from top converters |
| 18 | LP Performance Alert | All | LP variant CR below avg AND clicks ≥ threshold | Diagnostic |

Stored in `GOOGLE_VERDICTS` config object. No verdict logic inline in render code.

---

## 6. Tab structure

| Tab | Verdicts surfaced | Read-only context |
|---|---|---|
| Overview | 8, 9, 14, 15 | KPIs (Brand/Non-Brand split), funnel by channel, market health, action queue snapshot |
| RSA | 1, 2, 4, 6, 11 | Asset performance grid, ad-level CTR & TD |
| DGen | 5, 7, 17, 18 | Asset performance, audience signal performance, placement breakdown |
| PMax | 5, 7, 9, 17 | Asset group performance, audience signals, 14d channel split, listing groups |
| Search Terms | 1, 11 | Theme-clustered browser, brand vs generic vs competitor, waste ranking |
| Diagnostics | 12, 13, 14, 15, 18 | QS components (3 separate, not 1), IS lost-to-budget vs lost-to-rank rolling 7d, disapproved queue, change history feed |
| Action Queue (global) | All 18 sorted | Today's task list, bulk actions, outcome tracking dashboard |
| Pollinate to Meta | 16 | Top Google insights with one-click brief export |

Every tab opens to "what's broken / what's working" verdict block. Read-only context below the fold.

---

## 7. Verdict-driven phasing (8-9 weeks)

| Phase | Ships | Effort |
|---|---|---|
| 0 | Google Ads Script + Sheet + 4 data-health gates measured | 5-7 days |
| 1 | Shared `cuemath-data.js` extraction, validated against Godfather | 2 days |
| 2 | `google.html` skeleton + Brand/Non-Brand toggle + Action Queue surface + outcome tracking schema | 3 days |
| 3 | Verdict #1 Add Negative end-to-end | 4 days |
| 4 | Verdict #2 Pause Keyword + #15 Brand Health Alert | 4 days |
| 5 | Verdict #8 Reallocate Budget with quantified math | 5 days |
| 6 | Verdicts #6+#7 Scale Up Keyword + Asset Group | 5 days |
| 7 | Verdict #9 Cannibalization Alert | 5 days |
| 8 | Verdicts #4+#5 Refresh RSA + Asset Group with brief generation | 5 days |
| 9 | Verdict #11 Theme Expansion + #10 Geographic Bid-Up | 4 days |
| 10 | Verdict #16 Pollinate to Meta | 4 days |
| 11 | Verdicts #12, #13, #14, #17, #18 (Diagnostics) | 5 days |
| 12 | Outcome tracking analysis — first decay pass | 2 days |

Each phase delivers a verdict the user acts on by Friday.

---

## 8. Meta-pattern transfers (vendor or adapt from Godfather)

| Godfather | Google adaptation |
|---|---|
| `_COHORT_MATURITY_DAYS = 14` | `_GOOGLE_COHORT_MATURITY_DAYS[channel]` — measured per channel |
| `SENTINEL_THRESHOLDS[market]` | `GOOGLE_THRESHOLDS[market][channel]` |
| `_classifyWinner` | `_classifyGoogleWinner` (same gates: volume + maturity + QL>TD + conv ceiling) |
| `_winnerWhy` | `_googleWhyWorked` |
| `isPaused()` (10 statuses) | `isGoogleEntityActive()` (status + spend liveness + disapproval) |
| `_livenessSet` | `_googleLivenessSet` |
| `_isPLACampaignName` substring | **Don't repeat** — use canonical `lead_type` column |
| `normalizeAdName` + suffix matching | Reuse as-is |
| `AUDIENCE_FAMILIES` | `GOOGLE_KEYWORD_FAMILIES`, `GOOGLE_AUDIENCE_SIGNAL_FAMILIES`, `PMAX_ASSET_GROUP_FAMILIES` |
| Refresh-don't-Kill | Same pattern, applied to RSAs/keywords/asset groups |
| `_formatAudience` | `_formatGoogleTargeting` |
| Tag definitions modal + tooltips | `GOOGLE_TERM_DEFINITIONS` (QS components, IS, ad strength, performance label) |
| Per-card "Signal + Why + Action" | Enforced via shared `Card` component |
| `_renderMarketHealthRow` | Reuse, add channel dimension |
| Boot-time match-rate logging | Extended: per-channel match rate + Phase 0 gates published |
| Tag operations bar simplification | Day-1: single primary action per row, others in overflow |
| Data Table 3-level tree | `Account → Campaign → Ad Group → Ad/Keyword/Asset` 4-level |
| Phase 7 winner tightening (QL>TD sanity, ≥₹25K, conv ceiling) | All gates ported, calibrated per channel |

NOT carried forward:
- Hardcoded magic numbers anywhere — config object only
- Substring-based BAU/PLA detection — canonical column
- Cached parsed values without version stamp — `_PARSER_VERSION`
- Competing KPI sources — `getGoogleMarketMetrics` is canonical
- Cluster-level Make More — go ad/keyword/asset-level from day 1

---

## 9. Cross-channel pollination (Verdict #16)

| Google insight | Meta artifact |
|---|---|
| Top-converting search term theme | Meta interest-targeting brief |
| Top-performing audience signal | Meta lookalike seed (top converters) |
| Top-performing RSA headline | Meta ad copy hook → Godfather brief generator |
| Top-converting LP variant | Meta destination URL |
| Geographic pocket > avg | Meta geo-targeting refinement |
| Brand search lift | Meta brand campaign budget recommendation |

UI: top 20 Google insights ranked by cross-channel transferability score. One-click → Godfather brief generator opens prefilled.

---

## 10. What's needed before Phase 0

1. Google Ads admin access (someone with admin runs the script — see access notes below)
2. Destination Sheet — new "Google Ads Data" or add tabs to existing perf tracker
3. Confirm `mx_utm_adcontent` Google value structure (ad ID? template value?)
4. Brand keyword list per market (brand-defense exception list for Verdict #1)
5. Account → market → channel mapping
6. Confirm extraction of `cuemath-data.js` (slightly more architecture)

---

## 11. Honest scope/timeline

**8-9 weeks of focused work.**

MVP cut available: Phases 0-4 only (Add Negative + Pause Keyword + Brand Health) = ~4 weeks. Tool useful but narrow.

---

## 12. Open risks

| Risk | Probability | Mitigation |
|---|---|---|
| Match rate < threshold for non-Brand Search | High | Phase 0 Gate A measures it; fix UTM template before building |
| PMax asset group reporting too sparse | Medium | Honest framing: PMax tab might be 1 verdict only (cannibalization) |
| Google Ads Script daily quota limits | Low-Medium | Split per account; stagger run times |
| India campaign-level only kills India tab | Acknowledged | India badge + degraded view per §3 matrix |
| Outcome tracking signal too noisy <90d | Medium | Feedback loop matures over months |
| Bidding strategy comparison needs more volume than 5-person account generates | Medium | Defer to Phase 12+ |
