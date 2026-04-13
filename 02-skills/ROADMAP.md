# Godfather Roadmap — Segwise-Level Reporting

> **Goal:** Match Segwise's creative intelligence for Meta, exceed it with full-funnel depth, across all 6 markets.
> **Created:** April 13, 2026 | **Source:** Full 3-agent audit of all views + Segwise competitive analysis

---

## Phase 0: Hygiene — COMPLETE (Apr 13)

All shipped. 11 commits (4082b0d → b25b6f8).

- [x] Reusable `_colSort()` on 4 tables (28 sortable columns with arrows)
- [x] shortAdName on campaign/ad-set group rows
- [x] Library geo filter unhidden
- [x] Insights geo filter unhidden
- [x] `_perfInsight` market-aware spend thresholds
- [x] Grid empty state
- [x] Top5/Bottom5 header tooltips
- [x] Creators sort dropdown (5 options)
- [x] Winning Formula indicator unhidden
- [x] India CRM integration (fetchIndiaCRM, 6,810+ leads)
- [x] AUS→US data leak fixed (Set.has instead of includes)
- [x] Case-sensitive TQL fixed across 3 paths
- [x] 44 doc issues fixed (thresholds, wiki-links, tag codes, stale refs)

---

## Phase 1: BAU vs PLA Split — COMPLETE (Apr 14)

**Goal:** PLA is 50% of US campaigns and invisible. Make it a first-class data dimension.

**Why:** PLA (automated, no sales call) has fundamentally different funnel dynamics than BAU (sales-led). Mixing them produces misleading CPTD numbers. The summary doc tracks them separately (Section 2 vs Section 7). Godfather should too.

- [x] 1.1 **Global BAU/PLA filter toggle** — 3-way pill toggle (All/BAU/PLA) in global filter bar. `getFlowFilter()`, `setFlowFilter()`, `_isPLACampaignName()`, `_filterLeadsByFlow()`, `_filterCostByFlow()`.
- [x] 1.2 **Flow filter wired into all data paths** — All 10 metric primitives, getAdPerformanceDaily, getAdPerformance, getPortfolioMetrics, getOracleMetrics, getCampaignBreakdown, getAdBreakdown, getAdCampaignBreakdown, WoW CRM, trend charts.
- [x] 1.3 **PLA funnel card** — Timeout Rate, TS→TD%, Spend Share in `renderBauPlaComparison()`.
- [x] 1.4 **BAU vs PLA comparison table** — 9 metrics side-by-side (Spend, QL, TS, TD, Enrolled, CPTD, QL→TD%, QL→TS%, CAC) with colored deltas.
- [x] 1.5 **PLA timeout metric** — (QL - TS) / QL, color-coded severity.

**Validation:** Switch All/BAU/PLA. Verify Dashboard, Performance, Tagger, Insights all respect toggle. Verify BAU-only numbers match pre-change numbers exactly.

### Phase 1.5: Critical Fixes — COMPLETE (Apr 14)

- [x] 1.6 **PLA end-to-end data pipeline** — Sheet switch to 175i57-..., pla_ac_dump (286 leads), pla_ac_cost (137 Eval rows), normalizeAdName em dash fix, Eval campaign support
- [x] 1.7 **PLA QL = all leads** — 484/560 had empty qualified_bucket. BAU logic discarded 86%.
- [x] 1.8 **PLA TQL = Trials Booked** — trial_request non-empty. All 4 TQL paths updated.
- [x] 1.9 **Dashboard KPIs → getMarketMetrics** — Meta API spend incomplete for India (3.6%) and PLA (~20%). Switched to costData (source of truth) universally.
- [x] 1.10 **Trend arrow noise** — Suppress near-zero prior ("new" badge), cap >200% (multiplier format), remove "→ flat".
- [x] 1.11 **PLA KPI card swap** — 4th card = "Trials Booked" with booking rate (was Enrolled/CAC).
- [x] 1.12 **PLA insight adaptation** — Wrong Audience suppressed, NRI scoring → QL→TD%, gap analysis, detail line, tooltips.

### Phase 1.8: Parser Fixes — Pending

**Why:** Media plan audit (Apr 14) revealed 5 campaigns misclassified by `campaign_audience` parser + 1 missing market. Phase 2 viz will show wrong data without these.

**Source:** Google Sheet `1q_mScP2PfbP-cCMzcLyq1YyDkaNes2rFV4GvmWFc15g` (gid=1196222360) — full media plan with all campaigns × targeting params.

- [ ] 1.13 **Parser: add `k-8`/`k_8` → K-8 audience** — `USA_FB_Leads_Conv_K-8_*` falls to General (BAU). Campaign launched 04/14.
- [ ] 1.14 **Parser: add EU market detection** — `ANZ-EU_*` campaigns misclassify as AUS. Add `/ANZ[-_]EU/i` check before ANZ catch-all in `matchMarketFromText()`. Map to new `EU` market value.
- [ ] 1.15 **Parser: add missing audience keywords** — `parenting` → Interest, `bollywood` → Interest, `premium`/`job-titles`/`income` → HNI, `razorpay` → Lookalike. Affects 5 campaigns across ANZ + India + US.
- [ ] 1.16 **Parser: `Broad_and_NRI_Filters_PLA` — accept inaccuracy** — Campaign name contains both `nri` AND `broad`. All 10 ad sets get NRI (PLA). Accepted: NRI is dominant signal, campaign_audience is campaign-level by design. Document in code comment.

**Validation:** Run all media plan campaign names through parser, verify no more General fallbacks except truly generic campaigns.

---

## Phase 2: Segwise-Level Visualizations

**Goal:** The charts that make Godfather look and feel like Segwise for Meta. These are what the Segwise email shows.

| # | Task | Details | Priority |
|---|------|---------|----------|
| 2.1 | **Creative Leaderboard** | New Tagger sub-tab: top 20 creatives by spend. Each row: thumbnail, name, spend, CPTD, verdict, TOP 3 differentiating tag values (element attribution). Sortable. | P0 — THIS is Segwise |
| 2.2 | **Tag Distribution Bar Charts** | Per taxonomy field: horizontal bar chart showing % of creatives with each value. Color by avg CPTD (green=good, red=bad). E.g., "Hook: Outcome First 42% (₹28K), Problem/Pain 23% (₹35K)..." | P0 — portfolio composition |
| 2.3 | **Spend by Tag Value** | Bar chart: total spend allocated to each tag value. "₹1.2Cr on Outcome First, ₹80L on Testimonial format." | P1 — budget intelligence |
| 2.4 | **Creative Fatigue Sparklines** | In Decay tab: per-creative mini sparkline showing 30-day CPTD trend. Currently shows "fatigued" badge but no visual timeline. | P1 — visual fatigue |
| 2.5 | **True 2D Heatmap** | Selectable X×Y axes (Hook × Audience, Format × Production). Cell color = CPTD. Cell size = spend. Clickable cells drill into creatives. | P2 — advanced |
| 2.6 | **Tag Performance Trend** | Line chart: CPTD by tag value over 4-week periods. Shows whether a tag pattern is fatiguing across the portfolio. | P2 — temporal |

**Validation:** Charts render for US (most data), India (new data), AUS/MEA (less data). Small markets degrade gracefully ("insufficient data").

### Phase 2b: Targeting Data Layer

**Goal:** Connect the media plan (what audiences we target) to creative performance (what works). This data layer powers Make More, Library, and Create upgrades in Phase 3.

**Source:** Media plan audit (Apr 14) — Google Sheet `1q_mScP2PfbP-cCMzcLyq1YyDkaNes2rFV4GvmWFc15g` (gid=1196222360). 100+ campaigns across US/India/ANZ/UK/EU, Meta/Google/Bing/Taboola.

| # | Task | Details | Priority |
|---|------|---------|----------|
| 2.7 | **Audience cluster performance aggregator** | New function `getAudiencePerformance(market, from, to)`. Groups all tagger data by `campaign_audience`. Returns per-cluster: TD count, CPTD, QL-TD%, T-P%, spend, trend (WoW), best 3 creatives (by CPTD), worst 3 creatives. Refreshes on date/geo/flow change. This is the engine behind 3.8-3.13. | P0 |
| 2.8 | **Targeting reference config** | Static JSON `TARGETING_CONFIG` embedded in index.html. Maps each `campaign_audience` value → `{ age, gender, interests, exclusions, vernacular, lp_type, typical_campaigns[], typical_adsets[] }`. Populated from media plan sheet. Updated manually when new campaigns launch (~monthly). Not a live fetch — the plan changes slowly. | P0 |
| 2.9 | **Creative Leaderboard: audience column** | Add `campaign_audience` as sortable/filterable column to Phase 2.1 leaderboard. Each creative row shows which targeting cluster it ran in. Clicking filters leaderboard to that cluster. | P1 — after 2.1 |

**Validation:** `getAudiencePerformance('US')` returns correct clusters matching manual media plan analysis (Expats ~₹34K CPTD, LAL Enrolled ~₹39K, Influencer Postboost ~₹43K). TARGETING_CONFIG covers all non-General campaign_audience values.

---

## Phase 3: Intelligence Wiring

**Goal:** Connect the 15 written skills to actual UI outputs. Skills are reference docs — this makes them operational.

| # | Task | Skill It Operationalizes | Details |
|---|------|------------------------|---------|
| 3.1 | **Dashboard KPI sparklines** | Weekly Digest (Data Skill 3) | Add 30-day sparkline to each Dashboard KPI card. Currently only Sentinel has them. |
| 3.2 | **WoW WHY → action prescriptions** | Creative Diagnostician (Data Skill 7) | After each WHY driver, add specific action: "CPQL up 15% → Pause [names], refresh with [combo]." Uses Creative Decision Tree. |
| 3.3 | **Market Health clipboard export** | Market Health Scorecard (Data Skill 6) | "Copy to Clipboard" button on Market Health section. Formats as Monday Slack message template from Daily Playbook. |
| 3.4 | **Funnel waterfall visualization** | Funnel Leak Detector (Data Skill 1) | Visual funnel QL→TQL→TS→TD→Paid with leak % at each stage, color-coded. Both BAU and PLA funnels. |
| 3.5 | **Budget pace indicator** | Spend Optimizer (Data Skill 2) | Dashboard card: "US spend this month: ₹X of ₹Y planned (Z% through month, W% budget used). On pace / Ahead / Behind." Uses monthly plan from summary doc. |
| 3.6 | **Tag value filter in Data Table** | Tagger QA (Creative Skill 1) | Value-level dropdown in Data Table (not just category). "Show only Testimonial" or "Show only NRI (BAU)." |
| 3.7 | **Unhide Oracle hidden modules** | Anomaly Spotter (Data Skill 4) | Cross-Signal Patterns, Anomaly Alerts modules exist in hidden divs (line 392). Integrate into Oracle tab layout. Requires Oracle tab redesign. |

### Phase 3b: Targeting Intelligence (Make More + Library + Create)

**Goal:** Connect audience targeting data to creative production. Content team sees what works for each audience, gets deployment-ready suggestions, and Haiku generates copy informed by actual performance.

**Depends on:** Phase 2b (2.7 aggregator + 2.8 config)

| # | Task | What Changes | Details |
|---|------|-------------|---------|
| 3.8 | **Make More: audience-clustered recommendations** | Sentinel → Make More (lines 8546-8664) | Replace current "top 8 by score" with audience-grouped cards. For each cluster with sufficient data: show best performer + thumbnail, cluster CPTD vs portfolio avg (colored delta), specific format/theme recommendation ("Make 2 more NRI-contextual statics"), which clusters are saturated vs starving. Cap at top 5 clusters. Dead clusters (CPTD >2x portfolio, <2 TD) get "Kill" label. |
| 3.9 | **Make More: deployment suggestion** | Per recommendation card | Each "make more" card includes actual campaign/ad set name from TARGETING_CONFIG: "Deploy in `USA_FB_Leads_Conv_Expats_NRI_Audience_Signup_LP_250326`". Content team knows exactly where the creative will run. Also show targeting params (age, interests) so they know who'll see it. |
| 3.10 | **Library: audience suitability pills** | Library cards (lines 17227-17412) | Per creative card, show which audiences it's suited for. Logic: (a) look up which `campaign_audience` it ran in from tagger data, (b) grade performance — **A** if CPTD < cluster median AND TD >= 3, **B** if within 1.5x median, **C** otherwise. Show as colored pills on card: `Expats A` `LAL B`. Creatives with no performance data show `campaign_audience` without grade. |
| 3.11 | **Library: audience filter dropdown** | Library filters (line 1201-1206) | New dropdown alongside Format and Geo filters. Values from `campaign_audience` taxonomy (non-empty only). Filters to creatives that ran in or are suited for that audience. "Show me everything that works for Telugu audiences." |
| 3.12 | **Create: audience performance context injection** | Create → Haiku system prompt (lines 10842-11199) | When audience pill selected, auto-inject into `buildSystemPrompt()`: (a) top 3 performers for this audience + their tag combos (hook, format, pain_benefit), (b) worst 3 (what to avoid), (c) targeting params from TARGETING_CONFIG (age, gender, interests, vernacular), (d) cluster CPTD + TD + T-P%. Haiku generates copy informed by what actually converts for that specific audience. |
| 3.13 | **Create: performance sidebar** | Create tab UI | When audience pill selected, show mini-card beside brief form: cluster name, CPTD (colored), TD count, T-P%, best creative name + format, performance trend arrow. Content team sees the data before they write. Zero clicks — auto-populates on pill selection. |

**Validation:** 
- Make More shows different recommendations for US vs India (different top clusters).
- Make More in PLA mode shows PLA-specific clusters (Broad PLA, Chinese PLA).
- Library filter by "Expats" returns only creatives that ran in Expats campaigns.
- Create system prompt for "NRI" audience includes Expats performance data + targeting params.
- Switching audience pill in Create updates sidebar immediately.

**Validation:** Every element updates on geo change. Clipboard copy produces clean text. Funnel matches summary doc baseline.

---

## Phase 4: Export & Digest

**Goal:** Segwise daily email equivalent — exportable reports without opening the dashboard.

| # | Task | Details |
|---|------|---------|
| 4.1 | **Weekly Digest export** | "Generate Weekly Digest" button → formatted markdown matching Weekly Performance Digest skill template. Copyable to Slack/email. |
| 4.2 | **CSV export on every table** | Download button on all 20 tables. Currently only Sentinel has CSV export. |
| 4.3 | **Creative Leaderboard export** | "Export Leaderboard" → shareable image or formatted text of top 20 creatives with tag breakdowns. |
| 4.4 | **Per-market one-pager** | Button per market card: "Export [Market] Summary" → one-page report with KPIs, top/bottom 5, funnel, recommendations. |

---

## Estimated Effort

| Phase | Sessions | Hours | Dependencies | Status |
|-------|----------|-------|-------------|--------|
| Phase 0: Hygiene | 1 | ~2 | None | **DONE** |
| Phase 1: BAU/PLA + Critical Fixes | 1.5 | ~3 | None | **DONE** |
| Phase 1.8: Parser Fixes | 0.25 | ~0.5 | Media plan audit | Pending |
| Phase 2: Segwise Viz (2.1-2.6) | 1-2 | ~3-4 | Phase 0 sort (done) | Pending |
| Phase 2b: Targeting Data Layer (2.7-2.9) | 0.5 | ~1 | Phase 1.8 | Pending |
| Phase 3: Intelligence (3.1-3.7) | 1 | ~2 | Phase 1 (done), Phase 2 | Pending |
| Phase 3b: Targeting Intel (3.8-3.13) | 1 | ~2 | Phase 2b | Pending |
| Phase 4: Export | 1 | ~1-2 | Phase 2+3 | Pending |
| **Total** | **~7-8** | **~14-17** | | |

---

## What This Achieves vs Segwise

| Capability | Segwise | Godfather After Phase 0-4 |
|-----------|---------|--------------------------|
| Top creatives by spend | Yes | Yes (Phase 2.1 Leaderboard) |
| Element breakdowns | Yes (CTA, headline, chars) | Yes (Phase 2.2 Tag Distribution) |
| Tag-to-performance | Yes | Yes (already: Combos + Heatmap) |
| Creative fatigue | Yes (alerts) | Yes (Phase 2.4 Sparklines + existing Decay tab) |
| Automated digest | Yes (daily email) | Yes (Phase 4.1 Weekly Digest export) |
| Multi-network | Yes (15 networks) | No — Meta only by design |
| Full downstream funnel | No (stops at ROAS) | **Yes — QL→TQL→TD→Enrolled→CAC** |
| AI recommendations | No | **Yes — Oracle, WHY, Pause/Make More** |
| Budget intelligence | Basic | **Yes — Budget pace, Spend Optimizer, market-aware** |
| BAU vs PLA split | No | **Yes (Phase 1)** |
| Cross-market transfer | No | **Yes (Creative Skill 6)** |
| Copy generation | Beta | **Yes — Haiku + 9 production skills** |
| **Audience→Creative mapping** | **No** | **Yes — Make More shows what to create for each targeting cluster, with deployment campaign (Phase 3b)** |
| **Creative→Audience suitability** | **No** | **Yes — Library tags each creative with audience fit grade A/B/C (Phase 3b)** |
| **Audience-aware generation** | **No** | **Yes — Haiku knows what converts for each audience before generating (Phase 3b)** |
