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

| Phase | Sessions | Hours | Dependencies |
|-------|----------|-------|-------------|
| Phase 1: BAU/PLA | 1 | ~2 | None |
| Phase 2: Segwise Viz | 1-2 | ~3-4 | Phase 0 sort (done) |
| Phase 3: Intelligence | 1 | ~2 | Phase 1 (funnel needs PLA), Phase 2 (sparklines) |
| Phase 4: Export | 1 | ~1-2 | Phase 2+3 (content to export) |
| **Total** | **4-5** | **~8-10** | |

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
