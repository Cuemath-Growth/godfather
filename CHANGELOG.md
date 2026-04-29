# Godfather Changelog — Guard Reference

Every fix and change to index.html is logged here. Guard reads this before approving any new change.

---

## Week 2 Day 1 — Chassis v0.2.0: Supabase wire-up (2026-04-29)

### Why this shipped
Day 4-5 dismissals lived only in the browser (localStorage) — switching to a different
laptop or browser would lose all snoozes. Day 1 of Week 2 wires the chassis to two
new Supabase tables so dismissals + recommendation history persist across sessions
and devices, and outcomes can be measured 21 days later.

### Schema (migration: `add_recommendation_log_and_dismissals`)
- `public.recommendation_log` — every surfaced recommendation. `action_taken` /
  `outcome_metric` backfilled when user clicks an action button + after the 21-day
  outcome window. Indexes: `(verdict_id, entity_id, recommended_at desc)`,
  `(market, recommended_at desc)`, partial index on outcome-pending rows.
- `public.recommendation_dismissals` — user dismissals from Action Queue.
  `expires_at NULL` = `never_again`, otherwise the snooze window. Indexes:
  `(verdict_id, entity_id, expires_at desc)`, `(dismissed_at desc)`.
- Both tables: RLS enabled, anon `FOR ALL USING (true) WITH CHECK (true)` policy
  to match existing Cuemath project tables.

### Chassis changes (`shared/cuemath-intelligence.js`, bumped to v0.2.0)
- New `cuemathIntelligence.configure({ supabaseUrl, supabaseKey, userId })` API.
  index.html boot now calls `ci.configure({ supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_KEY })`
  before the first `runDetection`.
- `dismiss(verdictId, entityId, reason)` is now async. Three writes in order:
  (1) in-memory cache → guardrail picks it up immediately on next render,
  (2) localStorage → offline fallback,
  (3) Supabase `recommendation_dismissals` POST → cross-device persistence.
- New `_refreshDismissalsCache()` runs at `configure()` and lazily every 60s during
  `runDetection`. Pulls active dismissals (`expires_at IS NULL OR expires_at > now`)
  into an in-memory Map keyed by `verdict_id|entity_id`.
- `not_recently_dismissed` guardrail consults the Supabase cache first, falls back
  to localStorage when cache hasn't loaded.
- New fire-and-forget logger: every surfaced recommendation gets POST'd to
  `recommendation_log` with `chassis_version` + `parser_version` stamped. Deduped
  per session by `verdict_id|entity_id` so re-renders don't spam inserts.
- Chassis-version chip in Action Queue header now reads `chassis v0.2.0` (auto via
  `ci.CHASSIS_VERSION`).

### Verification
- Node simulation (mocked fetch): configure → prefetch dismissals → register
  test verdict → runDetection logs to `recommendation_log` → dismiss writes to
  `recommendation_dismissals` + cache + localStorage → re-runDetection blocks
  via guardrail. All transitions correct.
- Direct SQL writes against the real Supabase tables succeed (chassis-shape
  payloads, then cleaned up).
- Browser verified on `localhost:8765`: console shows
  `[chassis] boot: v0.2.0 · 0 verdict(s) · 0 surfaced · Supabase wired` +
  `[chassis] dismissals cache: 0 active` — the second line proves the GET to
  Supabase succeeded with valid auth.

### What did NOT ship today
- Real verdict implementations — Week 2 Day 3+ (`meta_pause_cptd_leak` first)
- 21-day outcome measurement job — Week 2 Day 2 (placeholder only; live job builds
  alongside first real verdict)
- Supabase-backed real guardrails (cohort_matured, volume_floor, etc.) — Week 2 Day 2
- Outcome stats in Action Queue header — needs ≥10 measured outcomes per verdict
  before we surface them

---

## Tagger Grid — CPTQL sort + badge mirror fix (2026-04-29)

### Why this shipped
Two bugs flagged in original screenshot: (1) "Best CPTQL" sort divided spend by total QL not
NRI for US — wrong CPTQL definition for US market; (2) badge metric/label always showed CPTD
when TD ≥ 1, ignoring the sort the user had picked. Result: a US influencer ad with high CPTD
but cheap CPTQL ranked first under "Best CPTQL" but displayed its CPTD on the badge — looked
like the sort was broken.

### Changes
- `index.html` ~line 17155: sort comparator's `q()` function now reads NRI for US, QL for all
  other markets (matches `data-schemas.md` TQL definition and unified verdict).
- `index.html` ~line 17204: removed redundant `cpql` calculation, replaced with `tql`/`cptql`
  using the same TQL rule.
- `index.html` ~line 17214: badge metric/label now mirrors `gridSort` selection. When sort is
  `cpql_asc`, badge shows CPTQL (with cpnri/cpql amber thresholds for color). When sort is
  `cptd_asc`, badge shows CPTD. For neutral sorts (recent/spend/td), keeps existing auto-pick
  (CPTD preferred, CPTQL fallback). Threshold colors now match the displayed metric, not always
  CPTD's bands.

### Verification
- `node` syntax check: 3 inline script blocks, 0 parse errors.
- Cross-checked against unified `getCreativeVerdict()` — both Tagger Grid and Signals now use
  the same TQL definition and same threshold sources (`th.cpnri.amber` for CPTQL, `th.cptd.amber`
  for CPTD).

---

## Unified verdict — `getCreativeVerdict()` rewrite (2026-04-29)

### Why this shipped
Two parallel verdict systems existed: `getCreativeVerdict()` (Signals + Sentinel) and an inline
verdict closure in `renderCreativeGrid()`. They disagreed on labels and thresholds. Both had
fundamental flaws: 1 TD passed as "Working" (statistical noise — `feedback_cohort_maturity.md`
requires ≥14d), no age check, no CPTQL gate (only CPTD). User confirmed: TD floor = 2, gate on
both CPTD AND CPTQL, add WoW trend signals to Fatigued.

### Changes
- `index.html` ~line 16113: `getCreativeVerdict(c)` rewritten with 10-rule cascade. Order matters:
  Too early → Testing → Funnel break → Pause → Fatigued (trend) → Scale → Working → Fatigued
  (static) → Weak → Monitoring.
  - Cohort age: read from `_date` field, fallback to DDMMYY suffix in ad name.
  - Spend floor: `VERDICT_SPEND_FLOOR` constant (US 15K · India 3K · AUS/APAC 8K · MEA 5K · UK 10K).
  - **Working/Scale require BOTH** CPTD ≤ amber/green AND CPTQL ≤ amber/green. CPTQL = NRI-based for
    US (`th.cpnri`), QL-based elsewhere (falls back to `th.cpql`).
  - **TD floor**: Working ≥ 2, Scale ≥ 3.
  - Wrong-verdict feedback loop preserved (demote Scale→Working, Pause→Watch on prior `wrong` mark).
  - Verdict keys preserved for downstream filter compatibility: `new`, `scale`, `working`,
    `fatigued`, `pause`, `watch`. New labels `Testing`/`Weak`/`Funnel break`/`Monitoring`/`Too early`
    map to existing keys.
- `index.html` ~line 16098: new `_computeVerdictTrends()` helper. Computes WoW deltas (last 7d
  vs prev 7d) for CPTD, CPTQL, CTR per ad from `getAdPerformanceDaily()`. Cached by today+flow.
  Trend-Fatigued thresholds: CPTD up ≥30%, CPTQL up ≥30%, CTR down ≥40%.
- `index.html` ~line 17138: Tagger Grid inline verdict (10 lines of closure logic) replaced with
  `const _v = getCreativeVerdict(c);` + Tailwind color map. Same source of truth as Signals/Sentinel.
- `index.html` ~line 15691: Winning Creatives table TD floor raised from `td < 1` to `td < 2` to
  match new "Working" verdict threshold. Prevents table rows showing verdict "Weak".

### Verification
- `node` syntax check: 3 inline script blocks, 0 parse errors.
- Verdict keys downstream: filtered at `taggerVerdictFilter` dropdown — kept legacy keys.
- Wrong-verdict feedback paths still hit (preserved logic for `wrongScale` and `wrongPause`).
- Trend cache keyed by `today|flow`, won't recompute per row within one render.

### Known follow-ups (not in this change)
- Tagger Grid badge metric/label still always shows CPTD when TD ≥ 1, regardless of sort
  selection (line ~17133). Will fix when user requests.
- "Best CPTQL" sort in Tagger Grid still divides by total QL not NRI for US (line ~16847).
  Will fix when user requests.

---

## Tagger Signals — "Winning Creatives" cross-market table (2026-04-29)

### Why this shipped
User flagged that the Explore tab shows all creatives without any compiled "winners" view.
She needed a single table that surfaces creatives passing ALL of: volume floor, CPTQL ≤ amber,
CPTD ≤ amber, ≥14d cohort age — for their own market. Previously the Tagger Grid badge
displayed CPTD even when sorted by Best CPTQL, and the "Working" verdict could fire on a
single TD, both of which obscured the real winners list.

### Changes
- `index.html` line 15663: new `_winningCreativesTable(data)` module function (~95 lines).
  Defined right above `renderCreativeReview` for lexical proximity to the call site.
  - Volume floors per market: US 5, India 10, AUS/APAC/MEA/UK/EU/ROW 3.
  - TQL = NRI for US, QL for everywhere else (per `data-schemas.md`).
  - CPTQL gate = `SENTINEL_THRESHOLDS[mkt].cpnri.amber` (US 15K · India 1.2K · AUS 15K ·
    MEA 10K · UK 20K — values match what user confirmed).
  - CPTD gate = `SENTINEL_THRESHOLDS[mkt].cptd.amber`.
  - Cohort age = 14 days. Date sourced from `_date` field, fallback to DDMMYY suffix in ad name.
  - Per `feedback_markets_are_silos.md`: rows grouped by market header, sorted by CPTD ASC
    within each market group. No cross-market ordered list.
  - Per `feedback_signal_why_action.md`: each row's Action cell shows verdict pill + sentence
    ("Scale +30% budget" / "Hold spend; brief V2"); full verdict reason in tooltip.
- `index.html` line 15998: insertion point in `renderCreativeReview()` between Section 3
  (Pause/Refresh) and Section 5 (Next Week Recommendations), labeled "SECTION 4: Winning
  Creatives".

### Verification
- `node` syntax check: 3 inline script blocks, all parse cleanly (0 errors).
- Empty-state branch: returns its own card with "No creatives currently pass all gates" message.
- Reuses `getCreativeVerdict()`, `extractMarket()`, `parseNumber()`, `formatCurrency()`,
  `tagLabel()`, `shortAdName()`, `_hdThumb()`, `SENTINEL_THRESHOLDS` — all already global.

### Known follow-ups (not in this change)
- Tagger Grid badge still shows CPTD when sorted by Best CPTQL (line 16906-16907 bug). Separate fix.
- Grid sort labeled "Best CPTQL" actually divides by total QL not NRI for US — separate fix.
- "Working" verdict fires on 1 TD; cohort-maturity feedback says require ≥2 TDs. Separate fix.

---

## Week 1 Day 4-5 — Action Queue UI tab (2026-04-29)

### Why this shipped
Day 4-5 of the chassis Week 1 plan. The chassis was emitting recommendations to console
only; no operator could see what it was producing. This adds the operator-facing surface.

### Changes
- `index.html` line ~130: new sidebar nav item `data-view="actionq"` between Dashboard and Insights.
  Includes `actionQueueNavBadge` (counter, hidden when zero) and `[beta]` chip.
- `index.html` lines 484-514: new `<div id="view-actionq" class="view hidden p-6">` (sibling of all
  other view divs — verified, not nested). Has header (with chassis version chip), stat strip,
  empty state, cards container, and footer note.
- `index.html` `navigateTo()`: titles/subs map updated for `actionq`; render hook added
  (`renderActionQueueView()` called when switching to view).
- `index.html` `onGlobalFilterChange()`: now re-renders Action Queue when the active view is `actionq`
  (so country dropdown propagates).
- `index.html` ~line 7186: new `renderActionQueueView()` + `_renderActionQueueCard(rec)` +
  `actionQueueDismiss(verdictId, entityId, reason)` + `_updateActionQueueNavBadge(count)` +
  `_escapeHtml(s)` helpers.
- Card layout follows spec §"Action Queue UI": severity chip · confidence · effort · market ·
  verdict id; signal headline; Why; Why now (when present); guardrails passed line; primary action
  button + Snooze 24h / Skip 7d / Never again. Smoke-test verdict's action button is disabled
  (type `noop`) so no fake action is offered.
- Severity chip color tier: ≥₹50K/wk red · ≥₹10K/wk amber · else gray. Same-market only —
  no cross-market severity ranking.
- `cuemathIntelligence.dismiss()` already plumbed to localStorage; `not_recently_dismissed`
  guardrail filters dismissed cards on next render. End-to-end dismissal works without Supabase
  (Supabase migration is Week 2 Day 1).

### Verification
- `node` syntax check: 3 inline script blocks, all parse cleanly.
- View structure: 9 view divs, all siblings of one another (verified by grep — no nesting).
- `npm run build`: emits `dist/index.html`, `dist/shared/cuemath-data.js`, `dist/shared/cuemath-intelligence.js`.
- Manual checklist for browser verification (per `feedback_triple_careful_deploys.md`):
  1. Hard reload production after deploy
  2. Sidebar shows new "Action Queue [beta]" nav item between Dashboard and Insights
  3. Click it: page renders with `chassis v0.1.0` chip, smoke-test card visible (signal:
     "Chassis v0.1.0 loaded · N leads available")
  4. Click "Snooze 24h" — card disappears
  5. Hard reload — card stays gone (localStorage persisted) for 24h, then returns
  6. Console shows two `[chassis] runDetection(godfather)` log lines (boot + view-render)

### What did NOT ship today (per spec, deferred)
- Real verdicts (Week 2 Day 3+ migration of Pause / Make More / Refresh / etc.)
- Outcome stats in header (Week 2 Day 1, blocked on Supabase tables)
- "Why now" diff engine (Week 2 Day 2)
- Bulk actions ("Apply all 1-CLICK + CONFIDENT")
- Verdict-type filter dropdown — defer until ≥3 verdicts are registered

---

## Phase 1b — chassis core skeleton + smoke-test verdict (2026-04-28)

### Why this shipped
Week 1 Day 3-5 of the Path C build (see `02-skills/intelligence-chassis-spec.md`).
This is the verdict-driven engine skeleton. Real verdicts (the existing Pause Now,
Make More, Refresh, Market Health, Funnel Leak, Influencer alerts) begin migrating
to this chassis in Week 2.

### Changes
- New file `shared/cuemath-intelligence.js` (~270 lines) — exposes `window.cuemathIntelligence`:
  - `registerVerdict(verdict)` / `getVerdicts(filter)` — verdict registry
  - `registerGuardrail(name, fn)` — extensible guardrail framework
  - `runDetection(toolName, data, context)` — runs all verdicts, applies guardrails,
    scores, returns `{byMarket, all, stats}` with results sorted by priority
    **within each market** (markets are silos — see `feedback_markets_are_silos`)
  - `renderActionQueue(detectionResult, container, opts)` — skeleton render to console
    + optional DOM container; full UI lands Week 1 Day 4-5
  - `interleaveTopNPerMarket(byMarket, totalLimit)` — round-robin so India/UK don't
    get drowned by US in "All markets" view
  - `dismiss(verdictId, entityId, reason)` — localStorage skeleton; Supabase migration
    in Week 2 Day 1
  - `computePriority(severity, confidence, effort)` — `severity × confidenceWeight ÷ effortDivisor`
  - `CONFIDENCE` (CONFIDENT/LIKELY/LOW) and `EFFORT` (1_CLICK/5_MIN/INVESTIGATE) enums
  - `PARSER_VERSION = '1.0.0'` + `checkParserVersion(cached)` for cache invalidation
  - 6 stub guardrails (cohort_matured, volume_floor, not_recently_dismissed,
    brand_defense_exception, market_priority_check, historical_winner_check) —
    real implementations land Week 2
- `index.html` line 10 — added `<script src="shared/cuemath-intelligence.js"></script>`
  after cuemath-data.js
- `index.html` boot sequence — registers a `chassis_smoke_test` dummy verdict and runs
  detection once at boot to confirm wiring. Console output expected:
  `[chassis] runDetection(godfather): 1 verdicts → 1 signals → 1 recommendations`

### Verification
- JS syntax: ✓ chassis parses, ✓ data still parses (no regression), ✓ all 3 inline
  blocks in index.html parse
- Load order: ✓ cuemath-data line 9, cuemath-intelligence line 10, first inline line 12
- Sentinel: `__CUEMATH_INTELLIGENCE_VERSION === '0.1.0'` after boot

### Net behavior change
Zero visible change. Smoke-test logs to console; no UI.

### What's next (Week 1 Day 4-5 → Week 2)
- Day 4-5: Action Queue UI tab in Godfather (real card render, dismissal interactions)
- Week 2 Day 1: Supabase `recommendation_log` + `recommendation_dismissals` tables;
  swap localStorage dismissal store for Supabase
- Week 2 Day 2: Real guardrail implementations (`cohort_matured`, `volume_floor`, etc.)
- Week 2 Day 3+: First real verdict migration (`meta_pause_cptd_leak`)

### How to test before pushing to Cloudflare
1. Open `index.html` (`python3 -m http.server 8000`, then http://localhost:8000)
2. Open browser DevTools console (Cmd+Option+J)
3. Type `__CUEMATH_INTELLIGENCE_VERSION` → should output `"0.1.0"`
4. Look for boot log: `[chassis] runDetection(godfather): 1 verdicts → 1 signals → 1 recommendations`
5. Type `cuemathIntelligence.getVerdicts({tool:'godfather'})` → array with 1 verdict (`chassis_smoke_test`)
6. Dashboard otherwise behaves identically to before

If broken: `git revert HEAD` and ping.

---

## Phase 1a — extract pure utilities to `shared/cuemath-data.js` (2026-04-28)

### Why this shipped
Foundation for the Path C intelligence chassis (see `02-skills/intelligence-chassis-spec.md`).
Both Godfather and the upcoming Google Creative Dashboard will share core data + intelligence
modules. This first extraction proves the loading pattern with the safest slice — pure functions,
no state coupling — before the riskier metric primitive extractions in Week 2-3.

### Changes
- New file `shared/cuemath-data.js` — exposes 6 pure utility functions on `window`:
  `parseNumber`, `safeDivide`, `extractSheetId`, `parseSheetValues`, `parseCSV`,
  `_isPLACampaignName`. Plus sentinel `__CUEMATH_DATA_VERSION = '1.0.0'`.
- `index.html` line 9 — added `<script src="shared/cuemath-data.js"></script>` before any
  inline `<script>` so functions exist before app code runs.
- Removed inline definitions of all 6 functions (replaced with one-line breadcrumb comments
  pointing to the shared file).

### Verification
- JS syntax check: ✓ shared file parses, ✓ all 3 inline script blocks in index.html parse
- Function uniqueness: ✓ each of the 6 functions defined exactly once (in shared, zero in inline)
- Load order: ✓ shared script tag at line 9, first inline script at line 11

### Net behavior change
Zero. Same functions, same signatures, same call sites. Just relocated.

### What's next (Phase 1b, Week 1 Day 3-5)
- Chassis core (`shared/cuemath-intelligence.js`): `registerVerdict`, scoring, queue render skeleton
- `_PARSER_VERSION` cache invalidation pattern
- Then Phase 1c: extract market filters + flow filters (BAU/PLA logic) to `cuemath-data.js`
- Then Phase 1d: extract metric primitives (getQL, getTQL, getTD, getMarketMetrics) — these
  couple to `leadsData` so will refactor to take it as parameter

### How to test before pushing to Cloudflare
1. Open `index.html` in your browser (or run `python3 -m http.server 8000` from project root
   and visit http://localhost:8000)
2. Open browser DevTools console
3. Type: `__CUEMATH_DATA_VERSION` — should output `"1.0.0"`
4. Look for NO red errors mentioning `parseNumber is not defined` or similar
5. Try the dashboard — KPIs should load identically to before

If anything breaks: `git revert HEAD` and ping.

---

## Cleanup: remove orphaned Costs Tracker + Regional code (2026-04-28)

### Why this shipped
Pressure-test of the prior "blocker sweep" commit (ee6c8f4) revealed `_costsTracker` and
`_regionalData` are dead code — fetched but never rendered. Git blame traces it to commit b9e38db
(2026-04-03, "Phase 2.2: delete deprecated code") which removed `fetchCostsTrackerAllGeos`,
`getCostsTrackerMetrics`, `fetchPerfTrackerDaily`, `mergePerfIntoTagger`, and
`COSTS_TRACKER_TABS` — but left the orphan fetches behind. The prior commit's "fix" restored
fetches whose consumers had been deleted three weeks earlier.

The Apr 17 blocker note ("Costs Tracker / Regional returning 0 rows") was reading a dead
diagnostic checking a dead variable.

### Removed
- `DEFAULT_SHEETS.costsTrackerUrl` and `DEFAULT_SHEETS.regionalUrl`
- `state._costsTracker` and `state._regionalData` declarations
- `check('Regional data loaded', ...)` diagnostic
- The two orphan fetches in `refreshData()` (used to live near line 6583)

### Net effect
- Diagnostics drops from 31 PASS → 30 PASS (one fewer check on dead data — correct)
- ~15 lines removed
- One less spurious "Costs Tracker fetched: 307 rows" log per session (the rows went nowhere)
- No render path changes — nothing was being rendered anyway

---

## Scope honesty — relabel Dashboard as Meta-only (2026-04-28)

### Why this shipped
User pulled the leads tab and ran a side-by-side: her CMO weekly report shows USA BAU MTD = 327 TD,
but Godfather has been showing ~139 because `fetchSheetData` (line 4581) filters all leads to
`utm_medium='meta'` at fetch time — dropping ~5,400 non-Meta rows (google_brand 1,854 +
google_other 1,360 + others 492 + Influencer 32 + whatsapp 17 + BTL 10). The filter is intentional
("Godfather is Meta-only"), but the dashboard never said so. KPIs read like all-channel BAU,
producing low TDs and inflated CPTD whenever compared against the cross-channel reports.

### Decision
Keep Meta-only scope (option 3). Don't widen the filter. Make scope visible everywhere it matters
so no future comparison is apples-to-oranges.

### Changes
- **Persistent "Meta only" pill** next to the BAU/PLA flow toggle (header). Tooltip: "Godfather
  scope: Meta only. Google/Influencer/WhatsApp/BTL leads are excluded from KPIs. For all-channel
  BAU MTD, see the perf tracker leads tab."
- **"BAU vs PLA Comparison" → "Meta BAU vs Meta PLA"** (renderBauPlaComparison header).
- **"BAU Funnel" / "PLA Funnel" → "Meta BAU Funnel" / "Meta PLA Funnel"** (funnel renderer).

### Net effect
Dashboard KPIs are unchanged (still Meta-only). Labels now make scope explicit so the gap to
all-channel reports is expected, not a bug. No data-pipeline changes.

---

## Blocker sweep — Supabase oracle_actions + Meta thumbnails + sheet fetcher (2026-04-28)

### `fetchSheetAsCsv` un-stubbed — fixes Costs Tracker / Regional / Creator Roster / Library tabs
Class bug. The function was deprecated and replaced with `Promise.resolve('')` during the move to
the Sheets API JSON path for the main spend pipeline. But four downstream consumers still relied
on the gviz CSV fetcher and have been silently returning 0 rows ever since:
- Costs Tracker (`state._costsTracker`)
- Regional Performance (`state._regionalData`)
- Creator Roster (`state._creatorRoster`)
- Library tab fetches (`renderLibrary` flow)
- Influencer (`state._influencerData`) via the same path

Verified all four URLs return HTTP 200 + non-empty CSV (308 / 25 / 179 / N rows). Restored the
original implementation; no call-site changes required. Main spend pipeline (`costData`,
`leadsData`) continues to use Sheets API JSON via `loadCsv()` — unaffected.



### oracle_actions table created (Supabase)
Boot-time 404 from `loadOracleActions()` → fixed. Created `public.oracle_actions` with PK `item_id`,
RLS policy `FOR ALL TO public USING (true)` (mirrors `action_log`/`library_assets` pattern), plus
indexes on `card_type` and `status`. Schema matches what `oracleAction()`, `oracleSaveNote()`,
`oracleBulkAction()` write: item_id (PK), card_type, status, note, item_name, actioned_by,
actioned_at, snooze_until. No code change required — `_oracleActions` simply starts persisting.

### `fetchMetaCreatives` coverage expanded
fbcdn thumbnail 403s were largely a coverage gap, not pure URL expiry. Old call only pulled the first
~500 ads per account (limit:25 × 20 pages), and archived/deleted ads were burning slots. Now:
- `limit: '100'` (was '25')
- `pageNum <= 30` (was 20) — yields up to 3000 active ads per account vs 500
- `filtering: effective_status IN [ACTIVE, PAUSED, PENDING_REVIEW, IN_PROCESS, WITH_ISSUES, CAMPAIGN_PAUSED, ADSET_PAUSED]` — drops ARCHIVED/DELETED/DISAPPROVED so currently-displayable ads aren't crowded out
- Fresh URLs cover ~6× the inventory without changing render or onerror paths

Note: fbcdn URLs still carry signed expiry (~24-48h). For sessions left open >24h, thumbnails will
still 403 — onerror handlers already swap to grey placeholders. Permanent thumbnail storage was
considered and skipped (overkill for a 5-person tool).

---

## Phase 7 · Tighten winner classification + cohort maturity (2026-04-17)

### Why this shipped
User caught a "winner" showing 3 TDs from 3 QLs at ₹7.3K CPTD — a 100% conversion rate that's
either a clamp artifact, cohort timing, or too-small sample to trust. This phase tightens the
winner bar and gates on mature cohorts so no more magical-math recommendations leak through.

### `_classifyWinner` tightened
- **Hard gates (both tiers):** spend ≥ ₹25K · CPTD exists and > 0 · QL > TD (strict) · QL ≥ TD × 2.5 (so conversion rate ≤ 40%, realistic ceiling)
- **Tier 1 (Proven):** TD ≥ 5 · CPTD ≤ market's green threshold
- **Tier 2 (Emerging):** TD ≥ 2 · CPTD ≤ market's amber · CPTQL ≤ market's green
- The `QL > TD` sanity check is what rejected the 3/3 card.

### Parser: CTF removed
- `GODFATHER_TAXONOMY.fields.campaign_audience.parse` no longer returns "Creative Testing" when campaign starts with `CTF_`. CTF is a framework prefix, not an audience — the next keyword (LAL, Expats, etc.) wins. Campaigns with ONLY CTF now fall to the unclassified path (raw campaign name + "(unclassified)" badge).

### Cohort maturity gate
- New constant `_COHORT_MATURITY_DAYS = 14`. Before `_renderMakeMoreAds` runs, we fetch a second snapshot of `getAdPerformance` with `endDate = today - 14 days` ("mature view"). Only leads created ≥ 14 days ago count.
- Each ad in `adCampData` annotated with `.mature = { spend, ql, td, cptd, cptql }` or `._matureMissing: true`.
- `_classifyWinner(ad)` now reads from `ad.mature` when present — same classification logic, but applied to mature cohort metrics.
- `_renderMakeMoreAds` skips ads with `_matureMissing` (too new to judge) and displays `_displayCPTD/TD/QL/Spend` fields on each card so what the user sees matches what classified the ad.
- `_winnerWhy` now narrates conversion rate ("X TDs from Y QLs, Z% conv") and notes "on a ≥14-day-mature cohort" when mature metrics were used.

### Net effect on Make More
- No more 100%-conversion false positives.
- No more low-volume (< 5 TDs) ads treated as Proven winners.
- No more ₹22K-spend ads celebrated as scaling candidates.
- Fresh ads (< 14 days old) don't appear at all — they need to mature first.

---

## Pause Now trust fix + Make More rebuild (2026-04-17)

### Phase 1 — Pause Now paused-ad filter
- `isPaused()` expanded from 2 status codes to 10: adds `CAMPAIGN_PAUSED`, `ADSET_PAUSED`, `ARCHIVED`, `DELETED`, `DISAPPROVED`, `WITH_ISSUES`, `PENDING_REVIEW`, `PENDING_BILLING_INFO`, `IN_PROCESS`. Catches parent-pause cascades.
- Secondary liveness check: `_livenessSet` built from last-7-days daily spend. Ad must have spend > 0 in that window OR be marked ACTIVE in metaCreatives. Silences false positives from name-matching misses.

### Phase 2 — Per-market CPTD threshold enforcement
- Replaced hardcoded ₹40K/₹70K CPTD thresholds across Creative Review card colors (line 15123), portfolio Avg CPTD card (line 15164), Make More fallback audience cards (line 7685), Insights audience cards (line 17425). All routed through `SENTINEL_THRESHOLDS[market].cptd`.
- Make More cluster cards: use cluster's `TARGETING_CONFIG.geo[0]` primary market for threshold comparison (not portfolio blend).
- Pause Now Signal 2 (CPTQL Leak): now also flags ads above their OWN market's `cpql.amber` threshold — catches ads that pass the 2× portfolio-avg test but are still abusive for their specific geo.

### Phase 2.5a+d — Audience + Segment full-detail subtitle
- New `_formatAudience(audience)` helper returns `{ label, subtitleLines[], tooltip, unclassified }`.
- Make More cluster cards now render full targeting inline: age · gender · interests · language · geo · campaigns.
- Deploy-in block simplified — collapsed to a single copyable campaign code (full campaigns now in the subtitle).
- New `_tagPillTitle(category, value)` drives tooltips on tag pills — full targeting for `campaign_audience`, definition + field description for other categories.

### Phase 2.5b — "General" fallback killed
- Parser (`GODFATHER_TAXONOMY.fields.campaign_audience.parse`) no longer returns "General (BAU)" / "General (PLA)" when no keyword matches. Now emits the first 40 chars of the campaign name + "(unclassified)" so users see real context.
- Unclassified campaign names logged to `window.__unclassifiedCampaigns` so new keywords can be added to the parser.
- `_formatAudience` flags unclassified audiences with a yellow "unclassified" badge in the UI.

### Phase 2.5c — Tag definitions + example thumbnails
- New `TAG_DEFINITIONS` lookup — one-sentence definition per tag value across 8 categories (~60 definitions authored). Distinguishes shared-word confusions (Testimonial is a format, Authority is both hook and tone, etc.).
- `_getTagExamples(cat, val, count=3)` pulls best-CPTD creatives tagged with a given value for use in the reference panel.
- `openTagReference()` renders a modal overlay showing all definitions + 3 example thumbnails per value. Grouped by category.
- "Tag reference" button added to Patterns sub-tab header.
- `_tagPillTitle` now uses `TAG_DEFINITIONS` for per-value tooltips.

### Phase 3 — Make More rebuilt as ad-level with adjacency
- `_renderMakeMoreClusters` replaced with `_renderMakeMoreAds`. Source switched from tagger-aggregated clusters to individual CRM-matched ads.
- Per-ad winner classification via `_classifyWinner(ad)`:
  - **Tier 1 (Proven):** TD ≥ 3 AND CPTD ≤ market's green threshold
  - **Tier 2 (Emerging):** TD ≥ 1 AND CPTD ≤ market's amber AND CPTQL ≤ market's green
  - Fails both → not a winner (regardless of TD volume)
- Per-card narrative via `_winnerWhy(ad)` — plain-English explanation using the ad's tag pattern + metrics.
- Adjacency engine via `_findAdjacentAudience(winner, allWinners)`:
  - **Stage 1 (tag-pattern match):** find audiences where same hook+pain_benefit pair has ≥ 2 winners, rank by avg CPTD. If found, recommend with data citation.
  - **Stage 2 (curated family fallback):** `AUDIENCE_FAMILIES` map — NRI→Lookalike, Vernacular→Interest, K-2→K-8, etc. Uses `TARGETING_CONFIG` to surface demographic overlap.
- Output per card: thumbnail, PROVEN/EMERGING tier badge, market, current audience inline, Why it worked, "→ Also try on: [adjacent audience]" panel with campaign code + Copy button.
- Flow-aware: BAU filter excludes PLA-labeled winners; PLA filter pins to PLA winners only.
- Kill labels removed from Make More entirely (that belonged in Pause Now).

### Phase 4 — Refresh-don't-kill for fatigued winners
- Pause Now Signal 6 (Fatigue): for fatigued ads whose historical tier is `tier1` or `tier2`, label changes from "FATIGUED" to "REFRESH · was a winner" with blue card bg (not red). Why line explicitly says: "The CREATIVE PATTERN works — refresh visual/hook, keep same audience + format, DON'T kill."

### Phase 5 — All-Geo 2-3 per market
- When country filter = "all", Pause Now caps at 2 ads per market (soft total 14) so every geo surfaces, instead of US dominating top 10.
- Make More already implements per-market cap in the Phase 3 rebuild.

### Files touched
- `index.html` only. New globals: `AUDIENCE_FAMILIES`, `TAG_DEFINITIONS`, `_formatAudience`, `_tagPillTitle`, `_getTagExamples`, `openTagReference`, `_classifyWinner`, `_winnerWhy`, `_findAdjacentAudience`, `_renderMakeMoreAds`.

---

## Tagger Consolidation + System-wide Why Pass (2026-04-17)

### Principle
Every recommendation card now emits `Signal + Why + Action`. No silent numbers anywhere.

### Tagger: 6 sub-tabs → 3
- New pills: **Signals / Explore / Patterns**. Nothing deleted — existing tab divs re-grouped via `TAGGER_TAB_GROUPS` map in `switchTaggerTab`.
- **Signals** = Creative Review. Market Alerts section removed (duplicated Pause Now on Dashboard). "What's Working — Tag Performance" bars removed (moved to Patterns).
- **Explore** = Data Table (Tree default) + Grid (toggle). New `_exploreView` state + `setExploreView()` flips between `taggerTab-table` and `taggerTab-grid`. Grid default sort changed to Highest Impact (spend).
- **Patterns** = Tag Performance Insights headline + Combos + Heatmap (stacked). Insights card block moved from Signals.

### Data Table → 3-level tree
- Default `taggerViewLevel = 'campaign'` (was `'ad'`).
- Campaign branch rewrote to emit `Campaign ▸ Ad Set ▸ Ad` hierarchy. `renderTaggerGroupRow()` extended with `parentGroupId` so ad-set rows can nest as hidden children of campaign rows.
- Every ad row renders a verdict chip + inline Why sentence ("₹41K spent, 3 QLs, 0 TDs — pause" / "18 TDs at ₹14K CPTD — below target"). Verdict taxonomy unchanged; `why` field added to `_ins` block.

### Grid → all-creative impact view
- Each card now shows: verdict chip, market pill, impact% (share of portfolio TDs + spend), CPTD/CPTQL badge, Why line. Portfolio totals `_totSpend` / `_totTD` computed once per render.
- Threshold colors moved to per-market `SENTINEL_THRESHOLDS[mkt].cptd` (was hardcoded 30K/60K).

### Combos decluttered
- Top 10 → top 5, bottom 5 → top 3.
- Every combo card: Signal + Why (sample size, spend, prevalence in top5/bottom5) + Action ("Brief N more" / "Stop producing").
- "Key insight" footer removed (redundant with top card).

### Tag operations bar collapsed
- Four fat buttons (Load Data / Pilot 50 / Tag All New / Re-tag All) → single "Tag New" primary + overflow menu. Moved to right-aligned compact bar.

### System-wide Why pass (Dashboard Oracle)
- **Pause Now**: all 6 signal types (Burn / CPTQL leak / Wrong audience / Dead funnel / Spam / Fatigue) emit `_why` line. Dead funnel diagnoses intent gap vs no-show vs spam vs wrong audience based on `ts`, `invalidPct`, `nriPct`. Added `ts: parseNumber(r['TS']||0)` to `adCampData` mapping.
- **Make More clusters**: each card gets Why explaining the status label (Scale/Starving/Saturated/Kill/Healthy) using actual numbers. Action line now prefixed with `→ Action:` in purple.
- **Deploy These**: each Library asset card explains why that audience is the match.
- **Influencer Scaling**: each Scale Up / Pause Down creator card has Why with CPQL vs portfolio median.
- **Market Health**: inline Why cites the actual CPTD threshold crossed per market. `→ Action:` prefix on the recommendation.

### Files touched
- `index.html` only. No external deps. New/modified globals: `TAGGER_TAB_GROUPS`, `_exploreView`, `setExploreView`, `TAGGER_TAB_GROUPS` routing in `switchTaggerTab`, `_renderMakeMoreClusters` Why logic, `renderTaggerGroupRow(parentGroupId)` signature extension.

---

## Phase 3 Intelligence Wiring: Track A + B (2026-04-16)

### 3.1 Dashboard KPI sparklines
- Hero CPTD + Trials Done cards: 30-day inline sparklines (right-aligned in metric row).
- Secondary KPI row (Spend, CPTQL, QL→TD%, Enrolled / Trials Booked): 30-day sparkline per card via `renderSparkline(metric, geo, {width:80,height:18,days:30})`.
- Geo derived from dashboard country filter.

### 3.2 WoW WHY → action prescriptions
- `_buildWoWWhy()` now emits `{text, action}` pairs. Each driver gets a purple "→ Action:" line.
- Actions wired to live data: `_topPauseInMarket(mkt)` finds top spend/0-TD ads, `_topComboInMarket(mkt)` finds best `getAudiencePerformance` cluster.
- Five drivers covered: spend up + TDs flat, TD drop, NRI shift, QL→TD conversion delta, zero-TD spend concentration.

### 3.3 Market Health clipboard export
- Added `<div id="oracleMarketHealth">` Section 5 to dashboard (was missing — `renderOracleActions` was bailing out at line 7805 because the container did not exist; section is now visible).
- "Copy Slack template" button → `copyMarketHealthClipboard()` builds Monday Slack message: per-geo status emoji, spend/CPTD/CPQL/QL→TD, action verb. Honors flow filter and date range.

### 3.4 Funnel waterfall visualization
- Replaced flat 5-stage flow in `funnelTable` with `_renderFunnelWaterfall(crm, isPLA, cac)`: bar widths proportional to stage volume, leak % per stage, `kept %` color-coded green/amber/red against per-stage thresholds.
- BAU vs PLA: relabels stages (Trials Sched ↔ Trials Booked) and adjusts thresholds (PLA TS→TD has lower bar — broader audience, lower intent).
- Detail row preserves NRI/Asian (BAU) or Trials Booked (PLA) breakdown, invalid %, CAC.

### 3.5 Budget pace indicator
- New `BUDGET_PLAN_INR_CR.US` constant from summary doc §9.4 (FY26-27 monthly plan: Apr 2.25 Cr → Sep 8.10 Cr peak → Dec 2.58 Cr trough).
- `renderBudgetPace()` shows MTD spend vs plan, day-of-month progress, status pill (Ahead / On pace / Behind), pace marker on the bar, daily-spend-needed-to-hit-plan.
- Renders only when dashboard country is US or All Markets (other markets have AOP plans not yet wired).
- New `<div id="budgetPaceCard">` slot under funnelTable.

### 3.6 Tag value filter in Data Table
- New `<select id="taggerFilterValue">` next to existing category dropdown. Hidden when category = All Tags.
- `_refreshTaggerValueFilter()` populates values from current tagger data, sorted by frequency, with counts ("Testimonial (47)").
- `getFilteredTaggerDataWithDropdowns()` extended to apply the value filter when both category and value are non-"all".

### 3.8 Make More: audience-clustered recommendations
- Replaced ad-by-ad scoring with cluster-grouped cards from `getAudiencePerformance(market)`.
- Per cluster (top 5): best performer + thumbnail, cluster CPTD vs portfolio (colored delta), spend share, format/theme rec ("Make 2 more videos for NRI (BAU)").
- Status labels: Scale (CPTD ≤ 0.8x portfolio), Starving (<5% spend share, healthy CPTD), Healthy, Saturated (>30% spend share), Kill (CPTD > 2x portfolio + <2 TD).
- Flow-aware: PLA filter pins to `*(PLA)` clusters; BAU filter excludes them.

### 3.9 Make More: deployment suggestion
- Per cluster card pulls `TARGETING_CONFIG[audience].campaigns[0]` and shows it in a copyable `<code>` block.
- Targeting line: age, top 2 interests, geo, vernacular if applicable.

### Files touched
- `index.html` only. No external deps changed.
- New globals: `BUDGET_PLAN_INR_CR`, `_renderFunnelWaterfall`, `renderBudgetPace`, `copyMarketHealthClipboard`, `_refreshTaggerValueFilter`, `_renderMakeMoreClusters`.

---

## Data Pipeline Fix: UTM Nomenclature + Column Ranges (2026-04-16)

### Ad Name Resolution (fixes ~50% of April 2026 CRM→Meta matching gap)
- **Root cause**: PLA/instant forms leads have numeric Facebook ad IDs in `mx_utm_adcontent` (e.g., "120239274237860278") instead of ad names. The real ad name is in `mx_utm_term`.
- Boot-time resolution now runs on ALL leads (was PLA-only): resolves numeric ad IDs from `mx_utm_term` first, then `metaAdData` ad_id→name lookup.
- April 2026: 409 of 821 Meta leads (49%) had numeric ad IDs. These were previously unmatched.

### PLA Lead Tagging
- PLA leads from main Perf Tracker sheet now tagged with `_source: 'pla'` + `_trialBooked` based on campaign name detection (`_isPLACampaignName` on `mx_utm_medium`).
- `_filterLeadsByFlow` upgraded: now checks both `_source` AND campaign name (like `_filterCostByFlow` already did).

### Column Range Expansion
- **Leads tab**: `leads!A:BG` → `leads!A:BW` (59→75 columns). `board (ME)` column was at position 73, OUTSIDE the old range. This caused India/MEA TQL=0.
- **Cost tab**: `cost!A:H` → `cost!A:O` (8→15 columns). `type` column was inserted at position G, pushing `amount_spent` to position I, OUTSIDE the old range.

### Daily Matching Fallback
- `getAdPerformanceDaily` CRM keying: falls back to `mx_utm_term` when `mx_utm_adcontent` is numeric/empty.
- Unattributed lead detection: pure numeric ad IDs no longer falsely counted as "attributed."

---

## Phase 2: Segwise-Level Visualizations (2026-04-14)

### 2.1 + 2.2 + 2.3: Creative Leaderboard tab
- New "Leaderboard" sub-tab in Tagger with 3 sections:
  - Ranked table with campaign-level verdicts (Scale/Working/Kill/Pause) using aggregate CPTD
  - Two hierarchy views: Campaign → Ad Set (expand), Ad Set → Ad (expand with thumbnails + tag attribution)
  - Portfolio Composition: 7 horizontal bar charts per taxonomy field, colored by avg CPTD (green/amber/red)
  - Spend Allocation: 4 spend-by-tag bar charts
- PLA/BAU view adaptation: BAU shows QL→TD%, PLA shows Booking Rate
- Audience filter dropdown (populated from campaign_audience values)
- "Show All 14 Fields" toggle for tag distributions

### 2.4: Fatigue Sparklines
- `_buildFatigueSparkline()` renders 30-day rolling CPTD sparkline per fatigued creative
- Inserted into Decay tab creative cards alongside CPQL metrics

### 2.7: Audience Performance Aggregator
- `getAudiencePerformance()` groups tagger data by campaign_audience
- Returns per-cluster: spend, TD, QL, CPTD, QL→TD%, T→P%, best/worst 3 creatives

### 2.8: TARGETING_CONFIG
- Static JSON with 13 audience cluster entries from media plan audit
- Maps campaign_audience values to targeting params (age, gender, interests, geo, campaigns)

### Decision #1: Campaign-level verdicts
- Leaderboard ranks campaigns (not ads) with aggregate verdicts via market-aware thresholds

### Decision #2: Two hierarchy views
- Campaign → Ad Set and Ad Set → Ad with expand/collapse (not 3-way flat toggle)

### Decision #3: Combos show QL + CPTQL + spend
- Added totalQL, totalSpend, totalTD to combo data collection
- Each winning/losing combo card now shows: QLs, CPTQL, total spend

### Decision #5: Market-specific triggers
- `computeMarketTriggers` in Creative Review landing
- Per-market alert cards: kills (high spend/0 TD), scale signals, CPTD threshold breaches
- Color-coded: green (positive), amber (alert), red (critical)

### Decision #6: Global search
- Search input in Tagger header (magnifying glass icon)
- Filters ALL sub-tabs by matching ad name, campaign name, or ad set name
- Wired into `getFilteredTaggerData()` so all rendering functions respect it

### EU market added to tagger geo filter
- Alongside parser fix from Phase 1.8

---

## Phase 1.8: Parser Fixes (2026-04-14)

**Source:** Media plan audit — Google Sheet `1q_mScP2PfbP-cCMzcLyq1YyDkaNes2rFV4GvmWFc15g` (gid=1196222360). 100+ campaigns traced through parser, 5 misclassifications found.

### 1.13: campaign_audience parser — K-8 grade band
- Added `k-8`/`k_8` → K-8 audience. `USA_FB_Leads_Conv_K-8_*` was falling to General (BAU).

### 1.14: matchMarketFromText — EU market
- Added `/ANZ[-_]EU/i` and `/\bEU[_\s-]/` detection BEFORE ANZ catch-all.
- `ANZ-EU_*` campaigns were misclassifying as AUS.
- Added EU to: geo filter dropdown, GEO_BADGE (teal), SENTINEL_THRESHOLDS (UK-like), geoMap, mhGeos.

### 1.15: campaign_audience parser — missing keywords
- `parenting` → Interest (ANZ Parenting PLA campaign)
- `bollywood` → Interest (ANZ Bollywood LeadGen campaign)
- `premium`/`job-titles`/`job_titles`/`+income` → HNI (India premium campaigns)
- `razorpay` → Lookalike (new US LAL seed source)
- Values list updated with all flow combinations (K-8, Vernacular PLA, Chinese BAU, etc.)

### 1.16: Broad_and_NRI_Filters_PLA — documented accepted inaccuracy
- Campaign contains both `nri` and `broad`. All 10 ad sets get NRI (PLA).
- Accepted: NRI is dominant signal, campaign_audience is campaign-level by design.
- Added code comment documenting the decision.

**Validation:** 13/13 test cases pass — all previously broken campaigns now correct, no regressions on existing campaigns.

---

## Phase 1.5: Critical Fixes + Sweeps (2026-04-14, commits dc51434 → 65f3b3e)

### Sweep: Trend noise in ALL 5 comparison systems (71223ea)
- calcTrend() (secondary cards), cmp() (Tagger grid), WoW Digest (pct/arrow/color), Sentinel diagnosis (pctChange)
- All now: suppress near-zero prior, cap >200% as multiplier, suppress <5% as not actionable

### Sweep: BAU logic in PLA paths (c1ee6f6)
- WoW WHY "Driver 2" NRI shift: skipped for PLA (NRI irrelevant for broad audience)
- Oracle avgCPTQL baseline: getPortfolioMetrics → getMarketMetrics (same class as Dashboard KPI fix)
- Taxonomy parser: added pla_ and eval_ start-of-string patterns (was inconsistent with _isPLACampaignName)

### Sweep: Final audit (65f3b3e)
- PLA detail expansion: "NRI: X" → "QL→TD%: X%" (copy-paste leftover from BAU branch)
- Verified clean: no remaining getPortfolioMetrics display issues, no old sheet ID, no NRI display leaks

### 1.10: Dashboard KPIs → getMarketMetrics (universal)
- **ROOT CAUSE** of India CPTD ₹167: Dashboard used getPortfolioMetrics (Meta API spend) — India has only 3.6% coverage (₹73.8K vs ₹20.1L in cost tab)
- Switched `renderMetricTicker` and `renderLensAggregateMetrics` to `getMarketMetrics` universally
- getMarketMetrics uses costData (source of truth) + CRM direct counts — complete for all markets
- getPortfolioMetrics reserved for per-ad analysis (Tagger, Sentinel, Pause Now)

### 1.11: Trend arrows — suppress noise
- Near-zero prior (< 10% of current) → "new" badge instead of ↑495%
- Change < 3% → no badge at all (was "→ flat")
- > 200% → multiplier format ("2.1x", "5x") instead of raw percentage
- > 500% → integer multiplier ("5x", "10x")

### 1.12: PLA 4th KPI card — Trials Booked
- PLA: 4th card = "Trials Booked" with booking rate sub-text
- BAU: 4th card = "Enrolled" with CAC (unchanged)
- TL;DR: PLA shows TB count + booking rate, BAU shows enrolled + CAC
- Prior period includes `ts` for TB trend computation

---

## Phase 1: BAU vs PLA Split (2026-04-14, commit bb32532)

### 1.9: PLA QL definition — all leads are QLs
- **ROOT CAUSE** of 39 QLs vs 593 in summary doc: 484/560 PLA leads have empty `qualified_bucket` (no sales team qualifying them)
- BAU logic: `qb && !qb.startsWith('UNQUALIFIED')` → empty = NOT QL → discards 86% of PLA leads
- PLA logic: every lead entering the self-serve flow IS a QL by definition (qualified by action, not by sales)
- Fix: `normalizePLALead` now sets `isQL = !isUnqualified` (all except explicitly UNQUALIFIED)
- Verified: 447 Meta Q1 PLA leads + ~146 Google = 593 (matches summary doc)

### 1.6: normalizeAdName — em dash/space fix
- **ROOT CAUSE** of PLA showing 0 TDs: PLA UTM content has em dashes (–) and spaces that weren't normalized, so CRM leads couldn't match Meta ad names
- `normalizeAdName()` now replaces hyphens, en dashes (U+2013), em dashes (U+2014), and spaces with underscores, then collapses + trims
- Before: `amayra_testimonial_041225 – copy` (didn't match `amayra_testimonial_041225_copy`)
- After: `amayra_testimonial_041225_copy` (matches correctly)
- Improves CRM→Meta matching for ALL campaigns, not just PLA

### 1.7: PLA data source switch to 175i57-...
- **PLA_SHEET_ID** changed from `1lGAv3K_...` to `175i57-b0PSvDjCYHn8w4_wH5df8CipxIIQiy3o7VifA` (user's shared PLA Dashboard sheet)
- Now fetches 4 tabs: `pla_dump`, `pla_ac_dump` (286 additional leads), `cost`, `pla_ac_cost` (137 Eval campaign cost rows)
- Dedup by prospectid OR student_service_id (some PLA leads have empty prospectid)
- `normalizePLALead` now uses `student_service_id` as prospectid fallback

### 1.8: Eval campaign support
- `_isPLACampaignName()` now also matches `_eval_` / `eval_` patterns (Eval = MathFit evaluation flow, also automated/non-BAU)
- `_isLPCampaign()` also updated — Eval campaigns pass through like PLA (they have own CRM data)
- GODFATHER_TAXONOMY `campaign_audience.parse()` detects Eval flow as PLA
- Added `Eval (PLA)` to campaign_audience values list

### 1.1: Global BAU/PLA filter toggle
- **3-way toggle** (All / BAU / PLA) added to global filter bar after geo dropdown
- `getFlowFilter()`, `setFlowFilter(flow)` — reads/writes toggle state
- `_isPLACampaignName(name)` — detects PLA from campaign name (`_pla_` patterns)
- `_filterLeadsByFlow(data)` — filters leadsData by `_source` field (pla vs non-pla)
- `_filterCostByFlow(data)` — filters costData by `_source` AND campaign name detection
- Toggle triggers `onGlobalFilterChange()` → all views re-render with new filter

### 1.2: Flow filter wired into all data paths
- **10 metric primitives** (getSpend, getQL, getTQL, getTD_snapshot, getTD_cohort, getTS, getEnrolled, getInvalid, getNRI, getAsian): now call `_filterLeadsByFlow(leadsData)` / `_filterCostByFlow(costData)` before market filtering
- **getPortfolioMetrics()**: unattributed CRM leads filtered by flow
- **getOracleMetrics()**: CRM funnel filtered by flow
- **getAdPerformanceDaily()**: Meta API data filtered by campaign name; CRM data filtered by `_filterLeadsByFlow`; cache key includes flow
- **getAdPerformance()**: cache key includes flow
- PLA campaigns still pass `_isLPCampaign()` gate (they have own CRM data) — no behavior change there

### 1.3: PLA funnel card on Dashboard
- 3 KPI cards in `renderBauPlaComparison()`: PLA Timeout Rate, PLA TS→TD%, PLA Spend Share
- Color-coded: red >90% timeout, amber >70%, green otherwise

### 1.4: BAU vs PLA comparison table
- Side-by-side table: Spend, QLs, TS, TD, Enrolled, CPTD, QL→TD%, QL→TS%, CAC
- Delta column with directional coloring (green=better, red=worse)
- Auto-hides when no PLA data exists for selected market

### 1.5: PLA timeout metric
- Timeout rate = (QL - TS) / QL — the #1 PLA problem (leads who never book a trial)
- Integrated into 1.3 card grid

---

## Phase 0: Hygiene Sweep (2026-04-13)

### Fix 0.1: Reusable table sort
- **`_colSort()` utility** (~line 18107): DOM-based sort for flat tables. Parses numeric values (strips ₹, commas, L, K, Cr, %). Toggles ascending/descending. Adds ▲/▼ arrow to active column header.
- Applied to: sentinelTop5, sentinelBottom5, sentinelTableBody, taggerTableBody (4 tables, ~28 sortable columns)
- Headers get `cursor-pointer hover:text-text-primary` + `onclick="_colSort(...)"`
- Resets on data refresh (render functions rebuild tbody)

### Fix 0.2: shortAdName on group rows
- Sentinel `renderAggRow` (~line 17692): replaced `label.substring(0,57)+'...'` with `shortAdName(label)`
- Tagger `renderTaggerGroupRow` (~line 14670): replaced `label.substring(0,52)+'...'` with `shortAdName(label)`
- Campaign/AdSet group rows now show clean names instead of raw Meta UTM strings

### Fix 0.3: Library geo filter unhidden
- Removed `style="display:none"` from `#libraryFilter` select (~line 1192)
- Users can now filter Library by market (US, India, AUS, MEA, APAC, UK)

### Fix 0.4: _perfInsight market-aware spend thresholds
- Performance `_perfInsight` (~line 17655) and Tagger group insight (~line 14679): spend thresholds now scale proportionally to market's CPTD green threshold
- US: unchanged (base). India: thresholds ~17x lower. AUS/MEA/UK: proportional.
- Formula: `threshold = base * (market_cptd_green / 50000)`

### Fix 0.5: Grid empty state
- `renderCreativeGrid()` (~line 15323): added "No creatives match the current filters" message when grid is empty

### Fix 0.6: Top 5/Bottom 5 header tooltips
- Added `title=""` attributes to Spend, CTR, TDs, Insight headers on both Top 5 and Bottom 5 tables

### Fix 0.7: Creators sort dropdown
- Added `#influencerSort` select with 5 options: Best CPTD, Highest Spend, Most TDs, Most TQLs, Best CPTQL
- Wired into `renderInfluLeaderboard()` sort logic (~line 18608)

### Fix 0.8: Hidden Oracle modules — DEFERRED
- Modules 1/3/4/5/6/7 render to hidden divs (line 392). Marked "legacy compat containers."
- Unhiding requires Oracle tab layout redesign. Deferred to Phase 3.

---

## India CRM Integration (2026-04-13)

### New Data Source
- **India CRM connected**: `1oTXE1PzAeE0_NP95KXzuL3LS8aCtKurgIFYIPmPUBIA` (leads tab)
- `INDIA_CRM_SHEET_ID` constant added (~line 4454)
- `normalizeIndiaLead()` (~line 4566): Normalizes India CRM columns to match international schema
  - Overrides `country_bucket` from "Asia" to "India" (filterLeadsByMarket needs this)
  - Swaps UTM columns: India's `mx_utm_medium` = campaign name, `mx_utm_campaign` = ad/adset name
  - Maps `board` → `board (ME)` for IB/IGCSE TQL filtering
  - Sets `ethnicity: ''` (NRI not applicable to India)
  - Tags `_source: 'india_crm'`
- `fetchIndiaCRM()` (~line 4632): Pulls leads tab, filters to Meta-only, deduplicates by prospectid, merges into leadsData[]
- India cost NOT pulled (already in main cost tab)
- Chained into boot flow (after PLA) and Refresh Data flow

### Bug Fixes
- **India added to ALL geo dropdowns**: dashboardCountryFilter, sentinelGeo, taggerFilterCountry, ciFilterCountry, influencerGeo, libraryFilter, briefMarket, settingsDefaultMarket
- **Tagger pilot filter**: Added India case — matches `IND_`, `_IND_`, `INDIA`, `CBSE`, `ICSE` campaign prefixes

### Known Limitations
- India CRM sheet currently only has April 1-10 data (not full Q1)
- `board` column is ALL "others" in current data — India TQL will be 0 until IB/IGCSE leads appear
- `mx_utm_adcontent` not available in India CRM — India leads won't match to individual Meta ads for creative attribution
- `getAdCampaignBreakdown()` line ~5823 still treats India TQL as all QLs (needs per-lead board tracking to fix)

---

## Tagger Tab — Godmode Sweep (2026-04-09)

### Layout Fixes (post-screenshot review)
- **Global filter bar (date picker) now visible on Tagger tab** (~line 3567): Removed `'tagger'` from the hide list. Date pickers, presets (Mo/30d/90d/All), and global geo filter now accessible from Tagger.
- **Tag Performance Insights moved inside Creative Review tab**: Was above the tab bar (visible on all sub-tabs). Now inside `taggerTab-review` — only shows when Creative Review is active. Data Table/Heatmap/Combos/Grid no longer have insights cluttering above them.

### Phase 1: Data Layer
- `tagged_at` bridged into tag data flow (~line 12840, 12948): Supabase cache load and API tagging both set `tags.tagged_at`, enabling downstream renderers to show tag dates
- `taggerCount` now updates on initial load (~line 13408), not just on country change — fixes "0 creatives" display when Meta API fails but Supabase loads
- `correctTagsFromAdName()` verified correct for statics — keeps AI vision for talent_type (Child/Parent/None/Tutor), no change needed

### Phase 2: Data Table Upgrades
- **"vs avg" CPTD arrows** (~line 14542+): `renderTaggerTable()` computes per-market benchmarks, passes to `renderTaggerAdRow()`. CPTD cell shows ▼/▲ percentage vs portfolio average (green below, red above, hidden within 5%)
- **Compact action buttons** in Insight cell: Scale (↑) or Pause (⏹) button per row, persists via `oracleAction()` to Supabase. Shows ✓/⏸ after action taken
- **Tag column max-height**: `max-h-[2.5rem] overflow-hidden` prevents tag pill wrapping from blowing up row height
- **Metric tooltips** on Spend/QL/TD column headers: title attributes with definitions
- **tagged_at badge**: Small date (e.g., "Apr 9") shown after confidence dot in tag pills, with full timestamp on hover

### Phase 3: Metric Legend Bar
- **New HTML block** between tab bar and tab content (~line 916): Shows CPTD/CPQL/QL→TD% definitions + green/amber/red color legend + dynamic threshold note
- `_updateTaggerThresholdNote()` helper: Updates threshold note on country change and initial load (e.g., "Green = CPTD < ₹35,000 (US default)")

### Phase 4: Thumbnails + Empty States
- **Unified thumbnail fallbacks**: Data Table now shows ▶/□ (was `?`), Grid shows ▶/□ (was emoji). Matches Creative Review pattern across all views
- **Fetch Thumbnails button**: Now visible when ANY creatives lack thumbnails (was hidden at >50% coverage)
- **Heatmap empty state**: Actionable guidance instead of "No data" — suggests changing filters or running Pilot 50
- **Combos empty state**: Explains "Need 3+ creatives per tag combo" instead of bare "No data"
- **Supabase failure toast**: Shows "Tag database offline — using local backup" warning when creative_tags load fails

### Phase 5: Insights Density
- **Insight cards reduced from 6 to 3** (~line 13765): One clean row in 3-col grid, instantly scannable. Remaining insights still available in Heatmap tab

### Functions modified
- `rebuildTagMap()` — no change needed (tags.tagged_at flows through c.tags)
- `renderTaggerTable()` — added benchmark computation
- `renderTaggerAdRow(c, catFilter, indent, benchmarks)` — new param, CPTD arrow, action button, tag max-height, tagged_at badge, unified thumbnail fallback
- `showTaggerResults()` — taggerCount on load, threshold note init, button visibility fix
- `onTaggerCountryChange()` — threshold note update
- `_updateTaggerThresholdNote()` — new helper function
- `renderTaggerHeatmap()` — helpful empty state
- `renderTagCombos()` — helpful empty state
- `renderTaggerInsights()` — slice(0,3) instead of slice(0,6)
- `renderCreativeGrid()` — unified thumbnail fallback

---

## Creators Tab — Market-Aware Verdicts + Market Analysis Functions (2026-04-05)

### Creator verdict logic rewrite (~line 18322)
- Replaced naive avgCPTD-based Scale/Watch/Drop with market-aware SENTINEL_THRESHOLDS
- New tiers: **Low Data** (<3 ads or <50K spend, gray badge), **Scale** (CPTD < green), **Watch** (CPTD < amber), **Over** (CPTD > amber, red), **Funnel Leak** (QLs > 0 but 0 TDs, red), **Drop** (0 QLs, red)
- Summary cards updated: added Over, Funnel Leak, Low Data cards alongside Scale/Watch/Drop
- Tier badges in table rows updated with all 6 tiers
- Leaderboard verdict text now shows counts for all tiers

### getMarketAnalysisSummary() (~line 11737)
- New function: returns structured analysis for each market (US/India/AUS/MEA/UK)
- Groups ads by hook, content_format, campaign_audience; computes avg CPTD/CPQL for groups with >=3 ads
- Returns best/worst for each dimension, overall verdict vs SENTINEL_THRESHOLDS, actionable topAction string

### renderMarketAnalysis() (~line 11796)
- Console helper: call `renderMarketAnalysis()` from browser console to get a clean table of all markets

---

## Tagger Creative Review — Show All Tags + Confidence Badge (2026-04-05)

### Creative Review card tag pills
- `creativeCard()` (~line 13740): replaced hardcoded 4-tag pills (hook, audience, format, production) with dynamic loop over ALL `GODFATHER_TAXONOMY.allFields`
- Skips: confidence, campaign_audience (shown last), creative_type (redundant with Video/Static badge), talent_name (free text)
- Uses `TAG_COLORS[GODFATHER_TAXONOMY.getColor(f)]` for per-field coloring
- Shows up to 8 pills, then "+N more" overflow pill
- Audience pill always rendered last

### Confidence badge
- After tag pills: green "eye Vision" if `tags.confidence === 'confirmed'`, amber "memo Text" if `'inferred'`
- 8px text, subtle inline badge

### Untagged CTA label
- `showTaggerResults()` (~line 13180): changed untagged count text from `"N untagged of M"` to `"N untagged — click Re-tag All to tag with Haiku vision"`

---

## Learning System — Outcomes, Wrong Verdicts, Suppression (2026-04-08)

### #3: Action outcome tracking
- `_computeActionOutcome(action)` compares ad metrics before vs after `actioned_at` date
- Action Log table shows: Spend %, TDs before→after, CPTD direction
- Green = outcome matches intent (scaled→more TDs, paused→less spend), Red = opposite

### #2: Wrong verdict feedback
- "Wrong?" button on each Action Log row, sets status='wrong' in Supabase
- `getCreativeVerdict()` checks for wrong-verdict history:
  - Scale marked wrong → demoted to Working ("previously overrated, watch closely")
  - Pause marked wrong → promoted to Watch ("previously misjudged, keeping alive")

### #1: Recommendation suppression
- `_isRecommendationSuppressed(tag)` checks if a tag has been dismissed ≥2 times
- "DO MORE OF" and "AVOID" tag recommendations skip suppressed tags
- Prevents the same stale suggestions from showing forever

### Performance tab actions
- Top 5 Performers: Scale button per row
- Top 5 Budget Drains: Pause button per row
- Both persisted via oracleAction to Supabase

---

## PLA Data Integration — Second CRM + Cost Layer (2026-04-08)

### New data source: PLA Google Sheet (1lGAv3K_RFEwcKthjzPiy4x3zlOA010lH_73f46lJ5A8)
- **pla_dump tab**: ~716 lead-level CRM rows (prospectid, utm_campaign, utm_content, trial_done, paid, ethnicity)
- **cost tab**: ~1,038 daily spend rows (campaign_name, amount_spent, impressions, clicks)
- Fetched via `fetchPLAData()` chained after `fetchSheetData()` at boot and on save
- **Normalization**: utm_source→medium (dc_fb_m=meta), ip_region→country_bucket (US-CANADA→US), qualified_bucket→qls (excluding UNQUALIFIED-*), campaign hyphens→underscores
- **Dedup**: leads by prospectid, cost by campaign_name+day — no double-counting
- **Non-meta leads filtered out**: only dc_fb_m and Instagram sources pass through
- **Zero downstream changes**: appends to leadsData[] and costData[] — all existing functions (buildLookupMaps, mergeCRMWithMeta, getAdPerformance, filterLeadsByMarket) work unchanged

---

## Tag Map Fix — Tags invisible after Pilot 50 / Load Data (2026-04-07)

### Bug: All UI views showed "No tags" / "Needs tagging" despite 50 pilot tags saved to Supabase
- **Root cause:** `_tagMap` (used by `getAdPerformance()` → all UI views) was built once in `buildLookupMaps()` at startup but never rebuilt after `tagCreatives()` updated `state.taggerData`
- **Two broken paths:** Both the Pilot 50 path and the `skipApiTagging` (Load Data) path updated `state.taggerData` but never refreshed `_tagMap` or invalidated `_adPerfCache`
- **Fix:** Added `_tagMap` rebuild + `invalidateAdPerfCache()` at end of both code paths in `tagCreatives()`
- **Affected views:** Grid, Data Table, Heatmap, Combos, Creative Review — all now pick up tags immediately after tagging or loading

---

## Phase 4 — UI Overhaul & Taxonomy Consistency (2026-04-05 night)

### Create Tab Overhaul
- Haiku AI generation (claude-haiku-4-5-20251001) replaces template engine
- PIN-locked via Supabase `godfather_config` table (key: `create_pin`)
- Cancel PIN = no generation (removed template fallback on cancel)
- Model badge: "Haiku" in teal (was "Sonnet" in purple)
- ICP TYPE pills removed → Audience pills (7 values: NRI, Broad/Advantage+, PLA, Influencer, Vernacular, Retargeting, General)
- Behavioral segment dropdown removed → Targeting dropdown with actual Meta ad set targeting names from ALL markets (LAL Enrolled, LAL PayU, Indian Interests, Expats, HNI, Metro Tier 1, etc.)

### Tagger PIN-locked
- `retagCreatives()` and `tagUnanalysedLibrary()` both gated behind PIN
- Prevents accidental credit spend

### Lens/Insights Overhaul
- Winning Combos section: 3 taxonomy pairs (hook × pain_benefit, hook × campaign_audience, content_format × production_style)
- Adaptive minimums per market tier from GODFATHER_TAXONOMY (US/India: 3 creatives/5 TDs/₹50K; AUS: 2/3/₹25K; MEA/UK: 2/2/₹15K)
- Audience cards: Best Hook + Best Format + Avoid — each with thumbnails and ad names
- `extractAudience()` rewritten to use `GODFATHER_TAXONOMY.fields.campaign_audience.parse()`
- emotional_tone and language REMOVED from Tagger insights (decision #4 — too subjective)
- Format/Hook values validated against taxonomy (no cross-field contamination like "Empathetic" as format)

### Oracle/Dashboard
- WoW digest on open: "This week vs last week" summary (Spend, QLs, TDs, CPTD)
- Untagged ads alert with re-render after Supabase tags load

### Creators Tab
- `talent_name` from tags as primary identifier
- Campaign name heuristic (`_isInfluencerAd()`) as fallback only

### Thumbnails Everywhere
- Insights Best Hook + Avoid: top 3 ads with thumb + name + metric
- Dashboard Best Recent: thumb + `shortAdName()`
- Deep Dive Winning Combos + Money Pits: example ad with thumb
- Action Log: `_oracleThumbnail()` + `shortAdName()`
- (Oracle Pause/Scale, Tagger, Creators already had thumbnails)

### Taxonomy Consistency Audit
- H-codes → plain English migration map added (H-TEST→Social Proof, PB-CONF→Confidence, etc.)
- `tagLabel()` fixed from pass-through to lookup via `_TAG_VALUE_RENAMES`
- `extractAudience()` replaced with taxonomy parser (killed "High NRI", "Universal", "Non-NRI", "Indian Interests" as audience values)
- "High School Parents"/"Universal"/"Other" added to rename map
- Oracle AI prompt updated: `icp_type` → `audience`, `icp_segment` → `segment`
- All user-facing "ICP" labels → "Audience"
- Creative Review arrows now show "vs avg" inline (not just tooltip)
- Non-NRI gap check → Broad/General gap check

### Already Built (verified this session)
- Brand safety: `validateBrand()` post-generation check
- Library: asset-only (no performance data)

---

## E2E Audit Fixes (2026-04-06)

### prospectid added to LEADS_CACHE_FIELDS (line 4279)
- Was missing — dedup by prospectid only worked on fresh API pull, NOT cached loads
- Cached loads silently skipped dedup, inflating TD counts
- Now cached loads preserve prospectid and dedup works consistently

### CRM dedup logging (line 5613)
- Logs warning when rows lack prospectid (count + percentage)
- These rows cannot be deduplicated — visibility into data quality

### Redundant meta filter removed (computeSparklineData)
- costData is already meta-filtered at source (line 4275)
- Removed duplicate `r.medium !== 'meta'` check in sparkline engine

---

## Time-Series Trend Charts (2026-04-06)

### `renderTrendCharts()` function
- New collapsible "Trends" section between WoW digest and action sections
- 2×2 grid of full-width SVG trend charts: Spend, TDs, CPTD, QL→TD%
- Reuses `computeSparklineData()` — no new data fetching
- Respects dashboard geo filter (market selector)
- 30-day window by default
- Features: gradient fill, trend-colored lines (green=good, red=bad), Y-axis labels, X-axis dates, hover tooltips on data points
- `_buildTrendSVG()` renders responsive SVG with 3 Y-ticks, 3 X-labels, hover circles
- DOM: `<div id="trendSection">` between wowSection and untaggedAlert
- Render pipeline: called after `renderWoWDigest()`, before `renderUntaggedAlert()`

---

## Oracle WHY — CPTD Movement Decomposition (2026-04-06)

### `_buildWoWWhy()` function (line ~7448)
- Appended inside WoW digest card, below the 4-metric grid
- Plain English bullet points explaining WHY metrics moved
- 4 drivers analyzed:
  1. **Market mix**: identifies markets where spend increased but TDs stayed flat
  2. **Market TD drop**: flags markets with >30% TD decline
  3. **NRI shift**: tracks NRI TD movement (highest-converting segment)
  4. **Funnel leak**: QL→TD conversion rate change >20%
  5. **Spend burn**: flags when >30% of spend goes to zero-TD markets
- Uses existing `filterCostByMarket()`, `filterLeadsByMarket()`, `isNRIEthnicity()`
- Max 4 reasons shown, capped at most impactful
- Appears only when there's enough data to explain (>1000 spend in either week)
- Styled as purple divider below metrics, matching WoW card gradient

---

## Taxonomy Rebuild — GODFATHER_TAXONOMY (2026-04-05)

### GODFATHER_TAXONOMY constant (single source of truth)
- New constant at line ~1775 defines ALL tag fields, allowed values, colors, labels
- 13 AI fields: hook, pain_benefit, emotional_tone, content_format, talent_type, talent_name, production_style, creative_type, language, offer_present, cta_type, headline_theme, visual_style
- 1 parsed field: campaign_audience (derived from campaign name, not AI-tagged)
- Helpers: getLabel(), getColor(), getValues(), aiFields, allFields
- Combo pairs and market-tier minimums defined in same constant

### Supabase schema rebuild
- `creative_tags` table: 15 columns, composite PK (ad_name, account)
- `godfather_config` table: PIN storage
- Old 9-column creative_tags table dropped and rebuilt with new schema

### Old tag systems killed
- `tagged_creatives`, `tag_cache`, `gf_tagCache` reads all removed
- `syncTaggerToSupabase`, `loadTaggerFromSupabase`, `syncTagCacheToSupabase`, `loadTagCacheFromSupabase` all stubbed as no-ops
- `backfillUnknownTags` killed (40 lines → 1-line pass-through)
- Version-gated localStorage migration clears old caches on taxonomy v2

### Supabase fallback
- creative_tags loads to `state._creativeTagsCache` + `state._tagLookup`
- localStorage backup on successful Supabase load
- Read-only fallback on Supabase failure

### Tagger prompt rewrite
- `buildTaggerSystemPrompt()` auto-generates from GODFATHER_TAXONOMY.aiFields
- No hardcoded JSON schema — changes to taxonomy constant auto-propagate
- Rules for content_format vs hook distinction included in prompt

### validateTags rewrite
- Now references GODFATHER_TAXONOMY.fields instead of old TAG_CATEGORIES
- Handles freeText fields (talent_name)
- 25 lines → 10 lines

### supabaseUpsert rewrite
- Writes all 13 AI fields + campaign_audience + account
- Composite PK: (ad_name, account) — `on_conflict=ad_name,account`
- Cache read dynamically extracts all GODFATHER_TAXONOMY.allFields

### campaign_audience parsing
- Applied in tagging loop (new creatives) AND both merge paths (cached + mixed)
- Uses GODFATHER_TAXONOMY.fields.campaign_audience.parse() — rule-based, not AI

### Field name rename (bulk)
- `hook_type` → `hook` (100+ references)
- `icp_target` → `campaign_audience` (40+ references)
- `format` (as tag field) → `content_format` (40+ references)
- `hook_type_secondary` → `hook_secondary`
- `migrateTags()` function converts old localStorage data on load

### TAG_CATEGORIES eliminated
- Was: 10-line constant with hardcoded old-taxonomy fields
- Temporarily aliased to GODFATHER_TAXONOMY.fields during migration
- All 30+ UI references inlined to GODFATHER_TAXONOMY.getLabel/getColor/getValues/fields
- Constant and alias fully deleted — zero references remain

### Oracle/Library/Performance fixes
- Oracle chat: allHooks/allAuds now from GODFATHER_TAXONOMY.getValues()
- Library batch tagger prompt: auto-generates field specs from GODFATHER_TAXONOMY
- Library editLibraryTag: TAG_OPTIONS replaced with GODFATHER_TAXONOMY.getValues()
- "Parent testimonial" special-casing removed (new taxonomy separates format from hook)
- TAG_DIM_LABELS updated to new field names

### Syntax check: OK — all 4 script blocks validated

---

## Phase 3: Vision Tagger Pipeline (2026-04-03)

### Tagger rewrite: Haiku vision, per-creative, Supabase cache
- `tagCreatives(rawData)` fully rewritten — processes ONE creative at a time (not batches)
- Each creative gets its own image via `fetchImageAsBase64()` sent as base64 to Claude
- Model switched from `claude-sonnet-4-20250514` (text-only) to `claude-haiku-4-5-20251001` (vision)
- New taxonomy: talent_name, talent_type, setting, production_style, subject_in_frame, offer_present, cta_type, language, creative_type (replaces old hook_type/pain_benefit/emotional_tone/icp_target)
- Supabase `creative_tags` table used as persistent cache — checked BEFORE API call
- localStorage tagCache kept as fallback for old-taxonomy creatives (migrated on read)
- `confidence` field: 'confirmed' (image fetched) or 'inferred' (text-only)
- `buildTaggerSystemPrompt()` + `buildTaggerMessage(creative)` replace old `buildTaggerPrompt(batch)`
- Old `buildTaggerPrompt()` kept as legacy wrapper (returns system prompt) for any external callers
- Progress bar updates per-creative with ad name preview
- Syntax check: OK

---

## Create Tab, Heatmap & QA Fixes (2026-04-02 ~3AM)

### Fix 11: Key Angle no longer auto-filled
- `prefillForgeFromIntel()` was auto-filling briefAngle with raw tag formulas
- Removed auto-fill. Winning formula still shows as indicator above the field, but angle is user-driven.

### Fix 12: Google Ads template — grade band + AUS language
- Google Ads template now includes grade band in title and Ad Group 2 headlines
- AUS uses "Maths" (not "Math") throughout — `isAUS` flag switches all instances
- Headline 7 now grade-specific: "Ages 7-11 Maths Coaching" instead of generic

### Fix 13: Feedback appends to angle instead of replacing
- `sendFreeform()` was replacing the angle field with feedback and rebuilding from scratch
- Now appends: `"existing angle. FEEDBACK: your message"` — preserves original context
- Still template-based (no API) so changes are limited to what the template uses from the angle field

### Fix 14: QA now uses leadsData fallback
- `getCRMPortfolioTotals()` only checked `state._crmLeads` (populated only on refresh)
- Now falls back to `leadsData` (populated during boot from Google Sheets)
- QA should show non-zero values without requiring manual refresh

### Fix 15: Heatmap ₹5K threshold lowered to ₹1K
- `getFilteredTaggerData()` now accepts optional `minSpend` parameter
- Heatmap passes ₹1K (aggregates across tags, needs more data points)
- Lens/Sentinel/Grid still use ₹5K (individual creative analysis needs significance)

---

## Layout, Insights & Oracle Fixes (2026-04-02 late night)

### Fix 6: Make More geoTag visible — moved outside truncate
- geoTag (`<span>US</span>`) was inside a `truncate` paragraph, clipped by CSS
- Moved geoTag into a flex wrapper outside the truncated name element

### Fix 7: Deploy These now shows data
- `audRows` was computed inside `if (!_s2Active)` block — undefined when CRM data loaded
- Replaced with inline audience computation (`_deployAuds`) that always runs from `data`
- Deploy section now matches library assets to best-performing audience by CPTD

### Fix 8: Header overlap fixed for ALL views
- Changed layout: `main` is now `flex flex-col h-screen`, filter bar is `shrink-0`
- Views wrapped in `flex-1 overflow-y-auto` scrollable container
- Outer div changed from `overflow-y-auto` to `overflow-hidden`
- Filter bar no longer overlaps content on any view (was sticky top-0 over 24px padding)

### Fix 9: Recommended Next Creatives — human-readable labels
- Brief cards showed raw tag codes (H-TEST, PB-GRADE, F-VERN-TESTI)
- Added `tagLabel()` to: title, hook, frame, format, ICP, avoid pattern, and angle text
- Now shows: "Parent testimonial + Grades & school" instead of "H-TEST + PB-GRADE"

### Fix 10: Insights audience names — no more "Universal"
- `extractAudience()` returned raw `icp_target` values (e.g. "Universal") from tagger tags
- Now maps through `tagLabel()` — "Universal" → "All Audiences"
- Added more KNOWN_AUDIENCES: influencer, influ, desi, telugu, gujarati, tamil, hindi
- Audience cards now show meaningful names derived from campaign naming convention first

---

## Critical Boot & Data Fixes (2026-04-02 evening)

### Fix 1: Blank page during boot — loading overlay added
- Added `#bootLoader` overlay (spinner + "Loading Godfather" text) shown during async data fetch
- Overlay shown in `init()` before boot promises, hidden in `Promise.all` callback after data ready
- Previously: dashboardContent was unhidden immediately but empty until data loaded

### Fix 2: Date range not visible on load
- Pre-fill `dashboardDateFrom` and `dashboardDateTo` with `COST_DATA_START` → today on boot
- Previously: inputs were empty even though `getGlobalDateRange()` silently defaulted to same range
- User could not tell what date range was being used

### Fix 3: NRI count inflated — 3 locations missing non-NRI exclusion
- **Line ~4891 (CRM daily):** `ethnicity.includes('nri')` now also checks `!startsWith('non')` — was counting non-NRI as NRI
- **Line ~5142 (getPortfolioMetrics unattributed):** Same fix + added `qls === '1'` guard — was counting non-QL leads in NRI total
- **Line ~5334 (getAdCampaignBreakdown):** Same `!startsWith('non')` fix
- Consistent with canonical `isNRI()` at line 4634 and all other NRI checks

### Fix 5: Country filter not applied to Make More / Pause Now
- `getAdPerformanceDaily()` had `if (market && adMarket && adMarket !== market) return` — when `adMarket` was empty string, the `adMarket &&` short-circuited, letting unknown-market ads through ALL country filters
- Fixed both Meta rows (line ~4953) and CRM-only rows (line ~4982): removed the `adMarket &&` guard
- Now: if a market filter is active and the ad's market is unknown (empty), it's excluded — no more cross-market leakage

### Fix 4: Non-LP campaigns showing in Oracle
- `_isLPCampaign()` default changed from `return true` to `return false`
- Previously: campaigns without LP/non-LP signal were included, showing unmatchable CRM numbers
- Now: only campaigns with explicit LP signals (signup, _lp_, fop) are included

---

## UX Clarity Fixes (2026-04-02)

### Issue 1: Create tab recommended briefs guard
- Recommended Briefs section now checks if `state.taggerData.length > 0` or `metaAdData.length > 0` before rendering
- When no data loaded, shows message: "Load creative data from Tagger or Meta API to see data-driven recommendations."
- Previous duplicate-removal logic moved above the guard for correctness

### Issue 2: Tagger comparison arrows now have context
- Added `title="vs portfolio avg"` tooltip to all comparison arrow spans in `cmp()` function (creativeCard)
- Added inline note "Metric arrows compare against portfolio average." to Scale These and Pause sections
- Users can now hover any arrow to see "vs portfolio avg"

### Issue 3: Parent testimonial tagged as HOOK — display clarification
- Added "(content type)" suffix when "Parent testimonial" appears as Best Hook in Insights audience cards
- Added "(content type — hook within varies)" in Monday Playbook creative pattern when hook is Parent testimonial
- Added code comment to TAG_CATEGORIES explaining Parent testimonial is a FORMAT, kept as hook for backward compat
- Did NOT change tag taxonomy to avoid breaking existing tagged data

### Issue 4: Asian/Non-NRI audiences in Insights (investigation)
- Root cause: `extractAudience()` (line ~14356) extracts audience from campaign naming convention, not from tags
- The `KNOWN_AUDIENCES` map has 'expat' but no 'asian' key — Asian audiences only show if tagged via `icp_target`
- `icp_target` values list (line ~15691) does include 'Asian Parents', and TAG_OPTIONS includes it
- Insights `audRows` filter requires `ads >= 3 && cpql !== null` — if fewer than 3 Asian-tagged ads exist, they won't show
- Taxonomy gap: the tagger prompt audience options (line ~12479) list "NRI parents | Non-NRI parents | Local parents | ..." but NOT "Asian parents" — so Claude tagging never assigns "Asian"
- Fix needed: add "Asian parents" to the tagger prompt's AUDIENCE line to enable tagging going forward

### Issue 5: Library column mismatch (investigation)
- Library expects columns: Particular, Creative Name, Format, Link/Notion Link, Designer, Month, Week, Live Status, Hook Type, etc.
- Sheet has: Month, Week, Particular, No. of Sets, Link, Designed By, Shared for, Live Status
- `normalizeLibraryRow()` maps 'Particular' → name, 'Link' → notionLink, 'Designed By' → designer, 'Month' → month, 'Week' → week
- Missing mapping: "No. of Sets" is not mapped (expected "Sets" or similar), "Shared for" and "Live Status" need to match geo-specific patterns like "Live Status US"
- The sheet columns ("Shared for", "Live Status") don't match expected patterns ("Live Status US", "Shared for  US")
- Likely cause: user connected a summary/tracker sheet instead of the per-geo creative tracker sheet
- No code change needed — user should connect the correct sheet or rename columns

---

## Dashboard + Performance Bug Fixes (2026-04-02)

### Bug 1: Make More CPTQL colors were inverted
- CPTQL values in Make More cards showed RED even for efficient ads (below avg)
- Root cause: absolute thresholds (5K/10K) instead of relative to portfolio avg
- Fix: color now compares against portfolioCPTQL; defaults to green (Make More = winners)

### Bug 2: CPTD showing "—" when TD = 1 or 2
- Display threshold was `td >= 3` in multiple places, hiding valid CPTD for low-TD ads
- Fixed in: cross-combo cards, tagger aggregation, performance tab totals, insights audience rows
- Threshold changed from `td >= 3` to `td >= 1`

### Bug 3: "improving (0→3 QLs)" label was cryptic
- Changed to "0→3 QLs (vs prior wk)" to clarify the comparison period

### Bug 5: "Expat Parents" label renamed to "Non-NRI Parents"
- ICP pill button text: "Expat Parents" → "Non-NRI Parents"
- TAG_DISPLAY mapping: 'Expat' → 'Non-NRI Parents'
- Legacy tag migration: 'Non-NRI' and 'Expat' both → 'Non-NRI parents'
- Tagger prompt updated: "Expat parents" → "Non-NRI parents"
- icp_target values list updated

### Bug 6: Performance tab garbage row with numeric-only ad name
- Added filter: ad name must contain at least one letter character
- Applied in: auto-populate Top 5/Bottom 5, Sentinel rankable filter, Insights auto-compute
- Prevents rows like "12023853648954027​8" with ₹0 spend from appearing

### NOT bugs (already fixed):
- Bug 4 (LEAP in Pause Now): getAdPerformance() already applies _isLPCampaign gate (line 5032)
- Bug 7 (APAC geo mapping): matchMarketFromText() already handles ANZ-UK→UK, ANZ-NZ→APAC, ANZ-SG→APAC, ANZ→AUS

---

## LP Campaign Gate — Instant Form Exclusion (2026-04-02)

### Root cause: CRM attribution gap polluting all analysis
- CRM only captures UTMs from landing page (LP/Signup) campaigns
- Instant form campaigns (Leap/LeadGen/PLA) have no UTM → CRM shows 0 QLs/TDs for these ads
- These ads appeared as high-spend zero-conversion in Tagger, Insights, Pause Now, Make More
- Made "Pause Now" recommend pausing ads that are actually performing (just can't be attributed)

### Fix: _isLPCampaign() gate function
- Checks campaign name + ad name for LP signals: "signup", "_lp_", "_fop", "lpfop"
- Checks for instant form signals: "leap", "leadgen", "lead_gen", "_pla_", "instant", "on_facebook"
- Default: include if no signal found (conservative — better to show than hide)

### Applied in getAdPerformance() and getAdPerformanceDaily()
- getAdPerformance(): filters out instant-form ads from aggregated results
- getAdPerformanceDaily(): filters out instant-form CRM-only rows
- Console log reports count of excluded instant-form ads
- RULE: Instant form campaigns MUST NOT appear in Tagger, Insights, Pause Now, Make More, or Sentinel. Their CRM data is unreliable by design.

---

## Create Tab: Email/SMS/RCS + Influencer Fix + Image Removal + Feedback Mode (2026-04-02)

### New formats: SMS and RCS
- Added SMS and RCS to Platform pills
- Template-based generation for both — SMS (240 char max), RCS (Asset + Headline + Body + Button)
- Journey stage specified via Key Angle field
- ICP-aware variants (NRI/Non-NRI/Asian tone shifts)
- All token-personalized: {ParentName}, {ChildName}, {Link}

### Email template enriched
- 3 variants: MathFit philosophy lead, Social proof + outcomes, Trial experience preview
- ICP-aware content (NRI = AI-era framing, Non-NRI = math anxiety empathy)
- Journey stage adaptation guidance included in output

### Influencer Script: two-bucket auto-switch
- US/AUS/UK/Global → Partnership ads: Primary Text + Headline + Description + talking points + script suggestions
- India/MEA → UGC scripts: full 30-40s scripted with timecodes + Meta ad copy
- US patterns sourced from real ads (Ana, Ona, Damla, Heena, Shweta, Priyanshul)
- RULE: US influencer output is ad copy, NOT a video script. Creator makes their own video.

### Image creation removed
- Output mode pills: only "Copy Only" remains, section hidden
- Aspect ratio section hidden
- Image generation always disabled in showResult()

### Freeform → Feedback mode
- Renamed "Freeform" to "Feedback"
- No longer calls Claude API — pastes feedback into angle field and regenerates via template
- Textarea replaces single-line input for pasting existing copy
- Zero API credits

---

## Notion Brand Intelligence for Create Tab (2026-04-02)

### New Brief Panel selectors
- Added Grade Band dropdown (K-2 / 3-5 / 6-8 / 9-12) between Segment and Funnel Stage
- Added Content Angle (LOC) dropdown with 12 angles: Pedagogy, USPs, Trial, Acceleration, Topicwise, Competition, HighSchool, OnlineVsOffline, GroupVs1on1, Quirky, ParentRelief
- Both wired into brief object in generateContent() and generateFromTemplate()

### New Notion intelligence constants (before BANNED_WORDS)
- GRADE_TONE: tone/voice per grade band (Wonder Builder, Logical Explorer, Identity Seeker, Future Planner)
- LOC_DATA: angle + hook per content angle (12 lines of copy from Notion)
- HOOKS_BANK: grade-specific hooks (5-7 per grade band, sourced from Notion)
- PROVEN_HEADLINES: market-specific proven headlines (static, google, openers) for US/India/AUS/MEA
- VOCAB_OWN, VOCAB_CAREFUL, VOCAB_NEVER: vocabulary rules from brand guidelines
- US_ARCHETYPES: Nurturer and Laidback Guide parent archetypes with entry frames and red lines

### Expanded BANNED_WORDS
- Added 20 new entries from Notion "Words We Never Use" list

### Enriched Static Ad template
- Now uses grade tone label and LOC hook in Option 1 (emotional lead)
- Option 2 pulls from PROVEN_HEADLINES for the market
- Option 3 uses HOOKS_BANK grade-specific hooks
- Footer includes proven openers, grade tone summary, and vocabulary guidance
- Visual direction varies by grade band

### Enriched Influencer Script template
- Option 1 Scene 7 now appends grade tone to MathFit broader benefit
- Option 2 Scene 7 now appends "That's MathFit" tagline

### Enriched buildUserMessage
- Includes Grade Band and Content Angle in the brief message sent to API

### Enriched buildSystemPrompt
- Added Brand Personality (Guru-Coach archetype), Voice Rules, US Parent Archetypes
- Added Vocabulary Rules (own/careful/never), Competitive Positioning, Five Messaging Pillars

---

## Section 2: Data Layer Rebuild (2026-03-31)

### Settings simplification
- Replaced 7 Google Sheets URL inputs with single Sheet URL + Google API Key
- Test Connection button fetches first 5 rows from leads + cost tabs, shows preview table
- Stored in gf_sheetUrl + gf_googleKey in localStorage

### Boot sequence + data loading
- loadCachedData() runs first for instant render from slim cache
- fetchSheetData() runs async in background, re-renders on completion
- Slim cache: only 16 metric fields cached (~500KB vs ~10MB full leads)
- Cache keys renamed to gf_v2_* to bust stale data; old keys purged on boot
- Status line: "X leads · Y cost rows · loaded HH:MM"
- Loading spinner guards KPI cards and Oracle cards while data loads

### Metric functions (all read from leadsData + costData arrays)
- getSpend(market, start, end, medium='meta') — filters cost tab to meta-only
- getQL, getTQL, getTD_snapshot, getTD_cohort, getTS, getEnrolled, getRevenue, getInvalid, getNRI, getAsian
- getTQL: per-market logic — NRI for US, IB/IGCSE for India/ME, all for APAC/UK. Handles "all geo" with per-row dispatch.
- getMarketMetrics() — returns all metrics as one object with derived ratios
- getCampaignBreakdown, getAdBreakdown — group by mx_utm_campaign / mx_utm_adcontent
- Leads filtered to meta-only at load time (matches old CRM "select * where G='meta'")

### Dashboard KPI cards rewired to Section 2
- Hero row: CPTD + Trials Done (was CPTD + ROAS)
- CPTD card subtitle: format CPTD from tagger data (e.g. "Video ₹38K · Static ₹45K")
- Secondary row: Spend, CPTQL, QL→TD%, Enrolled (was Spend, TQLs, CPTQL, Enrolled)
- Regional cards: per-geo metrics from getMarketMetrics()
- Prior-period comparison: all from getMarketMetrics() (was getOracleMetrics + getCRMPortfolioTotals)
- ROAS card removed
- Funnel visualization uses Section 2 data

### Oracle Pause Now + Make More
- Pause Now: getAdBreakdown() where spend > ₹50K AND TD = 0, sorted by spend descending
- Make More: getCampaignBreakdown() top 5 by CPTD where TD >= 3
- Section-level dropdown menu (... button): Mark all done, Dismiss all, Snooze all 7d, Reset
- Per-card: thumbnail from tagger data, campaign name (40 char), spend/QLs/TDs
- Top offender gets red-50 background, rest neutral white
- Action states persisted to Supabase oracle_actions table
- Dismissed items hidden, snoozed hidden until date passes, done items greyed out

### Bug fixes
- Restored missing API_KEY declaration (dropped in Cloudflare migration)
- Fixed getTQL returning all QLs for "all geo" (was falling through to rows.length)
- Fixed ethnicity matching: case-insensitive includes('nri') instead of exact === 'NRI'
- Fixed localStorage quota exceeded: slim cache with metric-only fields
- Stale tagger numbers blocked: spinner shows until Section 2 data loads
- Old v1 cache keys purged on every boot

---

## Meta API Fix — GitHub Pages proxy routing (2026-03-30)

## Creative Review — New Landing View for Tagger (2026-03-30)

### New "Creative Review" tab — the default landing view for creative teams
- **Portfolio Snapshot**: Total spend, CTR, CPTD, and verdict counts (Working/Watch/Pause) at a glance
- **Scale These**: Top performers as cards with metrics vs market benchmarks (▲▼ vs avg), verdict reason, tags, and campaign
- **Pause or Refresh**: Underperformers shown the same way — clear "why" for each
- **What's Working — Tag Performance**: Cumulative bar charts per tag dimension (Hook, Format, Audience, Segment, Tone). Green = below avg CPTD, Red = above. Shows ad count, TD count, CTR per tag.
- **Recommended Next — What to Build**: Auto-generated DO MORE / AVOID lists by comparing tag patterns in winners vs losers. "Parent testimonial appears in 8 winners" → make more.
- **Data Table** (previous Creatives tab) is now a sub-tab for drill-down, not the landing view.
- **WHO THIS SERVES:** Graphic designer (what format works), video editor (what hooks convert), copy writer (what messaging wins), content head (overall direction), performance team (what to scale/pause), HOD (are we building the right assets).
- **RULE:** The landing view answers "what should I make next" in 10 seconds. Data tables are drill-down, not the front page.

---

## Sprint 1: Creative Team UX Overhaul (2026-03-30)

### Tagger table redesigned for creative team workflow
- **Campaign → Ad Set → Ad hierarchy**: Toggle between Campaign, Ad Set, and flat Ad views. Click any campaign/adset row to expand and see which of its ads are working. Answers "which of these 5 ads in this adset performed?"
- **New columns**: CTR, CPC, Click→QL% replace QL→TD and Audience columns. These are the metrics creative teams actually use for optimization.
- **Per-creative verdict**: Every ad gets a verdict badge — Scale (green), Working (green), Watch (amber), Fatigued (amber), Pause (red), New (gray) — with hover tooltip explaining WHY. Uses market-specific SENTINEL_THRESHOLDS.
- **Verdict summary bar**: Shows counts at top — "12 Working, 5 Watch, 3 Pause" — so you know the portfolio health at a glance.
- **Dropdown filters**: Campaign Type (NRI/Influencer/Vernacular/Retargeting/Broad), Format (Video/Static), Verdict, Tag category, Sort — all as compact dropdowns. Reduces clicks from 5 to 1.
- **New sort options**: Best CTR, Best CPC, Best Click→QL% added alongside existing CPTD/CPQL sorts.
- **RULE:** Creative team metrics are CTR, CPC, Click→QL%, CPTD. ROAS and CAC are finance metrics — keep them in Performance tab, not Tagger.
- **RULE:** Every creative must answer "is this working?" in 3 seconds. Verdict badge + reason tooltip does this.

---

### Fix: CRM QL never written to tagger — dead code in mergeCRMWithMeta()
- **Root cause:** Line `if (ql > effectiveQL) c['QL'] = ql` was dead code. `effectiveQL = Math.max(metaQL, ql)` means `ql > max(metaQL, ql)` is always false. CRM QLs were computed but never written to direct-matched creatives. TDs were written (inside `hasSheetData` block), producing 208 ads with TD > 0 but QL = 0.
- **Fix:** Changed to `if (ql > metaQL) c['QL'] = ql` — compares CRM ql against Meta's reported ql only. Since Meta reports 0 for most ads, CRM ql (which is correct) now always writes through.
- **RULE:** Never compare a computed value against a max that includes itself. `x > max(a, x)` is always false.

### Fix: Meta API calls failing on GitHub Pages (404 on /api/proxy-meta)
- **Root cause:** `_IS_DEPLOYED` checked `hostname.includes('cuemath')` — true for `cuemath-growth.github.io`. When true, ALL Meta API calls routed through `/api/proxy-meta`, a Netlify serverless function that doesn't exist on GitHub Pages → 404.
- **Fix:** Split into `_IS_NETLIFY` (proxy available) and `_IS_DEPLOYED` (any hosted env). All proxy routing (`callMetaAPI`, `callClaudeAPI`, `connectMetaApi`, UI badges) now gates on `_IS_NETLIFY`. On GitHub Pages, Meta API calls go direct with user's token from localStorage.
- **Also fixed:** Toast messages no longer say "deploy to Netlify" — they say "enter token in Settings."
- **RULE:** Proxy-dependent code must check `_IS_NETLIFY`, not `_IS_DEPLOYED`. GitHub Pages is a static host — no server-side functions.

---

## Spend Inflation Fix — Supabase Clear (2026-03-30, ~2:30am)

### Fix: QL→TD 100% across all ads — removed QL=TD floor
- **Root cause:** `ensureDerivedMetrics()` line 2012 and `mergeCRMWithMeta()` line 3722 both had `if (td > 0 && ql < td) ql = td`. This floored QL to TD whenever CRM Trial Dones exceeded Meta's reported leads. Since CRM catches leads that Meta attribution misses (especially for India/MEA small-volume ads), this fired on most ads → every ad showed 100% QL→TD.
- **Fix:** Removed both floor statements. Meta QL and CRM TD are independent sources — CRM TDs don't imply Meta should have reported a lead. QL_TD_PCT display already caps at 100%.
- **RULE:** NEVER force equality between Meta-sourced and CRM-sourced metrics. They have different attribution windows, matching, and coverage. Let the real numbers show.

### Supabase no longer overrides fresh Meta API pull data
- **Root cause:** On boot, Supabase (12K+ corrupted rows) > localStorage (1152 clean rows) → Supabase REPLACED clean data with corrupted data every single boot. `sbData.length > _localTaggerCount` condition always true.
- **Fix:** Added `_localHasFreshPull` guard: if localStorage has rows with `_source === 'meta_api'`, Supabase load is skipped and clean data is synced UP to Supabase instead. Added `_source` to `TAGGER_KEEP_FIELDS` so it survives compression.
- **RULE:** Fresh Meta API pull data in localStorage ALWAYS wins over Supabase. Supabase is a backup, not the authority. Never let row count alone determine which data source to trust.

### Reset Tagger Data now clears Supabase too
- **Root cause:** Corrupted tagger data (103x spend inflation from old SUM-based dedup + accumulation across pulls) was persisted in BOTH localStorage AND Supabase. Reset button only cleared localStorage — on next boot, inflated data rehydrated from Supabase.
- **Fix:** Added `supabaseDeleteAll()` helper. Reset button now clears `tagged_creatives` table in Supabase alongside localStorage. Tags preserved in separate `tag_cache` table.
- **RULE:** Any data reset that clears localStorage MUST also clear the corresponding Supabase table — they are mirrors, not independent stores.

---

## 7-Bug Fix Session (2026-03-29, ~10:00am)

### Bug 1: Duplicate KPI cards on Dashboard
- **Root cause:** `renderMetricTicker()` called from BOTH `onDashboardFilterChange()` AND `renderOracleModules()` — double render to same container
- **Fix:** Removed redundant call from `renderOracleModules()` (line ~5909)
- **RULE:** `renderMetricTicker()` is ONLY called from `onDashboardFilterChange()` and `fullRefresh()` — never from sub-render functions

### Bug 2: WoW (Week-over-Week) confusing layout
- **Root cause:** Tiny "vs X" text at bottom, no clear week labels, no verdict
- **Fix:** Added THIS WEEK / LAST WEEK date range headers (e.g. "Mar 23 – Mar 29"), verdict banner ("stable or improving" / "CPTD up X%"), each card now has bordered "Last week: value" row
- **RULE:** WoW section MUST lead with verdict banner and show explicit date ranges for both weeks

### Bug 3: Tagger page loads with no spinner
- **Root cause:** `showTaggerResults()` runs heavy computation synchronously — UI freezes with no feedback
- **Fix:** Added loading overlay with spinner + `requestAnimationFrame()` defer so spinner paints before compute starts
- **RULE:** Any view switch that triggers heavy compute MUST show loading state first

### Bug 4: QL→TD% showing 100% on low-volume ads
- **Root cause:** Ads with 1 QL + 1 TD show 100% in bold green — technically correct but misleading
- **Fix:** QL < 3 now shows greyed percentage with asterisk and tooltip "Low volume — not reliable"
- **RULE:** QL→TD% display MUST grey out and annotate when QL < 3

### Bug 5: Tag edit button using raw JSON prompt
- **Root cause:** `editTags()` used `prompt()` with raw JSON — one misplaced character breaks tags silently
- **Fix:** Replaced with proper modal dialog with dropdown selects per tag category, save/cancel buttons
- **RULE:** User-facing edit UIs MUST use structured inputs, never raw JSON/text prompts

### Bug 6: Sentinel narrative "60% vs 0%" — self-referential CPTD
- **Root cause:** `allTimeCPTD = currentCPTD` (line ~12007) — comparing a number to itself. "CPTD is ₹40K — in line with all-time average of ₹40K" is meaningless
- **Fix:** `allTimeCPTD` now computed from ALL unfiltered+sanitized tagger data. Direction shows actual % change with 5% tolerance band. Colors: red if up >5%, green if down >5%, neutral otherwise
- **RULE:** `allTimeCPTD` MUST be computed from `sanitizeTaggerData(state.taggerData)` (unfiltered), NEVER from the same filtered dataset as currentCPTD

### Bug 7: Thumbnail display gaps
- **Root cause:** Missing thumbnails showed empty space; broken images silently disappeared (`onerror="this.style.display='none'"`)
- **Fix:** Missing thumbnails show dashed placeholder "?" icon; broken images show image-icon fallback instead of disappearing
- **RULE:** Thumbnail cells MUST always show something — never empty space

---

## Major Data + Intelligence Overhaul (2026-03-29, 7:00am–8:45am)

### Root cause: sanitizeTaggerData() not applied to 4 of 8 data access paths. Multiple pages running on dirty data with false CRM matches.

### Data Layer: Global Sanitizer (THE fix)
- **Created `sanitizeTaggerData()`** — single function, zeroes TDs when: CPTD < market floor (US/AUS/UK: ₹5K, India: ₹1.5K, MEA: ₹3K), OR TD > QL on low-QL creatives, OR ghost rows (spend < ₹100)
- **Applied in ALL 8 data access paths**: getDashboardFilteredData, getGlobalFilteredTaggerData, getFilteredTaggerData, getInfluencerAds, renderInfluCompare, matchLibraryToLens, _runSentinelViewInner, WoW trends
- **Deleted duplicate sanitizer** from renderInfluLeaderboard (had 50% lower thresholds: US ₹1.5K vs global ₹5K)
- **Fixed Dashboard "Make More"** — was using raw state.taggerData, now uses filtered+sanitized `data` variable

### Architecture: DOM Race Condition
- **Refactored `getCRMPortfolioTotals()`** to accept `dateOverride` param
- **Eliminated 3 DOM mutation sites** where code temporarily changed date inputs to read prior-period CRM data
- Prior-period CRM now reads via `getCRMPortfolioTotals(geo, {from, to})` — no DOM mutation

### CRM Merge Fix
- **CRM QL floor**: `mergeCRMWithMeta()` now floors CRM QL to TD (trial done implies qualified lead)
- **Removed false-rejection**: sanity check `effectiveQL === 0 && td > 2` was killing valid CRM matches
- **India NRI/Non-NRI remap**: `backfillUnknownTags()` remaps India market NRI/Non-NRI → language-based or "All Audiences"

### Performance Page
- **KPIs cut from 12→6**: Spend, CPTQL, CPTD, QL→TD%, ROAS, CAC. Killed noise cards (CTR, Click→QL%, QL→TS%, T2P%, TQL raw count)
- **Verdict banner**: "2 metrics in alert — review budget burners" / "All healthy — scale winners"
- **Format filter honesty**: when format active, uses tagger funnel (not CRM) to avoid mixed-source CPTD
- **Format filter sync**: bidirectional — table always reads from header
- **Creative Fatigue + Audience Saturation** added to "What Changed" narrative
- **Geo filter unhidden** (was display:none)
- **WoW trends re-enabled** with sanitized data + rounded TQLs
- **Top 5/Bottom 5**: now show tag context (hook + benefit per ad)

### Tagger Page
- **Geo filter unhidden**
- **"What Separates Winners from Losers"**: contrast pairs with example ads (was showing identical frequency lists)
- **Tag pairs → "Winning Combos" / "Money Pits"**: with example ads, 5-ad minimum
- **Tag pills limited to 4** with +N overflow (was cramming 10+ into one cell)
- **Deep Dive matrix**: 5-ad minimum per cell, "Other"/"Unknown" filtered out, explanation text

### Creators Page
- **Geo filter unhidden**
- **"What Makes Winners Different"**: creative-only tags (hook, tone, angle), excludes language/format/audience
- **Scale/Watch/Drop cards**: actionable verdicts ("Best: Priyanshul-2 — increase budget")
- **Leaderboard verdict**: one-line summary above table
- **Content Analysis**: Script Playbook + per-creator best/worst ad

### Dashboard
- **Market Health: all 6 geos** (was showing only US, India, APAC, MEA — hiding AUS/UK)
- **Market Health: action per geo** ("Scale / Optimize / Investigate")
- **Action Log nav badge**: purple count on sidebar
- **document.title**: updates on every navigation

### Library
- **matchLibraryToLens sanitized**: Deploy Queue now uses clean CPTD data
- **Grid thumbnails**: object-contain instead of object-cover (no more blur)

### Utility
- **shortAdName() rewritten**: strips dates, noise tokens, geo prefixes, age ranges
- **Creative Health**: placeholder for missing thumbnails

### RULES (updated)
- `sanitizeTaggerData()` MUST be called in every function that reads `state.taggerData` for display or analysis
- `getCRMPortfolioTotals()` MUST use `dateOverride` param for non-current dates — NEVER mutate DOM inputs
- Performance KPIs MUST show tagger-derived funnel when format filter active — NEVER mix filtered spend with unfiltered CRM
- Market Health MUST show all 6 geos — NEVER hardcode a subset
- Every verdict/action card MUST include a specific action ("scale X", "pause Y", "shift budget from A to B")

---

## Cross-Tab Data Consistency Fix (2026-03-29, ~6:15am)

### Root cause: TD sanitization and date filtering applied inconsistently across tabs

**Problem:** Same creative showed different TD/CPTD on Tagger vs Library vs Performance. Verdict thresholds were hardcoded instead of using SENTINEL_THRESHOLDS.

### Fix 1: Tagger verdict uses SENTINEL_THRESHOLDS
- Was: hardcoded 50K/80K for CPTD, 15K/25K for CPQL
- Now: `scoreMetric(cptd_val, SENTINEL_THRESHOLDS[market].cptd, false)` — matches Performance tab exactly

### Fix 2: Library applies TD sanitization + date filtering
- `matchLibraryToLens()` now runs `filterByGlobalDate()` on tagger data before matching
- Applies same TD sanitization logic (CPTD floor check, TD>QL check) as `getFilteredTaggerData()`
- Library numbers now match Tagger table for same creative

### Fix 3: Performance applies TD sanitization
- `getGlobalFilteredTaggerData()` now applies same TD sanitization as `getFilteredTaggerData()`
- Performance drill-down numbers now match Tagger table

### Fix 4: Undated row handling aligned
- `getFilteredTaggerData()` inline date filter was INCLUDING undated rows
- `filterByGlobalDate()` was EXCLUDING them
- Now both EXCLUDE undated rows when date range is set
- All tabs behave identically when "This Month" / "Last 30d" is selected

### Fix 5: Audience recommendation cached
- `recommendAudienceForCreative()` was O(2200 * 233) = 500K+ iterations
- Now cached by `(hookType, format)` key — runs once per unique combo

### RULES
- TD sanitization MUST be applied in ALL data access functions: `getFilteredTaggerData`, `getGlobalFilteredTaggerData`, `matchLibraryToLens`
- Verdict thresholds MUST come from `SENTINEL_THRESHOLDS[market]` — NEVER hardcode
- Date filtering MUST exclude undated rows when a date range is set — ALL tabs, no exceptions
- Same creative MUST show same TD/CPTD/QL→TD% on every tab it appears

---

## Critical Overhaul: Tagger + Library (2026-03-29, ~6:00am)

### Tagger Table: Now answers "which creative on which audience"
- **Added Audience column** — extracted from campaign name via `extractAudience()`. Shows NRI/Expats/Interests/Lookalike/Broad/etc. as colored pills.
- **Added QL and TD count columns** — raw numbers visible, not just cost-per metrics. Removed CPTQL column (was showing "—" everywhere because TQL=0 without CRM).
- **Added QL→TD% column** — conversion rate per creative, green if >5%.
- **Added row verdict** — green/amber/red left border based on CPTD (if ≥3 TDs) or CPQL (if ≥5 QLs). Gray if insufficient data.
- **Removed CPTQL** — was broken (0 TQL from missing CRM data). Replaced with actual QL count + TD count which are always available from Meta API.
- **Compacted layout** — smaller text (11px/10px), tighter padding, more columns fit without scroll.

### Library Cards: Now recommend targeting
- **Fixed "0 TQLs" mislabel** — was displaying `lm.ql` (raw QL) but labeling it "TQLs". Now shows "X QLs" (correct label).
- **Added TQL aggregation** — `matchLibraryToLens()` now aggregates TQL from matched tagger rows.
- **Added QL→TD% on cards** — conversion rate visible on every card with performance data.
- **Added "Best on: [Audience]" badge** — for each library creative with Lens match, shows which audience it performed best on + CPTD. Also shows "Also ran:" for other tested audiences.
- **Added "Recommended: [Audience]" for new creatives** — cards WITHOUT performance data get a targeting recommendation based on similar creatives (matched by hook type + format). Shows expected CPTD and supporting data.
- **New helper: `recommendAudienceForCreative(hookType, format)`** — cross-references all tagger data by audience, returns the audience with lowest CPTD for matching creative profile.
- **Audience tracking in `_lensMatch`** — now stores `audiences` map, `bestAudience`, `bestAudCPTD` per library card.

### RULES
- Tagger table MUST show: Creative, Format, **Audience**, Spend, QL, TD, CPTD, QL→TD%, Tags, Edit
- Library cards MUST show actual QL count (not mislabeled as TQL)
- Library cards MUST show audience recommendation (from performance data OR from similar creative analysis)
- Every page must answer "which creative on which audience and why" — not just show data
- Row verdicts (green/amber/red) are mandatory on all data tables

---

## Bug Fixes: Header, QL→TD%, Sort, Date Presets (2026-03-29)

### Fix 1: Global header overflow
- Filter bar was overflowing horizontally. Reduced padding, compacted date inputs (width:110px), shortened preset labels (Mo/30d/90d/All), removed country filter icon, added `flex-wrap`.
- Active preset button now highlighted with purple background.

### Fix 2: QL→TD% was using wrong denominator
- Performance summary KPI and Dashboard ticker both computed QL→TD% using `crm.tql` (NRI-only for US) instead of `crm.ql` (all qualified leads).
- For US market this produced inflated percentages since TQL << QL but TDs come from all leads.
- Fixed both locations to use `crm.ql` as denominator.

### Fix 3: Sort dropdown ignored in Campaign/AdSet views
- Performance table Campaign view always sorted by spend desc regardless of sort dropdown selection.
- Same for AdSet view. Only Ad (flat) view respected the sort.
- Fixed: Campaign and AdSet groupings now sort by the selected criterion (Best CPQL, Best CPTD, Highest Spend, Most QLs).

### Fix 4: Date presets (This Month, Last 30d) not filtering
- `filterByGlobalDate()` included ALL rows without `_date` field, even when a date range was active. Since many tagger rows (from Meta Ads sheet) lack dates, every preset showed identical data.
- Fix: when a date range IS set, exclude undated rows. Only include them in "All Time" mode.
- CHANGELOG rule updated below.

### RULES
- QL→TD% denominator is ALWAYS `crm.ql` (all QLs), never `crm.tql`. Label and math must match.
- Sort dropdown must be respected in ALL view levels (Campaign, AdSet, Ad).
- `filterByGlobalDate()`: when date range is set, EXCLUDE undated rows. When All Time (no dates), include everything.
- Filter bar must use `flex-wrap` to prevent horizontal overflow.

---

## Page-by-Page Intelligence Overhaul (2026-03-29, ~5:00am)

### Plain English Tags (affects ALL pages)
- TAG_DISPLAY rewritten: "H-STAT" → "Surprising statistic", "PB-FOUND" → "Deep understanding", "F-INFLU" → "Influencer / UGC"
- Every tag pill, insight card, combo, heatmap now shows labels an intern can understand
- RULE: Tag labels must describe what the creative DOES, not its internal code

### Insights: Monday Playbook (added ~4:30am)
- Replaced "Key Insight: Best audience Other" data dump with 4-step actionable playbook
- 1. SCALE: best audience + hook + format with exact combo to replicate
- 2. KILL: worst audience with spend waste quantified
- 3. CREATIVE PATTERN: winning vs losing hook types with cost multiplier
- 4. BLIND SPOTS: audiences with spend but zero trials

### Creators: ROI Verdict
- Added tier classification: SCALE (green), WATCH (amber), DROP (red)
- Verdict summary card above table: "Scale these 5, drop these 10"
- Each table row gets colored left border + tier badge
- Fixed TQL display wrapping with Math.round()

### Performance: "What Changed" Narrative
- New `renderSentinelNarrative()` — shows CPTD vs average with direction
- Top 3 campaigns by spend with their CPTD
- 3 worst campaigns with "Pause" button (copies to clipboard)

### Dashboard: Action Log
- "Done ✓" button on every recommendation item (Pause/Make More/Deploy/Influencer)
- Completed actions move to Action Log with timestamp
- Counter shows "X of Y actions taken"
- Persisted in localStorage

### Create: Recommended Briefs
- `computeRecommendedBriefs()` finds top 3 audience+hook combos by CPTD
- Shows cards in output panel: "NRI + Testimonial → ₹20K CPTD (12 ads) — Generate This"
- One click pre-fills brief form and triggers generation
- Only shows when no content generated yet

### RULES
- Every insight must be in plain English an intern understands
- Every page must answer "what should I do?" not just "here's data"
- Every table must have a verdict (green/amber/red)
- Every recommendation must have a "Done" action button
- Create page must never cold-start — show data-driven briefs

---

## Godmode: Full CMO-Ready Overhaul (2026-03-29, ~4:30am)

### Dashboard P0 Fixes
- **CPTD hero card restored** — now largest card, first position, with threshold coloring
- **Recommendation cards populated** — Pause Now, Make More, Deploy These, Influencer Scaling, Market Health all render real data. Fixed variable scope crash in fatigued loop, added oracleMarketHealthList to cleanup.
- **TD float display fixed** — All TD counts wrapped in Math.round() in CMO Decisions section
- **Budget Reallocation US-protected** — US and India never suggested for budget cuts. Shows "Optimize within" guidance instead.

### P1 Fixes
- **Header overlap eliminated** — Page titles now render in global filter bar via `filterBarTitle` span. In-page header blocks removed/hidden.
- **Synced badge** — Added shrink-0 to prevent overlap
- **Date filter fix** — `filterByGlobalDate()` now includes rows WITHOUT `_date` field instead of dropping them. This was hiding 95% of creatives.
- **Page naming** — Performance (was "Sentinel"), Creators (was "Influencer Performance")

### Intelligence Overhaul
- **Monday Playbook** replaces "Key Insight" on Insights page. Four numbered sections:
  1. **Scale** — best audience + hook + format combo with specific action
  2. **Kill** — worst audience with spend waste quantified
  3. **Creative pattern** — winning vs losing hooks with cost multiplier
  4. **Blind spots** — audiences with spend but zero trials

### RULES
- CPTD must ALWAYS be the first and largest card on Dashboard
- Recommendation cards must NEVER show placeholder text — show diagnostic message if no data
- Budget Reallocation must NEVER suggest cutting US or India — these are protected markets
- `filterByGlobalDate()` must INCLUDE rows without `_date`, not exclude them
- Insights must lead with actionable playbook, not raw data

---

## CRITICAL: Boot crash fix — blank page on load (2026-03-29, ~4:15am)

### Root cause: JavaScript Temporal Dead Zone (TDZ) crash
- `rehydrateTagsFromCache()` was called at boot (line ~7549) but referenced:
  1. `_tagCacheData` (a `let` variable defined at line ~7637) — **TDZ crash**
  2. `TAG_MIGRATION` (a `const` defined at line ~7661) — **TDZ crash**
- Both are `let`/`const` declarations which are NOT hoisted past their declaration point
- This threw a `ReferenceError` that killed the entire `<script>` block — no navigation, no rendering, completely blank page

### Fix
- Moved `TAG_MIGRATION`, `_tagCacheLoaded`, `_tagCacheData`, `getTagCache()`, and `saveTagCache()` BEFORE the tagger boot sequence
- Removed duplicate declarations that were left at their original locations
- Verified boot order: TAG_CATEGORIES → TAG_MIGRATION → _tagCacheData → rehydrate call

### RULES
- **NEVER add `const`/`let` declarations that are referenced during boot AFTER the boot sequence.** `function` declarations are hoisted; `const`/`let` are NOT.
- Before adding any code to the boot sequence (~line 7497-7555), check that ALL referenced variables are already declared above.
- The boot sequence order is: dependencies → load localStorage → rehydrate tags → merge CRM → async Supabase

---

## Full Pre-Pull Audit + Fixes (2026-03-29, ~4:00am)

### Phase 1 Fixes (Data Pipeline)
- **UK geo mapping bug** in `getLibraryContext()` — UK was mapped to APAC. Fixed to UK.
- **CRM false match threshold** raised from ₹500 to ₹1,500 CPTD floor. Prevents unrealistic matches.
- **TQL computation**: Verified identical across all 5 locations. No fix needed.
- **Date filtering**: Verified correct. `_dateAutoSetDone` flag working. No fix needed.
- **Geo filtering**: All GEO_MAPs consistent. No fix needed.

### Phase 2 Fixes (Tagging System)
- **Claude response Array.isArray guard** — if Claude returns object instead of array, wraps it. Prevents silent tag loss.
- **TAG_CATEGORIES secondary fields** — verified `validateTags()` already strips `_secondary` suffix correctly. No fix needed.

### Phase 3 Fixes (Page Rendering)
- **Insights sort bug** — `a.tdCount` → `a.td` in `renderWinningByAudience()`. Audiences with TDs were not prioritized in sort.
- **Sentinel format filter sync** — `sentinelFormatFilterHeader` now syncs to `sentinelFormatFilter` in `runSentinelView()`. Prevents header filter change from being ignored in drill-down.
- **Library card thumbnails** — `matchLibraryToLens()` now includes `thumbnail_url` from best tagger match. Library grid renders thumbnail images when available.
- **Influencer empty state** — Added HTML empty state div with diagnostic message. Wired into `_renderInfluencerViewInner()`.

### Phase 4 Fixes (Visual Consistency)
- **Tagger + Insights headers** — Added w-9 h-9 icon + title + subtitle matching all other views.
- **Dashboard subtitle** — Added "What to do right now" under Dashboard header. Renamed "Oracle Dashboard" → "Dashboard".
- **Library subtitle** — Added "Your creative assets". Renamed "Content Library" → "Library".
- **Settings subtitle** — Added "Data sources & API keys".

### RULES
- Every view MUST have: header with w-9 h-9 icon + text-lg font-bold title + text-xs subtitle.
- Every data view MUST have: loading state + empty state with diagnostic message.
- Sentinel: header format filter must sync to table format filter via `runSentinelView()`.
- CRM false match threshold: CPTD < ₹1,500 = rejected. Never lower this.

---

## Tag Rehydration + Supabase Pagination + Layout Fix (2026-03-29, ~3:30am)

### CRITICAL: Tag data loss — root cause + fix
- **Root cause 1:** `loadTaggerFromSupabase()` and `loadTagCacheFromSupabase()` had NO row limit. Supabase REST API defaults to 1000 rows. With 2200+ creatives, only 1000 loaded.
- **Root cause 2:** Tag cache (which stores all tags) was only applied during `tagCreatives()` flow — never on boot. If tagger data loaded from Supabase with null tags, or was overwritten by tagless Meta sheet data, tags were permanently lost.
- **Root cause 3:** Three code paths (`refreshData`, `connectMetaApi`, `useDashboardData`) could overwrite tagged `state.taggerData` with raw Meta data (no tags) without checking the tag cache first.

### Fixes applied
1. **`rehydrateTagsFromCache()`** — New function that applies tag_cache to any rows missing tags. Called:
   - Immediately on boot (from localStorage tag cache)
   - After Supabase tag cache loads (catches entries not in localStorage)
   - After Supabase tagger data loads (if Supabase rows have null tags)
   - In `refreshData()` and `connectMetaApi()` fallback paths (prevents tag loss)
2. **Supabase pagination** — Both `loadTaggerFromSupabase()` and `loadTagCacheFromSupabase()` now paginate with limit=1000 + offset loop. Loads ALL rows regardless of count.
3. **Tagger table layout** — Removed `table-fixed` (was causing truncation). Gave Tags column 40% width with min-width:200px. Added min-widths to all columns for breathing room.
4. **Create view padding** — Added `p-6` and `rounded-2xl border` to match all other view containers.

### RULES
- NEVER assign `state.taggerData = rawData` without calling `rehydrateTagsFromCache()` immediately after. The tag cache is the source of truth for tags.
- All Supabase queries that could return >1000 rows MUST paginate with limit+offset.
- Every view container must have `view p-6` classes for consistent layout.

---

## CMO Cockpit Transformation (2026-03-29, ~3:45am)

### Oracle → Dashboard: Complete UX overhaul
- **TL;DR auto-summary**: 3-sentence narrative card at top. Status + top win + top risk + action. Pure template logic.
- **Hero CPTD + ROAS**: 2 large cards with border-left threshold color, 3xl font, vs-prior-period trend arrows.
- **Trend arrows on all KPIs**: Every card shows ↑↓ percentage vs same-length prior period. Green for good direction, red for bad.
- **Visual funnel**: Replaced 13-column table with horizontal flow QL→TQL→TS→TD→Enrolled. Conversion rates as colored connectors. NRI/Asian/Invalid behind expandable detail.
- **Unhidden Modules 1+2**: Top 5 Performers/Drains + Country Breakdown now visible. Was rendering to hidden divs.
- **CMO Decisions section**: Two new cards — "Why is CPTD where it is?" (audience breakdown) + "Budget Reallocation" (shift from red geos to green, with amounts).

### Navigation renamed to plain English
- Oracle → **Dashboard** (What to do right now)
- Lens: Intel → **Insights** (What's working & why) — moved to position 2
- Forge → **Create** (Generate copy & visuals) — moved to position 3
- Lens: Tag → **Tagger** (Tag & analyze creatives)
- Library → **Library** (unchanged)
- Sentinel → **Performance** (Funnel scoring & drill-down)
- Influencer → **Creators** (Influencer performance)
- Tab order now matches analysis-first workflow: Dashboard → Insights → Create → Tagger → Library → Performance → Creators

### RULES
- CPTD is ALWAYS the hero metric. Largest card, first position.
- Every KPI must show vs-prior-period trend. No flat numbers without direction.
- Tab names must be plain English. No mythology, no namespaces.
- The first thing a CMO sees must answer: "Are we on track?"

---

## Deep Audit Fixes — 6 Criticals + 3 Highs (2026-03-29, ~3:15am)

### C1: Sentinel CPQL was actually CPTQL
- "CPQL" card used spend/TQL — identical to the CPTQL card. Now uses spend/QL (crm.ql).
- **RULE:** CPQL = spend ÷ ALL QLs. CPTQL = spend ÷ TQLs. Never confuse denominators.

### C2: Influencer QL column vs CPQL denominator mismatch
- QL column showed raw Meta QLs but CPQL divided by TQL (NRI-only for US). Caused "0 QLs, ₹4.2K CPQL".
- Renamed column to "TQLs", display now shows `tql || ql`, matching the CPQL denominator.

### C3: AUS geo filter no longer includes all APAC spend
- Removed APAC fallback from AUS matching in getOracleMetrics. Only AUS-specific rows now.

### C4: oracleInfluScaleList → oracleInfluencerList
- Empty-state diagnostic message now reaches the actual Influencer section DOM element.

### C5: Brief generation crash guard
- `bestPB[0]` no longer crashes when bestPB is undefined. Null-guarded.

### C6: India TQL now matches 'IN' in all-geo path
- Both getOracleMetrics and getCRMPortfolioTotals "all" path now check `cb === 'India' || cb === 'IN'`.
- Also added `cb === 'MEA'` alongside `cb === 'ME'` for MEA consistency.

### H1: Dead WoW computation disabled
- 100 lines of week-over-week code rendered to non-existent oracleWoWContent element. Now `if (false)`.

### H2: refreshIcon null guard + bogus Gemini model removed
- refreshData() no longer crashes if refreshIcon element is missing.
- Removed 'nano-banana-pro-preview' from GEMINI_MODELS (was wasting 1 API call per image gen).

### H3: Layout — min-w-0 + overflow-x-auto
- Content column now has min-w-0 (prevents flex overflow from wide tables).
- Funnel table now wrapped in overflow-x-auto (prevents clipping on narrow screens).

---

## Layout + Blank Recommendations Fix (2026-03-29, ~2:45am)

### Fix 4: Content shifted right — white column on left side
- **Root cause:** All 7 view containers had `max-w-7xl mx-auto` which capped content at 1280px and centered it. On wider screens, this created visible white/gray padding on left and right.
- **Fix:** Removed `max-w-7xl mx-auto` from all views. Content now fills the full width after sidebar.
- **RULE:** Never use `max-w-7xl mx-auto` on view containers — the sidebar already constrains width. Content should fill available space.

### Fix 5: Blank recommendation boxes (Pause Now, Make More, Deploy, Influencer)
- **Root cause:** `renderOracleActions()` returned silently at line 4364 when `getDashboardFilteredData()` was empty, leaving original placeholder HTML ("e.g." text) untouched.
- **Fix:** When data is empty, now shows explicit diagnostic message — either "No creative data loaded" (tagger empty) or "No creatives match filters" (filtered to zero).
- **RULE:** Never silently return from a render function — always update the DOM with an appropriate empty/error state.

---

## Three Root Cause Fixes (2026-03-29, session recovery)

### Fix 1: Sentinel CPQL ₹46.1L → correct values (line ~10157)
- **Root cause:** `crm.tql || Math.round(s.total_tql)` fell back to tagger TQL when CRM returned 0. Tagger TQL is near-zero (no CRM ethnicity data), so CPQL = huge spend ÷ tiny TQL = lakhs.
- **Fix:** Removed all fallbacks to tagger-derived funnel metrics. If CRM isn't loaded, show 0/dash — never a misleading number.
- **RULE:** NEVER fall back from CRM funnel data to tagger funnel data. Tagger lacks CRM ethnicity/board data needed for TQL computation.

### Fix 2: Tag Combos "not enough data" despite 2292 creatives (line ~7932)
- **Root cause:** TD sanitization rule `(td > 0 && metaQL === 0)` zeroed TD on nearly ALL creatives. Most creatives have metaQL=0 (Meta pixel fires less than CRM lead creation) but valid CRM TDs via UTM matching.
- **Fix:** Removed the metaQL===0 sanitization rule. Kept CPTD floor check and low-QL inflation check.
- **RULE:** Do not assume metaQL=0 means the creative had no real leads. CRM UTM matching is the authoritative lead source, not Meta pixel.

### Fix 3: "All Time" date picker overwritten on every refresh (line ~3530)
- **Root cause:** `refreshData()` auto-filled empty date pickers with perf tracker date range on EVERY refresh cycle, not just first load. "All Time" clears pickers → next refresh stuffs dates back → single-day window.
- **Fix:** Added `state._dateAutoSetDone` flag. Auto-fill only fires once on first boot.
- **RULE:** Never overwrite user's date selection. Check `_dateAutoSetDone` flag before auto-setting dates.

---

## Production Polish for 20-Person Team Launch (2026-03-29, 12:30am–3:00am)

### Global Filter Bar
- Persistent bar at top of all data views: date pickers, presets (This Month/30d/90d/All Time), geo filter, freshness indicator
- Per-view geo/date filters hidden (display:none) — global bar is single source of truth
- Library added to syncGeoFilter system
- onGlobalFilterChange() re-renders active view on any filter change
- navigateTo('dashboard') now re-renders dashboard with current filters
- RULE: All date/geo filtering goes through the global bar. Never add per-view date/geo controls.

### Metric Glossary & Tooltips
- Floating "?" button (bottom-right) opens glossary modal with all metric definitions + benchmarks
- Oracle funnel table headers have title tooltips explaining each metric
- Glossary includes: QL, TQL (with per-geo rules), NRI, TS, TD, CPQL, CPTQL, CPTD (primary), CAC, ROAS, CTR, QL→TD%, T2P%
- Data sources section explains: Spend from Perf Tracker, Funnel from CRM, Creative from Tagger

### Thumbnail Fallbacks
- All `onerror="this.style.display='none'"` replaced with styled "No img" placeholder
- RULE: Never hide broken images. Always show a placeholder so user knows data is missing.

### Actionable Recommendations
- Pause Now cards: "Pause" span → "Copy & Pause" button with copyToClipboard
- Fatigued creatives: "Refresh" span → "Copy Name" button
- copyToClipboard() utility function added — used across Oracle, available for Sentinel/Influencer

### First-Time Onboarding
- 4-step welcome overlay for new users (Welcome → Oracle → Views → Help)
- Triggered on first visit (checks localStorage 'gf_onboarded')
- "Don't show again" checkbox persists preference
- Step dots + back/next navigation

### UI Consistency Polish
- Sidebar subtitle opacity: text-white/30 → text-white/50 (more readable)
- Export buttons added: Oracle (3-tab XLSX), Intel (3-tab), Influencer (2-tab)
- Loading states: Sentinel, Intel, Influencer, Library (standard bouncing dots)
- Refresh buttons: Intel, Influencer, Library
- Format filter: Influencer (Video/Static/All)
- UK added to Tag/Intel/Influencer geo filters (was missing from 3 views)
- All view headers standardized: w-9 h-9 rounded-lg + text-lg font-bold
- All cards: rounded-2xl border-gray-200/80
- Metric cards: text-xl font-black value, text-[10px] font-bold uppercase label

### Data Logic Fixes
- getOracleMetrics unified with getCRMPortfolioTotals: count rows (not sum), parseRevenue(), identical GEO_MAP
- AUS/ROW/MEA geo filters fixed in both functions
- renderMetricTicker: spend from Perf Tracker Daily, funnel from getCRMPortfolioTotals
- Meta API errors shown in UI; failed pulls don't count against rate limit

---

## Oracle Data Unification (2026-03-28, 6:30pm)

### Problem: getOracleMetrics and getCRMPortfolioTotals produced different numbers
- getOracleMetrics SUMMED values (qls column), getCRMPortfolioTotals COUNTED ROWS — diverge if any row has qls > 1
- Revenue: raw parse vs parseRevenue() with lakh/crore conversion — wildly different ROAS
- AUS geo filter searched for 'AUS' but CRM uses country_bucket='APAC' — showed 0
- ROW not in getCRMPortfolioTotals geoMap — showed 0
- Header summary used getOracleMetrics, KPI cards used getCRMPortfolioTotals — different TQL numbers
- renderMetricTicker fallback had undefined `data` variable (crash) and `totalCreatives` (crash)
- Three different TQL calculation paths across the codebase

### Fix: Unified both functions
- **getOracleMetrics** now counts rows (not sums), uses parseRevenue(), uses identical CRM_GEO_MAP
- **getCRMPortfolioTotals** refactored: single GEO_MAP (includes ROW, MEA→ME), shared geoMatch/dateIn helpers, no triplicated geo filter code
- Both GEO_MAPs are identical: `{ US, India, AUS, MEA (includes ME), UK, ROW, APAC }`
- renderMetricTicker fallback: `data` → `taggerData`, added `totalCreatives`, `taggerSpend` for self-contained fallback
- getOracleMetrics now returns `asian`, `invalid`, `ts` fields (matches getCRMPortfolioTotals)
- Empty return in getCRMPortfolioTotals includes all fields (prevents undefined access)

### RULES
- NEVER sum qls/trials_done/paid columns — always COUNT ROWS where value > 0
- NEVER use raw parseFloat for revenue — always use parseRevenue() which handles lakh/crore
- All CRM geo filtering must use the shared GEO_MAP pattern with .includes() matching
- getOracleMetrics = spend from Perf Tracker Daily + funnel from CRM (row-counted)
- getCRMPortfolioTotals = funnel from CRM only (row-counted, reads dates from DOM)

---

## Date extraction for tagger data (2026-03-28, 5:50pm)

### Problem: Oracle Spend/CPTD/CPTQL/ROAS showed "—" when date range was set
- Root cause: tagger data from Google Sheets had no `_date` field — only Meta API pulls set it
- `filterByGlobalDate()` dropped all rows without `_date`, so 0 ads matched any date range
- CRM data had dates (lead_created_date, trial_done_date) so TQLs/TDs/Enrolled still showed

### Root cause deeper: tagger data = one row per ad with lifetime spend, no monthly breakdown
- `extractDateFromAdName()` added (parses `_DDMMYY` suffix → `YYYY-MM-DD`) but this is the LAUNCH date, not spend date
- An ad launched in Aug 2025 still has spend in Mar 2026 — can't date-filter tagger rows meaningfully

### Real fix: `renderMetricTicker()` now uses `getOracleMetrics()` for KPI cards
- `getOracleMetrics()` already used Perf Tracker Daily (15K+ daily rows with date/geo/spend) for date-filtered spend
- `renderMetricTicker()` was the ONLY place still using `getGlobalFilteredTaggerData()` for spend
- Now KPI cards: spend from Perf Tracker Daily, funnel from CRM — both properly date-filtered
- Funnel breakdown table still uses `getCRMPortfolioTotals()` for extra fields (asian, invalid)
- RULE: Never use tagger data for date-filtered spend. Use Perf Tracker Daily via `getOracleMetrics()`

---

## Data Bug: NRI Over-Count (2026-03-28, 3:45pm)

### "Non NRI" leads counted as NRI — inflated NRI by 651 (Jan-Feb 2026)
- Root cause: `eth.includes('nri')` matched "Non NRI" (651 leads) alongside actual "NRI" (1599) and "NRI / Non Native English Speaker" (1172)
- Fix: all 6 NRI detection points now use `eth.includes('nri') && !eth.startsWith('non')`
- Lines fixed: 3172, 3227, 3603, 3690, 7608, 7620
- First fix: `includes('nri') && !startsWith('non')` → dropped from 3422 to 2771
- But 2771 still 2x Pulse (882). "NRI / Non Native English Speaker" (734 in Feb) was being counted as NRI but Pulse does NOT count it.
- Final fix: strict `=== 'nri'` match only. NRI now: 814 for Feb (Pulse: 882, diff ~68 — acceptable)
- RULE: NRI detection must be STRICT EQUALITY: `eth === 'nri'`. Never use `.includes('nri')`.

### WoW section removed from Oracle
- Raw float leaks (1150.812..., 130.418...), CPTD 10x off (₹2.0L vs ₹38.5K), "vs ₹0" everywhere
- HTML removed, JS left as dead code (wowEl check returns false)
- RULE: Do not re-add WoW until data pipeline is verified end-to-end

### Spend discrepancy: Oracle ₹2.6Cr vs Cost Tab ₹4.84Cr (KNOWN, NOT FIXED)
- Oracle spend = tagger data (Meta API pull) — only ads imported into Godfather
- Cost tab spend = ALL Meta spend across all accounts/campaigns
- Gap: ~₹2.2Cr of spend from campaigns not pulled into tagger
- This is by design (tagger = creative-level analysis) but Oracle KPI cards should note this

---

## Layout & Loading Fixes (2026-03-28, 4:30am–5:00am)

### Table white columns — ALL views (15 tables total)
- Root cause: tables used `w-full` without `table-fixed`, first column (Creator/Creative/Tag) expanded to fill remaining space
- Fix: `table-fixed` + explicit `style="width:X%"` on first column of every table
- Views: Lens:Tag, Sentinel (top5, bottom5, full), Oracle (top5, drains), Lens:Intel (heatmap, formula, declining, audience), Influencer (leaderboard, ad sets, content analysis x2, cross-ref, by-market)

### Forge brief panel too narrow
- Was: `w-[320px]` — created narrow white left column
- Now: `w-1/2` — even 50/50 split between brief and output panels

### Main background bleed
- `<main>` had no background, showed white in some browsers
- Fix: added `bg-[#F8F9FC]` to match body background

### Empty states flashed white on load
- `dashboardEmpty`, `ciEmpty`, `sentinelEmpty`, `libraryEmpty` were visible by default
- Fix: all start `hidden`, shown only when JS determines no data exists
- Dashboard: added else branch to show empty state when no tagger/meta data

### Library loading states
- `libraryLoading` div added (spinner visible by default, hidden when renderLibrary runs)
- `fetchLibrarySheet` inline spinner given `min-height:60vh` to fill viewport
- On every navigate-to-library: loading shown, grid cleared, empty hidden — prevents white flash on revisit

### Sidebar Meta Ads indicator overflow
- Was hanging below sidebar on short viewports
- Fix: nav gets `overflow-y-auto overflow-x-hidden`, logo margin `mb-8`→`mb-5`, status gap `mt-4`→`mt-2`

### REVERTED: body overflow-hidden (BROKE SCROLLING — AGAIN)
- Changed body to `h-screen overflow-hidden` — killed scrolling on all views
- **This was already attempted and reverted earlier in the same night (see "Layout reverted to original" entry above)**
- RULE: NEVER change body from `min-h-screen`. NEVER add overflow-hidden to body.

### Scroll + Sticky Sidebar fix (SOLVED — 5:15am)
- Root cause: outer container had `overflow-hidden` which clipped ALL scroll. Content wrapper hacks (min-h-0, overflow-y-auto, height:0) all failed.
- Fix: TWO changes required together:
  1. Outer div: `flex h-screen overflow-y-auto` (NOT overflow-hidden)
  2. Nav: `sticky top-0 h-screen` (stays pinned while content scrolls)
- Content wrapper: plain `flex-1 flex flex-col` (no overflow or min-h tricks)
- RULE: NEVER change outer div back to `overflow-hidden`. NEVER remove `sticky top-0 h-screen` from nav. These two work together.

---

## Layout & UI Fixes (2026-03-28, 3:30am–4:00am)

### Supabase "Synced" badge was visible on all tabs (BUG)
- `updateSyncBadge()` overwrote `style.cssText` which removed `display:none`
- Badge appeared on every tab after first Supabase sync, never hidden again
- Fix: function now only logs to console, never modifies DOM
- Per CHANGELOG rule from March 27: "Supabase sync badge hidden by default"

### Header subtitles shortened
- Long subtitles caused header wrapping on narrow screens
- "Creative library synced from GSheet — auto-refreshes every 10 min" → "Your creative assets"
- All subtitles now 3-4 words max

### Layout reverted to original
- Sidebar: back to flex child with `shrink-0` (not fixed position)
- Parent: `flex h-screen overflow-hidden` (original)
- Header: original `py-3.5`, `text-lg` title, `text-xs` subtitle
- Attempted fixes (fixed sidebar, ml-220, truncate, compact header) all reverted — they broke scroll and visibility across tabs

---

## Data Logic Fixes (2026-03-28, 3:00am–3:30am)

### TQL board filter — India/MEA were WRONG
- Old: US = NRI, all others = all QLs
- New: US = NRI, India = IB+IGCSE only, MEA = IB+IGCSE+Cambridge+British+US boards, APAC/UK = all QLs
- Shared function `computeTQL(ql, nri, market, board)` used by all tabs
- India TQL drops from 154 to 11 (93% reduction — only 7% of India leads qualify)
- MEA TQL drops from 1557 to 617 (60% reduction)
- Board values: `INDIA_TQL_BOARDS` = IB, IGCSE. `MEA_TQL_BOARDS` = IB, IGCSE, CAMBRIDGE, USCS, US Curriculum, International Baccalaureate (IB), British/UK Curriculum, British curriculum, UKNC

### LENS_MIN_CPTD now market-aware
- Was: flat ₹5,000 everywhere — zeroing out legitimate India TDs
- Now: US/AUS/UK ₹5,000, MEA ₹3,000, India ₹1,500
- `LENS_MIN_CPTD_BY_MARKET` constant, falls back to ₹5,000 for unknown markets

### Revenue multiplier fixed
- `parseRevenue()` helper: net_booking (crores) × 10M, Revenue (lakhs) × 100K
- Verified against US_MTD: 16 enrolled, ₹12.1L revenue, ₹75.8K ABV, 0.62 ROAS

### Oracle WoW migrated to tagger data
- Was: `getOracleMetrics()` (Perf Tracker + CRM — separate pipeline)
- Now: tagger data filtered by week ranges, uses `computeTQL` for proper scoring
- Same source as Sentinel/Lens — no more pipeline inconsistency

### Date range auto-populates on first load
- `getGlobalDateRange()` computes from tagger `_date` fields when Oracle picker is empty
- Sets Oracle date pickers so all tabs start with the same range
- Fixes Lens insight CPTDs being in lakhs (was computing all-time)

---

## Meta API Enrichment (2026-03-28, 3:15am)

### New fields from Meta API
- Frequency (creative fatigue signal), Reach (unique people)
- Video completion: P25, P50, P75, P100
- Ad creative text: body (primary text), title (headline), description, call_to_action_type
- All added to `TAGGER_KEEP_FIELDS` — survive compression

### Smart pull — no re-tagging
- Meta API pull now merges new fields into existing tagger data by ad name
- Case-insensitive matching (fixes zero-thumbnail bug)
- Only genuinely NEW ads trigger tagging — with user confirmation
- Existing 2237 ads get thumbnails + copy + frequency without spending Claude credits

### Tagger prompt includes real ad copy
- Claude now sees: Headline, Primary text, Description, CTA, Frequency
- Tags from actual content, not just ad name guessing

---

## Unified Data Architecture (2026-03-28, 2:30am)

### Two intentional layers
- Portfolio (Oracle KPIs): Spend from tagger, TD/TQL/Paid from CRM direct
- Creative (Sentinel/Lens/Influencer): All from tagger data with CRM merge
- Match rate badge: "CRM has X TDs, tagger matched Y (Z%)"

### Sentinel unified
- KPIs: tagger spend + CRM portfolio totals (not getOracleMetrics)
- Composite score: CPTQL (not CPQL) for 30% weight
- Top/Bottom 5: require 5 TQLs + 1 TD (was 5 QLs)
- Absurd values (CPTQL > ₹10L) shown as "—"
- Subtitle: date range + creative count (not "Perf Tracker + CRM")

### CRM dedup
- Leads deduplicated by `prospectid` before merge

### Diagnostics
- `runDiagnostics()` — console + visual health panel in Settings
- Checks: data sources, thumbnails, tags, metrics, influencer pipeline, cross-tab sync

---

## Influencer Tab — Roster-Based Rebuild (2026-03-28, 12:45am)

### Creator Roster as single source of truth
- New data source: `creatorRosterUrl` (gid=1892749954) — master sheet with ~87 creators, handles, statuses, ethnicity
- Fetched on load alongside organic influencer data, stored in `state._creatorRoster`
- Replaces hardcoded `KNOWN_CREATORS` list (was 19 names, missed ~70 real creators, had ~10 phantom names)

### getInfluencerAds() fully rewritten
- `_buildCreatorTokens()` extracts first name, full name (joined), and handle as matching tokens from roster
- `_matchCreatorFromAd()` matches tokens against ad name + campaign name (longest match first)
- No more regex fallback for capitalized words — only roster names match
- Ads grouped by creator with ad-set level breakdown (`cr.adSets` object)
- Returns `[]` if no roster loaded (graceful degradation)

### Leaderboard rebuilt with Creator → Ad Set expansion
- Click any creator row to expand and see ad-set level performance (audience breakdown)
- Shows: Ad Sets count, Market badge, Spend, QLs, CPQL, TDs, CPTD, QL→TD%
- "Creators Matched" KPI shows count + "X with TDs" subtext
- Removed manual Type dropdown (ethnicity now comes from roster sheet)

### Influencer vs In-House comparison fixed
- Winner logic: CPTD primary (requires min 3 TDs per side), CPQL fallback only when both lack TDs
- Key Insight now leads with CPTD difference, mentions CPQL divergence when winner differs
- Shows "Insufficient trial data" when either side has <3 TDs instead of misleading winner
- By Market table uses same CPTD-first logic

### Oracle Module 5 + Section 4 updated
- Oracle Section 4 (Influencer Scaling): uses roster-matched creators, shows proper display names from roster
- Oracle Module 5: Track B now uses `getInfluencerAds()` instead of format-tag filtering + regex name extraction
- Empty state messages reference creator roster sheet instead of Lens tagger

### renderTrackB + renderCrossRef updated
- Both functions now use roster-based `getInfluencerAds()` instead of ad name regex matching
- renderTrackB filters to India market via `getInfluencerAds('India')`
- renderCrossRef uses `paidCreators.flatMap(cr => cr.ads)` for paid ad list

---

## Pre-Deployment QA Pass (2026-03-28, 1:30am)

### Phase 1: Influencer pipeline fixes
- `_isInfluencerAd(c)` replaces `_isInfluencerCampaign()` as primary gate — now checks: (1) campaign name contains "influencer", (2) tagger format F-INFLU/F-CONTENT-UGC, (3) ad name contains "influencer"/"postboost"
- India campaigns now captured — they don't have "Influencer" in campaign name but DO have F-INFLU format tags
- Creator name extraction rewritten: finds LAST structural token (_Video_, _Signup_, _NA_), strips prefix words (Video_, Signup_ etc.) from extracted portion
- Fallback logic handles hyphen-delimited noise words properly

### Phase 2: Number discrepancy fixes
- CRM leads deduplicated by `prospectid` before merge — prevents double-counting TDs/NRI
- QL action type now logged: tracks which Meta API action type matched (lead, offsite_conversion, etc.)
- QL source distribution logged after each Meta API pull

### Phase 3: UI/UX fixes
- Influencer tab: proper empty state when no tagger data loaded (icon + "Go to Tagger" button)
- Forge: "Reset All Fields" button added below Generate button
- Sentinel drill-down table: sticky first column (Creative) with bg-white for scroll visibility

### Phase 4: Thumbnails
- Re-added thumbnail display in influencer leaderboard (uses bestAd's thumbnail_url)
- Sticky creator column has bg-white to prevent overlap transparency issues

---

## Influencer Matching — Campaign-Name Gate (2026-03-28, 1:15am)

### Fundamental approach change
- **OLD (BROKEN):** Match creator names from roster against ad names → 43 creators, ₹2.6Cr (5x actual)
- **NEW (CORRECT):** Campaign name must contain "Influencer"/"Influ" → then extract creator from ad name
- Cross-checked against ground truth sheets: US ₹20.6L (228 QL, 49 TD), India ₹33.6L (264 QL, 57 TD)

### _isInfluencerCampaign() — primary gate
- Returns true only if campaign name contains "influencer" or "influ" (case-insensitive)
- All confirmed influencer campaigns contain this keyword:
  - `USA_FB_Leads_Conv_Int_Influencer_Advantage_ShortForm_LP_Signup_*`
  - `USA_FB_Leads_Conv_Int_Influencer_Postboost_ShortForm_LP_Signup_*`
  - `USA_PFX_FB_Leads_Conv_Influencer_Engaged_LAL_Leadgen_*`

### _extractCreatorFromAdName() — creator name extraction
- Strips date suffix (6 digits at end: `_DDMMYY`)
- Finds creator portion after structural tokens (Video_, Signup_, NA_)
- Preserves compound names: "Gujarati_Payal_Jethwa", "Priyanshul-IG", "edited-video-Rituja"
- Returns "Unknown" if extraction fails (ad still counted as influencer, just ungrouped)

### Roster demoted to metadata enrichment only
- `_buildRosterLookup()` creates a name→metadata map from roster sheet
- `_enrichCreatorFromRoster()` matches extracted creator labels against roster for handle/ethnicity
- Roster NO LONGER gates which ads are influencer — campaign name does

### renderInfluCompare uses campaign-name gate directly
- Influ vs In-House split now uses `_isInfluencerCampaign(campName)` not ad-name matching
- Ensures every ad in an influencer campaign counts, even if creator extraction fails

---

## Influencer Matching — Critical Fixes (2026-03-28, 12:55am) [SUPERSEDED]

### False match prevention
- Name matching changed from substring to **exact segment match** — token must be a distinct hyphen/underscore-delimited segment in ad name, not a substring (prevents "ana" matching "analytics", "priya" matching "priyanshul")
- Short/ambiguous names (<=5 chars or in SHORT_AMBIGUOUS set) always require exact segment match
- Long unique names (7+ chars, not ambiguous) still allowed substring match

### Status filtering
- Only active/published creators included: Published, Approved for Posting, Script Finalized & Sent, Content Under Review, Revisions Needed, Script to be shared, Onboarded, Interested, In Discussion
- Explicitly excluded: Dropped, Expensive, Not Relevant, Not Interested, Not Responded, Not Replying
- Blank status → included (assume active if on roster)

### Handle cleanup
- `_cleanHandle()` extracts username from full Instagram URLs (`instagram.com/deepanu27?utm=...` → `deepanu27`)
- Applied at both roster fetch time and token display time

### Name collision handling
- Two-pass token builder: first counts name-part frequency, then skips first-name tokens when multiple creators share the same first name (e.g., 3 Shwetas → only match via full name "shwetanegi" or handle)
- Prevents one creator's token from stealing matches from another

### Multi-word name support
- All name parts (not just first name) added as tokens — "ARIGELA KEERTHI PRIYA" generates tokens for "arigela", "keerthi", "priya" (if unique)
- Handles creators where the ad name uses a middle name (e.g., "Keerthi" from "ARIGELA KEERTHI PRIYA")

---

## Guardrail C-11: Losing Signals Include Kill/Fix Recommendation (2026-03-27)

### Kill/Fix recommendation badges added to Creative Fatigue cards in Lens Intel
- Each fatigued creative in renderDecayTracker() now shows a recommendation badge after the CPQL line
- RED "KILL — No conversions, pause now" when creative has 0 TDs despite significant spend (>5K)
- RED "KILL — Pause immediately, reallocate budget" when CPQL >100% above avg AND spend >1L
- AMBER "FIX — Refresh visual (new layout/color), keep the hook" when CPQL 30-100% above avg
- Priority order: 0 TDs checked first, then severe CPQL, then moderate CPQL
- Added `td` field to decay tracker data mapping to support TD-based kill signal
- Matches Sentinel anomaly standard ("Pause immediately. Reallocate budget." pattern)

---

## Guardrail C-10: Winning Signals Include Actionable Brief (2026-03-27)

### Actionable brief summary added to audience cards
- After BEST HOOK / BEST FORMAT / AVOID cards, a structured brief now appears when both bestHook and bestFmt exist
- Brief text: "Create 3 [format] ads with [hook] hook targeting [audience]. Avoid [worst pattern]. Suggested format: 1:1 for Instagram, 9:16 for Stories."
- Styled as text-xs, bg-surface-secondary, rounded, padded with "Brief:" label

### AVOID section now includes recommendation text
- Every losing signal in the AVOID card shows either "Pause ads with this pattern" (when no TDs) or "Refresh visual, keep the hook" (when some TDs exist)
- Styled as text-[10px] text-orange-600 font-medium

---

## Influencer Tab Rebuild + Data Source Unification (2026-03-28, 12:30am)

### Costs Tracker removed as data source
- Costs Tracker tabs have manual date filters on the Google Sheet — numbers change depending on whoever last set the filter
- All tabs now use Perf Tracker Daily + CRM Leads exclusively via getOracleMetrics()
- Single source of truth: same geo + same date = same numbers everywhere

### Influencer Tab — Full Rebuild
- **Geo filter added** (id=influencerGeo) — synced with all other tabs via syncGeoFilter()
- **Date filter added** (id=influencerDateRange) — All Time, Last 7/14/30/60/90 days
- getInfluencerAds(geoFilter, dateRange) now accepts and applies both filters
- All 3 sub-tabs (Leaderboard, Content Analysis, Compare) receive pre-filtered data
- Leaderboard shows Track A (US Organic) / Track B (India Paid) labels per creator

### Oracle Influencer Scaling — Now respects country filter
- "Influencer Scaling" section on Oracle reads dashboardCountryFilter
- Scale Up / Consider Pausing lists filter creators by selected market

### Oracle Module 5 — Geo-aware
- Reads dashboardCountryFilter and filters paid influencer data by market
- Track A and Track B rendered separately with labels

---

## Critical Bug Fixes — Final Pass (2026-03-27, 11:15pm)

### QL→TD% capped at 100% everywhere
- CRM-matched TDs can exceed Meta QLs (data source mismatch), producing 3600% conversion rates
- Fixed in: runSentinelAnalysis (line 6355), per-creative QL_TD_PCT (line 1633), Lens Intel qlTd (line 8086), Influencer leaderboard (line 9935), Influencer comparison (lines 10141, 10150), Influencer board (line 10273)
- Math.min(td/ql*100, 100) applied universally

### Top 5 requires min 1 TD
- Previously showed creatives with 0 TDs as "top performers" (ranked on CPQL alone)
- Now: `r.metrics.td >= 1` required alongside `r.metrics.ql >= 5`
- Per D-07 guardrail: composite score is 40% CPTD — meaningless with 0 TDs

### Sentinel CPTQL column fixed — ignore pre-computed TQL from sheet
- Sheet's TQL column had raw fractional values (0.04, 1.36), not integers
- Sentinel now ALWAYS computes TQL from US=NRI, others=QL — never uses c['TQL'] from sheet
- Fixes: raw decimal display in CPTQL column of campaign/ad-set views

### Library gid corrected (FINAL)
- gid=0 is the VIDEO tab (91 rows with video-named content)
- gid=927168945 is the STATIC tab (51 rows)
- This is the OPPOSITE of what was initially assumed, confirmed by creative names in the sheet

### Lens Intel audience ranking — audiences with TDs ranked first
- Previously: best audience could have 0 TDs (ranked by CPTQL only)
- Now: audiences with TD > 0 always ranked above those with 0 TDs
- Within each group, still sorted by CPTD (or CPQL*3 fallback)

### Workflow hint removed
- Was bleeding into other views due to DOM positioning
- Removed entirely — too fragile and confusing

---

## UI/UX Overhaul (2026-03-27 late night)

### Nav Sidebar Subtitles
- Every nav item now has a descriptive subtitle: Oracle → "What to do right now", Forge → "Generate copy & visuals", etc.
- Wrapped in `<div>` with `text-[9px] text-white/30` — subtle, doesn't clutter

### Metric Tooltips (everywhere)
- Added `title` attributes to ALL metric labels: CPTD, CPTQL, CPQL, TQL, CTR, QL→TD%, T2P%, CAC, ROAS
- Applied to: Sentinel KPI cards (dynamic via METRIC_TOOLTIPS const), Sentinel table headers, Top 5/Bottom 5 headers, Tagger table headers, Intel dropdowns
- Hover over any abbreviation to see plain English definition

### Sticky Creative Name Column
- Added `.sticky-col` CSS: `position: sticky; left: 0; z-index: 1`
- Applied to first `<th>` in Sentinel main table and Tagger creatives table
- Creative name stays visible when scrolling horizontally through 12-column tables

### Oracle Section Badges
- Pause Now: red "ACTION REQUIRED" badge
- Make More: green "OPPORTUNITY" badge
- Deploy These: purple "READY" badge
- Section descriptions rewritten: "burning budget" → "high spend, zero trials", "winning patterns" → "best performing combos to scale"

### Oracle Empty State Examples
- Shows 3 example insight cards when no data connected
- Pause example (red), Scale example (green), Market insight (blue)
- Teaches users what Oracle will provide before they connect data

### Oracle Workflow Hint
- "Next: Deep dive in Sentinel / Generate new creatives in Forge" shown at bottom of Oracle when data loaded

### Forge Smart Defaults (prefillForgeFromIntel)
- On Forge tab load, auto-finds best CPTD combo from tagged creatives (hook + audience + format)
- Pre-fills Key Angle textarea with winning formula description
- Shows "Winning Formula Active" indicator with specific combo and CPTD
- Auto-selects matching ICP pill
- Requires min 10 tagged creatives and 3+ TDs on best combo

### Header Badge Simplified
- Supabase sync badge hidden by default (internal detail, not user-facing)
- Only main status badge visible: "Synced Xm ago" / "Data Xh old" / "No data"

### Table Label Fixes
- Sentinel main table: "Type" → "Format" (consistency)
- Sentinel main table: duplicate "CPTQL" → first is "CPQL", second is "CPTQL"
- Top 5/Bottom 5: data source labeled "(Meta API data)"

---

## End-to-End Audit Fixes (2026-03-27 evening)

### Fix 1: Library tab gids were SWAPPED (CRITICAL)
- Static tab gid `927168945` and Video tab gid `0` were reversed in `DEFAULT_SHEETS.libraryTabs`
- Every Video row got `_contentType: 'Static'` and vice versa — all Library cards showed wrong format
- Swapped to correct mapping: gid `0` → Static, gid `927168945` → Video
- Also fixed `libraryUrl` to point to gid=0 (default/Statics tab)

### Fix 2: WoW badge arrows showed good/bad direction, not actual direction
- Badge arrows now show actual metric direction: ↑ when value increased, ↓ when decreased
- Color still indicates good (green) vs bad (red) — e.g., CPTD ↓ = green, CPTD ↑ = red
- Fixed in both perf tracker WoW and tagger fallback WoW badge functions

### Fix 3: Stale data warning now checks sheet refresh time (not just Meta API)
- `checkStaleData()` now reads both `gf_metaLastPull` and `gf_sheetsLastRefresh` timestamps
- Warning threshold reduced from 48h to 24h — stale data is caught faster
- `refreshData()` now writes `gf_sheetsLastRefresh` timestamp on every successful sheet fetch

### Fix 4: "Last Synced" indicator added to header
- Status badge now shows "Synced 3m ago" / "Synced 2h ago" instead of just "Connected"
- Updates every 60 seconds via setInterval
- Turns amber if >2 hours since last sync — visual nudge to refresh

### Fix 5: Perf tracker data auto-merges into tagger on refresh
- New `mergePerfIntoTagger()` — attaches campaign-level spend/QL from perf tracker to tagger creatives
- Runs after every `refreshData()` call (including auto-refresh every 30 min)
- Flags creatives where perf tracker campaign spend differs >5% from tagger spend

### Fix 6: Tagger table header label "Type" → "Format"
- Standardized display label for creative format column across all tabs

### UI/UX Improvements

#### Heatmap readability
- Explanation text upgraded from `text-text-muted` (gray) to `text-text-secondary` (darker) in both static HTML and dynamic render
- Color legend now uses inline colored text: "green = cheaper than average", "red = more expensive"

#### Portfolio Metrics expanded by default (Lens: Tag + Intel)
- `lensAggContent` and `intelAggContent` no longer start with `hidden` class
- Arrow starts rotated (expanded state) — click to collapse
- Users see portfolio-level Spend/TQL/CPTD immediately without hunting

#### Better empty states
- Sentinel: "No data matching filters" → adds guidance to adjust geo/format/date or refresh data
- Intel: Empty state now explains what Intel does (what's working, creative health, deep dives) and gives step-by-step instructions
- Combos tab: Description now explains "Use More" and "Avoid" signal meanings

#### Library format breakdown
- Library header now shows format counts: "45 Static · 32 Video · 8 Testimonial" next to the total count

### Library ↔ Lens Cross-Reference (NEW)

#### matchLibraryToLens() — zero-cost enrichment
- New function token-matches Library creative names to tagger Ad names (50%+ overlap threshold)
- Aggregates metrics across all matching ads (same creative in multiple ad sets)
- Attaches `_lensMatch` to each Library card with: tags, spend, QL, TD, NRI, CPTQL, CPTD, ad count

#### Library cards now show Lens tags
- Hook type, benefit frame, emotional tone, audience, language from Lens tags
- Sheet-column tags take priority; Lens fills gaps
- Tag badges use same color scheme as Lens: Tag tab

#### Library cards now show performance metrics
- Spend, TQLs, TDs, CPTD displayed at bottom of card
- CPTD color-coded: green (<₹50K), amber (<₹1L), red (>₹1L)
- Ad count shown ("3 ads" = aggregated across ad sets)
- Cards without perf data render at 80% opacity

#### Library header enriched
- Shows "X with perf data" count alongside format breakdown
- Status label changes: "Lens matched" (green) when tags found, "Not analysed" (orange) when no match

### Sentinel Audit Fixes

#### KPI Fixes
- **QL→TQL% replaced with QL→NRI%** — old metric was always 100% for non-US geos (meaningless). New metric shows NRI penetration rate.
- **TQL count rounded** — was showing decimals (2,934.392 → 2,934)
- **CPTQL now scored** — was gray/unscored, now uses CPQL thresholds for color-coding (green/amber/red)

#### Missing Thresholds Added
- **UK thresholds**: CPQL <₹10K (green), CPTD <₹35K (green), QL→TD% >35% (green)
- **APAC thresholds**: CPQL <₹10K (green), CPTD <₹30K (green), QL→TD% >35% (green)
- Previously these geos fell back to US thresholds which were wrong

#### Top 5 / Bottom 5 Table Fixes
- Header label corrected: renders CPTQL (was mislabeled, data showed CPQL)
- **TD count column added** — users can now see raw trial count alongside CPTD
- CPTQL column now prefers `cptql` (TQL-based) over `cpql` (QL-based)

#### Date Filter Fix
- Rows without dates now **excluded** from date-filtered results (were incorrectly included, polluting filtered views)

#### Sentinel KPIs now use Oracle data pipeline (CRITICAL)
- Summary KPIs (Spend, TQL, CPTQL, CPTD, QL→TD%, T2P%, ROAS, CAC) now pull from costs tracker + perf tracker + CRM — same sources as Oracle
- Priority: Costs Tracker (audited) → Perf Tracker + CRM → Meta API (tagger) fallback
- Traffic metrics (CTR, Click→QL%) still from tagger (only source with impression/click data)
- Per-creative drill-down (Top 5, Bottom 5, campaign table) still uses tagger data (only source with ad names)
- Source label shown on Spend card and in subtitle ("KPIs: Costs Tracker (audited)")
- Numbers now match Oracle dashboard — no more 5x discrepancy between tabs

#### Geo filters now synced across all tabs
- New `syncGeoFilter()` function — changing geo on ANY tab updates all others
- Maps between naming differences: Oracle uses 'ROW', Lens/Sentinel use 'APAC'
- Called from: `onDashboardFilterChange`, `onTaggerCountryChange`, `onCICountryChange`, `runSentinelView`
- Prevents: Oracle set to US showing ₹45L while Sentinel still on "All" showing ₹1.14Cr

#### Costs Tracker skipped when date filter is active
- `getCostsTrackerMetrics()` has no date parameters — always returns full totals
- Now: when user sets a date range, Sentinel falls back to `getOracleMetrics()` (date-aware)
- Only uses Costs Tracker when no date filter (All Time view)

#### QL→TQL% replaced with QL→TS%
- QL→NRI% was showing >100% (CRM NRI count exceeding Meta QL count — data source mismatch)
- Replaced with QL→TS% (trial scheduling rate) — a real funnel step that's always 0-100%

#### TQL computation fixed for "All Markets"
- Was passing `geo='US'` to analysis for All Markets — all creatives got TQL=NRI regardless of actual market
- Now uses each creative's `_market` field: US creatives → TQL=NRI, all others → TQL=QL
- TQL capped at QL to prevent data source mismatches from producing impossible values

#### CSV Export Enhanced
- Exports composite score alongside individual CPQL/CPTD scores
- Users can now see the ranking formula in their exports

#### localStorage override fix for libraryTabs
- `state.sheetConfig` now pins `libraryTabs` to `DEFAULT_SHEETS.libraryTabs`
- Prevents stale localStorage from overriding code-level gid corrections

---

## Data Architecture Rebuild: Direct Creative Matching + Costs Tracker Anchor (2026-03-27)

### MAJOR: Direct Creative-Level CRM Matching (replaces proportional allocation)
- `mergeCRMWithMeta()` completely rewritten with 2-tier matching:
  1. **Ad-content match**: CRM `mx_utm_adcontent` tokens matched to tagger `Ad name` tokens (60% overlap threshold)
  2. **Campaign fallback**: only for leads that can't match at ad level — proportional allocation preserved as fallback
- Creatives now get EXACT integer TD counts from direct CRM matching (not fractional 0.02 estimates)
- `extractTokens()` normalizer: strips placement suffixes (_Instagram_Stories_ig), date suffixes (_DDMMYY), geo/noise prefixes
- Console logs match breakdown: "X direct ad matches, Y campaign fallbacks, Z unmatched"
- `_crmMatchType` field on each creative: 'ad_content', 'campaign', or 'unmatched'

### MAJOR: Costs Tracker as Portfolio Anchor
- New `getCostsTrackerMetrics(geoFilter)` function — reads audited costs tracker tabs directly
- Fills funnel gaps (NRI, TS, Revenue) from CRM RATIOS applied to costs tracker absolutes
- Oracle metric ticker: costs tracker first, perf tracker + CRM as fallback
- Market Health: always costs tracker (removed 3-tier fallback chain)
- Lens aggregate bar: costs tracker first, perf tracker + CRM fallback
- Source labels on every metric: "Costs Tracker (audited)", "Perf tracker + CRM (raw)", "Meta API"

### CRM Columns Now Used
- `mx_utm_adcontent` — creative-level matching (was ignored before)
- `ethnicity` — NRI ratio computation for TQL
- `trials_sch` — trial scheduled ratio
- `net_booking` / `Revenue` — revenue per paid ratio
- `country_bucket` + `region` — geo mapping with AUS/ROW disambiguation

---

## Data Accuracy & Lens Update (2026-03-27)

### Fix 1: TQL computation in getOracleMetrics
- `getOracleMetrics()` now returns `tql`, `cptql`, `tqlTd` fields alongside raw `ql`/`cpql`
- TQL definition: US = NRI count, other geos = total QL (matches costs tracker definition)
- Previously labeled "CPTQL" but computed spend/totalQL (CPQL) — now correctly computes spend/TQL

### Fix 2: CRM geo mapping (ROW/AUS overlap)
- CRM `country_bucket='APAC'` was matched by both ROW and AUS filters, causing double-counting
- Now uses `region` column to disambiguate: AUS requires region containing 'aus', ROW excludes AUS rows
- Perf tracker geo mapping unchanged (already uses separate `country_segment` and `region` fields)

### Fix 3: Metric ticker + WoW + Market Health labels
- Metric ticker: CPTQL card now uses `m.cptql` (spend/TQL) not `m.cpql` (spend/QL)
- WoW section: TQL count, CPTQL, TQL→TD% all use correct TQL-based values
- Market Health: status thresholds now based on CPTQL, shows TQL→TD%
- Data date range summary shows TQL count

### Fix 4: Lens aggregate metrics bar (NEW)
- Added aggregate metrics bar to both Lens: Tag and Lens: Intel tabs
- Shows Spend, TQLs, CPTQL, TDs, CPTD, Enrolled from Perf Tracker + CRM (source of truth)
- Respects geo filter (taggerFilterCountry for Tag, ciFilterCountry for Intel)
- Updates on geo filter change
- Creative-level data below still uses tagger data for relative comparison (proportional allocation)
- Purpose: accurate portfolio-level numbers alongside creative-level estimates

---

## Lens Tag Tab Polish (2026-03-26)

### CPQL -> CPTQL Display Labels
- All UI labels in Lens Tag tab changed from "CPQL" to "CPTQL": sort dropdown options, tagger table column header, heatmap column header, combos description text, grid badge text, CSV export header, insight card metric label fallback
- Variable names and data field names unchanged — only display-facing text

### CPTD Column: "<1 TD" -> em dash
- Tagger table CPTD column now shows em dash for fractional TDs (td > 0 but < 1) instead of "<1 TD"
- Matches the display when TD === 0 for consistency

### Tag Performance Insights: Human-Readable Comparisons
- "100% gap" labels replaced with "2.5x cheaper" (when ratio >= 2x) or "45% cheaper" (when < 2x)
- Bottom text changed from "outperforms by X%" to "is Nx cheaper than" or "is X% cheaper than"

### Heatmap Explanation Text
- Added one-line explanation above heatmap table: "Shows average cost metrics per tag value. Green = below average (good), Red = above average (expensive)."

### Combos & Signals: Counts Instead of Percentages
- Winning/losing signals changed from "60% top / 0% bottom" to "Found in 3 of top 5, 0 of bottom 5"
- Combo prevalence labels changed from "40% top / 20% bot" to "Found in 2 of top 5, 1 of bottom 5"
- tagSignals and combos now carry inTop, inBottom, topTotal, bottomTotal counts

### Grid Thumbnails: Verified
- renderCreativeGrid already checks thumbnail_url and image_url fields and renders images
- TAGGER_KEEP_FIELDS includes both fields — thumbnails survive localStorage compression

### shortAdName: Reviewed
- Function strips Meta campaign prefixes via regex, falls back to last 4 segments
- No changes needed — working as designed

---

## Supabase Shared Backend Integration (2026-03-26)

### Supabase Config & Helpers
- Added `SUPABASE_URL` and `SUPABASE_KEY` constants near other API keys
- `supabaseGet(table, query)` — REST API GET with auth headers
- `supabaseUpsert(table, rows)` — REST API POST with `Prefer: resolution=merge-duplicates`
- `taggerRowToSupabase()` / `supabaseRowToTagger()` — field mapping between tagger format and Supabase columns
- `syncTaggerToSupabase(data)` — async batch upsert (500 rows per request), non-blocking
- `loadTaggerFromSupabase()` — fetch all tagged_creatives ordered by updated_at desc

### Tagger Data — Dual Storage (localStorage + Supabase)
- `saveTaggerData()` now syncs to Supabase async after localStorage write (non-blocking)
- Boot sequence: loads from localStorage immediately, then async fetches from Supabase
- If Supabase has more creatives than localStorage, Supabase data is adopted and localStorage updated
- If localStorage has more, data is pushed to Supabase to keep it in sync
- Console logs: "Loaded X creatives from Supabase" or "Using localStorage fallback (Y creatives)"

### Tag Cache — Dual Storage (localStorage + Supabase)
- `saveTagCache()` now syncs to Supabase `tag_cache` table async after localStorage write
- Boot: loads localStorage cache immediately, then merges Supabase cache entries
- Larger cache wins during merge — critical for sharing Claude API credits across team
- `syncTagCacheToSupabase()` / `loadTagCacheFromSupabase()` helper functions

### Sync Status Indicator
- Added "☁️ Synced / ☁️ Syncing... / ☁️ Offline" badge in header next to connection status
- `updateSyncBadge(status)` updates badge color and text
- Green when synced, amber during upload, red when Supabase is unreachable
- localStorage always works as offline fallback — dashboard fully functional without Supabase

### Tables Used
- `tagged_creatives` — full creative data with tags, metrics, market, account, date
- `tag_cache` — cache_key + tags JSONB, prevents re-tagging same creatives

---

## Library Upload Drawer, Oracle/Lens/Sentinel Fixes (2026-03-26)

### Task 1: Upload Drawer for Library
- Added "Add Creative" button (purple, with + icon) next to Library filters
- Slide-out drawer with: Notion Link, Creative Name, Format dropdown (Static/Video/Testimonial/Animated), Market checkboxes (US/AUS/MEA/APAC/India)
- "Add to Sheet" copies row as CSV to clipboard with toast: "Write access not configured. Row copied to clipboard — paste into the Google Sheet."
- Drawer closes after submit, form resets
- Functions: `openUploadDrawer()`, `closeUploadDrawer()`, `submitUploadDrawer()`

### Task 2: Oracle — Don't blank modules on filter change
- `onDashboardFilterChange()` no longer clears `insightsGrid` and `briefsGrid` innerHTML before re-rendering
- Previously, if `runAnalysis()` timed out after clearing, modules stayed blank
- Now data-driven content stays visible while Claude analysis loads async

### Task 3: Lens Tagger — TD display and sort fixes
- CPTD cell in tagger table now shows: CPTD formatted when TD >= 1, "<1 TD" in muted text when TD > 0 but < 1, em dash when TD === 0
- Previously `Math.round(0.06) = 0` displayed as "0 TD" which was misleading
- Added "Best CPTD" sort option to tagger table dropdown
- `cptd_asc` sort: computes CPTD from Spent/TD, pushes 0-TD creatives to bottom
- `cpql_asc` sort: also pushes 0-QL creatives to bottom (not just 0-CPQL)

### Task 4: Lens Intel — Audience names verified
- `extractAudience()` noise filter confirmed working with 18 noise words
- Performance Matrix and audience cards consistently use `extractAudience()`
- No changes needed — function already filters noise at position 4+

### Task 5: Sentinel — Date filter verified
- `runSentinelView()` reads `sentinelDateRange` dropdown, filters by date cutoff
- "Low data" guard shows when total TD < 10 (CPTD KPI shows "Low data", score badge hidden)
- No changes needed — all working correctly

### Task 6: Library cards — Content type badge, APAC market, month/week
- Added APAC to market status pills (was missing from markets array)
- TRUE/FALSE values from "Shared for" columns now render correctly: TRUE shows checkmark + market name, FALSE shows muted market name
- Content type badge shown separately when `contentType` differs from `format`
- Month/Week now displayed in bottom-right of card
- Designer moved to bottom-left for cleaner layout

---

## Library Multi-Tab (Statics + Videos + Testimonials) (2026-03-26)

### Multi-Tab Fetch
- `fetchLibrarySheet()` now pulls 3 tabs from the Creative Library sheet:
  - Statics (gid=927168945), Videos (gid=0), Testimonials (gid=58845688)
- Each tab's rows are tagged with `_contentType` (Static/Video/Testimonial)
- All rows merged into `state._librarySheet` (combined ~1000+ rows)
- 10-minute background polling fetches all 3 tabs

### Column Mapping Updated
- `normalizeLibraryRow()` now maps 'Particular' → name, 'Designed By' → designer, 'Link' → notionLink
- Handles 'Shared for US/AUS/MEA/APAC/India' columns (TRUE/FALSE values)
- Handles 'Live Status US/AUS/MEA/APAC/India' columns
- Added `apacStatus` field, `week` field, `contentType` field

### Content Type Filter
- Added "All Types / Statics / Videos / Testimonials" dropdown to Library header
- Geo filter updated to handle TRUE/FALSE values from sheets (not just live/deployed text)

### Library URL Configured
- `DEFAULT_SHEETS.libraryUrl` set to the Creative Library sheet
- `DEFAULT_SHEETS.libraryTabs` stores all 3 tab GIDs with content types

---

## Metric Ticker, Sort Fix & Regional Filter Improvements (2026-03-26)

### Task 1: TQL & CPTQL added to Oracle Metric Ticker
- `renderMetricTicker()` now computes totalTQL from tagger data (`c['TQL']`) alongside totalQL
- Two new ticker cards: **TQL** (count + QL→TQL% conversion) and **Avg CPTQL** (spend/TQL with color thresholds)
- `TQL` and `CPTQL` added to `TAGGER_KEEP_FIELDS` so they survive localStorage compression
- `ensureDerivedMetrics()` now computes `CPTQL` (spend/TQL) on every row at ingest time

### Task 2: Lens Tagger "Best CPQL" sort fix
- "Best CPQL" sort (`cpql_asc`) now pushes 0-CPQL creatives to the bottom instead of the top
- Previously creatives with 0 QLs sorted first (CPQL=0 < any positive CPQL), showing all zero-data rows
- `compressTaggerData()` confirmed to preserve fractional TD values (no rounding) — "0 TD" display is correct for actual-zero rows

### Task 3: Regional Cards now respect date filter
- `renderRegionalCards()` changed from `state.taggerData` to `getDashboardFilteredData()`
- Geo breakdown cards now reflect the selected date range (7/14/30/60/90/custom/all) not just country filter
- `getDashboardFilteredData()` verified: returns ALL data when "All Time" is selected (correct default)

### Task 4: Library fallback verified
- `CREATIVE_ASSETS` (86 entries) renders correctly as legacy cards when no Library sheet URL is configured
- `renderLibrary()` path: `state._librarySheet` null → `legacyAssets = CREATIVE_ASSETS` → cards render with geo badges, designer, Notion links

### Task 5: Dropdown handlers verified
- `dashboardDateRange` → `onDashboardFilterChange()` ✓
- `dashboardCountryFilter` → `onDashboardFilterChange()` ✓
- `sentinelGeo` → `runSentinelView()` ✓
- `sentinelDateRange` → `runSentinelView()` ✓
- `taggerFilterCountry` → `onTaggerCountryChange()` ✓

---

## Precision, Date Filtering & Sentinel Improvements (2026-03-26)

### Fix 1: CRM Merge — Fractional TDs Instead of Math.round()
- Removed `Math.round()` from TD, TS, NRI, Paid, and net_booking in `mergeCRMWithMeta()` proportional distribution
- Stores raw fractional values so aggregate CPTD across all tabs is mathematically correct
- Previously rounding caused systematic over/under-counting of TDs across ads sharing a campaign

### Fix 2: QL Restoration — Composite Key in fullRefresh()
- `fullRefresh()` QL restore now builds a composite key: `campaignName|adSetName|adName`
- Looks up by composite key first, falls back to exact ad name
- Handles cases where identical ad names exist across different campaigns/ad sets

### Fix 3: Oracle Date Filter — getDashboardFilteredData() Now Filters by Date
- `getDashboardFilteredData()` now reads the date range dropdown (7/14/30/60/90/custom/all)
- For numeric ranges: computes cutoff date and filters `_date >= cutoffStr`
- For custom: reads from/to date inputs
- Rows without date info are kept (conservative — no data loss)

### Fix 4: extractAudience() — Noise Word Filter
- Added reject list of 18 common noise words: int, and, the, for, with, new, old, all, top, conv, leads, lead, ads, campaign, advantage, manual, lal, exp
- When candidate at position 4+ matches a noise word (case-insensitive), skips to next part
- Iterates through all remaining parts instead of only checking position 4
- Prevents noise like "conv" or "leads" from being parsed as audience names

### Fix 5: Sentinel — "Low data" Guard for CPTD
- When total TD < 10 across filtered dataset, CPTD KPI card shows "Low data" instead of a misleading number
- Score badge hidden (set to gray) when data is insufficient
- `runSentinelView()` now reads and applies the Sentinel date range filter before computing metrics

### Fix 6: Sentinel — Date Range Filter Dropdown
- Added date range `<select>` dropdown to Sentinel header (next to geo and format filters)
- Options: All Time, Last 7/14/30/60/90 days (default: 30 days)
- `runSentinelView()` filters data by selected date range before running analysis
- Reuses same date filtering approach as Oracle (cutoff string comparison on `_date`)

---

## Tagger Data Safeguards (2026-03-26)

### CRM Merge — Recompute CPTD After Merge
- After CRM merge adds TD/NRI/Paid values, `ensureDerivedMetrics()` is now re-run to compute CPTD, CPNRI, QL→TD%
- Previously CPTD stayed at 0 because it was only computed on initial load (before CRM data arrived)
- Lens Tagger, Sentinel, and Oracle all read CPTD from taggerData — this fixes all of them

### CRM Merge Fix — Don't Overwrite Meta QLs
- CRM merge was overwriting Meta API QL values with CRM QL values (409 vs 4823), inflating CPQL from ₹14K to ₹1.7L
- Fix: CRM merge now only adds **downstream funnel metrics** (NRI, TS, TD, Paid, Revenue) that Meta API doesn't have
- Meta QL and CPQL are preserved as the source of truth for lead volume and cost

### CRM Query Optimization — Meta Leads Only
- Full CRM sheet is 9.6MB / 13,752 rows — browser fetch worked but parseCSV choked, returning only 6 rows
- Now uses Google Sheets `tq` query: `select B,F,I,J,M,O,R,U,V where G='meta'` — fetches only Meta leads with needed columns
- Reduces payload from 9.6MB to 1.8MB (8,734 rows)
- `fetchSheetAsCsv()` now accepts optional `tq` parameter for server-side filtering
- Column headers preserved: lead_created_date, ethnicity, mx_utm_campaign, mx_utm_adcontent, qls, trials_sch, trials_done, paid, net_booking

### ROOT CAUSE FIX: Missing closing `</div>` on dashboard view
- `view-dashboard` div was never closed — all 7 other views were nested INSIDE it
- When `navigateTo` hid dashboard to show another tab, it hid all views with it
- Added missing `</div><!-- /view-dashboard -->` before `<!-- GENERATE VIEW -->`
- Guard updated with Category E: HTML Structure Integrity — mandatory div balance check on every edit

### Overwrite Protection
- `saveTaggerData()` now refuses to overwrite 100+ creatives with <10 creatives
- Logs `BLOCKED` error to console if attempted — prevents code bugs from wiping tagged data
- Protects against broken init code saving empty state over real data

### localStorage Quota Fix
- Sentinel output and analysis are NO LONGER persisted to localStorage (they recompute in seconds)
- On every boot, evicts recomputable keys (sentinelOutput, analysis, rawData, lastContent, currentBrief) to free space
- `EVICTABLE_KEYS` list used for consistent cleanup in both saveState() and init()
- Fixes QuotaExceededError that was crashing dashboard rendering after tagger data filled storage

### Auto-Backup After Tagging
- After every tag session (50+ creatives), auto-downloads a backup JSON file to Downloads folder
- 1.5s delay so tagging toast is visible first
- File contains: taggerData, tagCache, influencerTypes, export date, creative count
- No manual "Backup" button click needed — happens automatically

---

## Creative Brief Generator + Sentinel Campaign Rollup (2026-03-26)

### Feature 1: Designer Brief Generator
- Added `generateDesignerBrief(audience, hook, format, geo)` function
- Finds top 3 performing creatives for audience+hook combo from tagger data
- Renders a modal with: Target, Format + aspect ratio, Hook Approach with reference thumbnails, Do's/Don'ts from winning/losing tag patterns, Copy Direction (from HOOK_COPY_GUIDANCE map), Seasonal Context (via getUpcomingEvents), Reference Creatives with metrics
- "Copy Brief" button copies structured text brief to clipboard via `copyDesignerBrief()`
- "Brief for Designer" button (with document icon) added next to Generate button in:
  - Oracle "Make More Of This" cards
  - Lens Intel "What's Working" audience cards

### Feature 2: Sentinel Campaign Rollup View
- Added view-level toggle above Sentinel drill-down table: Campaign / Ad Set / Ad
- `sentinelViewLevel` variable tracks current level (default: campaign)
- **Campaign view**: Groups all ads by Campaign name, aggregated metrics, click to expand ads
- **Ad Set view**: Groups by Ad set name, aggregated metrics, click to expand ads
- **Ad view**: Flat list of individual ads (no grouping)
- Refactored `renderSentinelTable()` with helper functions: `aggregateRows()`, `renderAdRow()`, `renderAggRow()`
- Added `toggleSentinelGroup()` for expand/collapse with arrow indicator
- `setSentinelViewLevel()` updates toggle button states and re-renders table

---

## Oracle Deployment Recommender (2026-03-26)

- **Module 4 enhanced**: Creative Tagging Advisory now includes Oracle Deployment Recommender
- Pulls Library creatives from `state._librarySheet` (GSheet) or `CREATIVE_ASSETS` (fallback)
- Builds winning audience patterns (best hook + format per audience) from tagger data via `extractAudience()`
- Checks which Library creatives are NOT deployed (name keyword matching against tagger ad names)
- Infers hook type and format from creative name keywords (e.g. "testimonial" -> H-TESTI, "static" -> F-STATIC)
- Matches inferred tags to audience winning patterns, scores: hook match = 3pts, format match = 2pts, minimum 3 to recommend
- Renders recommendation cards with: audience, confidence (High/Medium), predicted CPQL range (0.8x-1.3x of audience avg), match reasons
- Capped at 12 visible cards with overflow count; existing AI advisory and Forge undeployed sections preserved

---

## Bug Fixes (2026-03-26)

- **Library blank sheet fix**: `normalizeLibraryRow` column matching now fully case-insensitive and ignores spaces/underscores; added debug console.log for raw columns and first row; shows helpful diagnostic message when sheet loads but no columns match
- **Heatmap Unknown filter**: `renderTaggerHeatmap` now skips rows where tag is "Unknown", "unknown", or "N/A" (matching the existing filter in `renderTagCombos`)

- **Bug 3**: CPTD column in Top 5/Bottom 5 no longer shows "CPQL" suffix — fallback CPQL values now render in muted style with a small "(CPQL)" indicator below
- **Bug 5**: Tagging advisory now shows separate messages: "All X generated pieces have been deployed" vs "No content generated in Forge yet"
- **Bug 6**: Track B creator extraction excludes campaign objective words (Leads, Conv, Signup, etc.) via IGNORE_NAMES set
- **Bug 10**: Tag combos now use `tagLabel()` for human-readable names instead of raw shortcodes
- **Bug 11**: Combos with "Unknown"/"unknown"/"N/A" tag values filtered out before analysis
- **Bug 12**: Sentinel Top 5/Bottom 5 deduplicated by last 20 chars of ad name (same creative under different ad sets)
- **Bug 17**: Audience Map rows with count < 3, null CPTD, and null best hook are filtered out
- **Bug 20**: Track B double dash "--" replaced with single em dash (U+2014) for null values
- **Bug 22**: Library geo filter changed "Australia" to "AUS", added "UK" option
- **Bug 23**: Added legend "check = live in market" below library filter
- **Bug 26**: Account names in Settings separated with ", " instead of newline (input element can't render newlines)

---

## Data Layer

### CRM Integration
- CRM sheet fetched from `https://docs.google.com/spreadsheets/d/1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs/` (Leads tab gid=1105847310)
- CRM stored in `state._crmLeads` (memory only, NOT localStorage — too large)
- `mergeCRMWithMeta()` matches by campaign core (strip dates/geo prefixes, substring match)
- Called in 3 places: after CRM fetch in refreshData, after taggerData cache load, after tagCreatives completes
- CRM columns: `mx_utm_campaign`, `mx_utm_adcontent`, `qls`, `trials_sch`, `trials_done`, `paid`, `net_booking`, `ethnicity`

### Storage
- `saveTaggerData()` compresses to 20 essential fields before saving to localStorage
- On QuotaExceededError: removes `gf_rawData` and `gf_analysis` first, then retries
- `gf_rawData` excludes CRM data (only saves metaAds)
- Never store CRM leads in localStorage

### Tag Validation
- `validateTags()` checks every tag value against `TAG_CATEGORIES.values`
- Case-insensitive fuzzy match attempted first
- Non-taxonomy values rejected as "Unknown"
- Applied on both cached and newly tagged creatives

### Meta API QL Mapping
- Tries: lead, offsite_conversion.fb_pixel_lead, onsite_conversion.lead_grouped, offsite_conversion.custom.lead, offsite_conversion.fb_pixel_custom, complete_registration, offsite_conversion.fb_pixel_complete_registration, onsite_conversion.messaging_conversation_started_7d
- Fallback: sum all offsite_conversion actions

---

## Sentinel

### Thresholds (from 01-sentinel.md — stricter values)
- US: CPQL 10K/15K, CPNRI 15K/20K, CPTD 35K/50K, QL→TD% 50/30
- India: CPQL 500/800, CPNRI 800/1200, CPTD 3K/5K
- AUS: CPQL 10K/15K, CPNRI 10K/15K, CPTD 30K/45K, QL→TD% 35/25
- MEA: CPQL 8K/10K, CPNRI 8K/10K, CPTD 25K/35K, QL→TD% 35/25

### Metrics (from 00-project README)
- Full funnel: Spend, Impressions, Clicks, CPC, CTR, Click→QL%, QL, TQL, CPTQL, QL→TQL%, CPQL, CPNRI, TS, QL→TS%, TD, TS→TD%, QL→TD%, CPTD, Paid, T2P%, QL→P%, Revenue, ABV, ROAS, CAC
- TQL is market-specific: US=NRI, India/MEA=IB+IGCSE boards, APAC/UK/AUS=total QL
- Leading metrics per market: Spends, CTR, CPQL, TQL, CPTQL, Click→QL%, CPTD
- CPTD is the lagging metric — optimize on CPTQL first when funnels aren't mature

### Top 5 / Bottom 5
- Split by format: 3 statics + 2 videos each (D-06)
- G-02: no overlap between top and bottom
- Minimum 5 QLs for inclusion

### Anomaly Detection
- Budget leak: spend > 50K and TD = 0
- Funnel break: QL > 10 and TD = 0
- Spam detection: random lead names flagged, spam_count + spam_pct in summary

### Export
- Multi-tab Excel (SheetJS): Summary, Top Statics, Top Videos, Bottom Statics, Bottom Videos, Anomalies, All Creatives

---

## Lens (Tagger + Intel)

### Tag Taxonomy (TAG_CATEGORIES)
- Hook: H-MATH, H-FEAR, H-PROBLEM, H-PAINPOINT, H-TEST, H-STAT, H-QUES, H-LIFE, H-EVENT
- Format: F-STATIC, F-VIDEO, F-INFLU, F-TESTI, F-ANIM, F-CAROUSEL, F-VERN-TESTI, F-PRODUCT, F-PLATFORM-DEMO, F-FOUNDER, F-BRAND, F-APP-PREVIEW, F-CONTENT-UGC
- Pain/Benefit: PB-GRADE, PB-CONF, PB-FOUND, PB-FUTURE, PB-TUTOR, PB-INDIAN, PB-COMP
- Tone: Aspirational, Testimonial, Offer/Promo, Urgency, Comparison, Seasonal, Confident, Empathetic, Warm
- Audience: NRI, Non-NRI, Asian, Expat, Telugu/Tamil/Hindi/Gujarati/Arabic Speaking, High School Parents, Universal

### Display Names
- All H-/F-/PB- codes have human-readable labels in TAG_DISPLAY
- `tagLabel()` function converts codes to display names everywhere in UI
- Category labels: "Hook" not "Hook Type", "Benefit Frame" not "Pain/Benefit Frame", "Audience" not "ICP"

### Tagger UI
- 4 tabs: Creatives, Heatmap, Combos, Grid
- Pagination: 15 items per page with Prev/Next
- Only active tab renders (lazy loading)
- Country filter affects insights cards

### Heatmap
- CPTD is primary metric, CPQL as fallback
- Shows both Avg CPTD and Avg CPQL columns

### Combos
- Uses median instead of mean
- Winning signal: tag in >=60% of top5 AND <=20% of bottom5
- Losing signal: inverse
- Kill/Fix/Watch recommendations on losers (>2x = Kill, 1.5-2x = Fix, <1.5x = Watch)

### Intel (Performance Matrix)
- computeMetric returns null (not 0) when denominator is 0
- Display uses `v !== null && v > 0` not `v ?` (avoids falsy-zero bug)
- Min 1 creative per cell (was 2)
- Metric options: CPQL, CPNRI, CPTD, Total Spend, QL Count, Ad Count
- Heatmap inverts for volume metrics (green=high)

### Audience Map
- New tab in Lens Intel
- Cross-references audience tags with creative performance
- Predictive CPTD range from best tag combos

---

## Forge

### Brand Validation (validateBrand)
- BANNED_WORDS check
- MathFit™ trademark check
- Parent-facing voice check (no child-addressed copy)
- Meta char limits: Headline 40, Primary 250, Description 30
- Google RSA char limits: Headline 30, Description 90
- Duplicate word scan (morphological variants: -ing, -ed, -s, -er, -ly, -tion, -ment)
- Validation banner shows ABOVE output

### Version History
- `state.forgeVersions` tracks v1/v2/v3 per generation
- Version pills for toggling between versions
- Refinements create new versions, not overwrite

### Feedback Loop
- Status buttons: Deployed / Won / Dropped
- Tracked in generationHistory with status + statusDate
- Counts shown in Oracle pipeline

### Prompt
- Full brand-guidelines.md synced (including MathFit Definition, Transformation Narrative, Visual Guidelines, Proof Formats)
- Full icp-guide.md synced (including What They're Buying, Child Profile, Anti-ICP, Channel Performance, Pain Points, Voice Rules)
- Seasonal calendar injected (getUpcomingEvents)
- Geo-specific rules per market
- FUAR framework (Fluency, Understanding, Application, Reasoning)
- Accelerator churn warning

---

## Oracle

### Pipeline
- Respects dashboard geo filter
- Shows upcoming seasonal windows (next 4 weeks)
- Shows Forge deployment status counts

### Analysis prompt
- Includes targeting suggestions: content type, ethnicity, age range, interests, lookalike source, hook type, benefit frame
- Brief cards show targeting params as pills

### Metric Ticker
- Trend arrows: ↑ (improving), ↓ (worsening), → (stable <5%)
- Groups by date, compares recent vs previous period

---

## UI/UX

### Font
- DM Sans (not Inter)

### Currency
- Always ₹ (INR) with L/Cr formatting
- formatCurrency takes 1 arg only

### Guardrails Implemented
- G-01: No row aggregation
- G-02: Best/worst no overlap
- G-03/G-04: No classroom/center
- G-05: FUAR + MathFit™ trademark
- G-06: Split by format
- G-07: Currency labelled (INR default)
- G-08: Char limits verified post-gen
- G-14: Duplicate word scan
- G-19: "Why This Works" mandatory in prompt

---

## Spec Alignment Sweep (2026-03-26)

### Fatigue & Saturation (C-08, C-09)
- Fatigue detection now uses CPQL >30% above portfolio average (spec C-08)
- Creative fatigue and audience saturation are now separate sections in Fatigue Tracker
- Saturation uses impressions/QL ratio (high frequency proxy); fatigue uses CPQL degradation

### Minimum Sample Size (C-05)
- All signal thresholds raised from 2 to 3 creatives minimum
- Performance Matrix, Combos, Winning Formulas, Audience Map all require 3+ creatives

### Tag Taxonomy Expansion (02-lens)
- Hook types: added H-COMP, H-OFFER, H-GRADE
- Feature tags: expanded from 8 to 18 (FUAR framework, MathFit identity, Progress tracking, etc.)
- Feature tags section added to tagging prompt with explicit-mention-only rule

### Correlation Language (C-04)
- Oracle analysis prompt rule 12: "associated with" not "causes/drives/leads to"

### ICP Content Mix Tracker
- Tracks actual vs ideal segment distribution (40/30/20/10 rule)
- Visual bar chart with gap alerts when segments are >10% underweight
- Renders above AI Creative Briefs in Lens Intel

### Content Pipeline Intelligence
- Gap analysis added to Audience Map: detects underserved formats per geo
- Format mix snapshot with counts and percentages
- Pipeline gaps surface missing formats and untapped audiences
- Forge undeployed count shown

### Oracle Module 5 — Influencer Intelligence
- No longer "Coming Soon" — renders Track A (organic) + Track B (paid) summary
- Shows creator count, post count, UTM clicks, top creator, spend, CPQL
- Links to full Influencer tab for deep dive

### Oracle Chatbot ("Ask Oracle")
- Data-aware Q&A chat on Oracle dashboard
- Grounded in all loaded state: market breakdown, top/bottom creatives, Oracle analysis
- Multi-turn conversation with chat history
- Quick-action suggestion chips for common questions
- Uses correlation language guardrails in system prompt

### Reliability Sweep — Ship-Ready (2026-03-26)

#### Derived metrics computed at ingest
- `ensureDerivedMetrics()` runs on every data load: computes CPQL, CPTD, CPNRI, CTR, CPC, QL→TD%, Click→QL% from raw columns
- All derived fields now in TAGGER_KEEP_FIELDS — survive localStorage compression
- Creative type inferred from ad name if missing

#### Oracle dashboard works without Claude
- Metric ticker, pipeline, country breakdown all render from raw data instantly on page load
- Module 1 (Win/Loss) shows data summary + auto-computed top5/bottom5 without Sentinel
- Module 2 (Country Breakdown) shows per-geo CPQL/CPTD/QL→TD% from tagger data
- Claude AI analysis overlays on top as enhancement — never blocks the dashboard
- Filter changes show data-driven content immediately, then async Claude overlay

#### Refresh Data button on Oracle
- Prominent "Refresh Data" button next to Re-analyze
- Runs full pipeline: Meta API + sheets → render
- Progress indicator + success/failure toast
- Stale data warning "Refresh Now" button also calls fullRefresh (not Settings redirect)

#### Error handling + timeout
- Claude analysis has 45s timeout — falls back to data-driven view
- On analysis failure: shows data summary + toast instead of blank modules
- Filter changes no longer blank modules with "Re-analyzing..." — show data immediately

#### First-time onboarding
- "No data" state shows numbered steps: Settings → Refresh → Tag → Dashboard
- Stale data warning simplified with direct action buttons

### Product Polish Sweep (2026-03-26)

#### Sentinel: CTR & Clicks preserved
- Added 'Impressions' and 'Clicks' to TAGGER_KEEP_FIELDS — previously lost during compression
- Top 5 / Bottom 5 tables now render ABOVE anomalies (were pushed below fold)

#### Lens: CPQL computed at display time
- Tagger table and Grid view now compute CPQL from Spend/QL if pre-computed value is 0
- Fixes "–" display on creatives that have Spend + QL but CPQL wasn't pre-computed

#### Lens Intel: Performance Matrix threshold relaxed
- Matrix cell minimum reverted to 2 creatives (from 3) — keeps more cells visible
- Signals/Combos still require 3 creatives (spec C-05)

#### Creative name readability
- `shortAdName()` strips Meta campaign prefixes (GEO_FB_Leads_Conv_..._LP_..._Format_)
- Shows the meaningful creative concept instead of the full campaign string
- Applied across Tagger table, Grid, Sentinel Top5/Bottom5, Oracle Win/Loss

### Influencer Sheet Column Fix
- Sheet has summary row at top + blank column headers — code was reading row 1 as headers
- Added INFLU_COL_MAP: position-based column mapping (col 3=Spend, 10=Views, 12=Shares, 13=UTM Clicks, 14=ER, 15=Enrolments, 17=Share Rate)
- Filters out summary and header rows, maps by column position instead of header name
- Added Spend column to creator leaderboard

### Oracle Filters Now Update Metrics
- renderMetricTicker() and renderPipeline() now use getDashboardFilteredData() (respects both country AND date filters)
- Previously they read raw state.taggerData ignoring filters

### Global Win/Loss Auto-Computes Top5/Bottom5
- Win/Loss module no longer depends on Sentinel being run separately
- Auto-computes top 5 / bottom 5 creatives from tagger data (sorted by CPTD, fallback CPQL)
- Uses dashboard filters (country + date) for the computation

### Library Rebuild — GSheet as Source of Truth
- New `libraryUrl` field in Settings for Creative Library Google Sheet
- On Library tab open: fetches sheet via CSV API, parses into cards
- Sheet columns: Creative Name, Format, Notion Link, US/IN/AU/MEA Status, Hook Type, Frame, Language, Confidence, Last Analysed, Notes
- Flexible column name matching (handles underscore, case, and alias variants)
- Card UI redesign: per-market status pills (Live/Draft/Paused), Hook + Frame tag pills, Confidence badge, Last Analysed timestamp, Notion link, Designer, Notes
- Background polling every 10 min while Library tab is open
- Silent diff: shows toast when new creatives appear in sheet
- CREATIVE_ASSETS kept as fallback when no sheet URL is configured
- AI-generated content section preserved alongside sheet-driven cards
- Polling auto-stops when navigating away from Library tab

### Emoji Fix
- Replaced unicode escape sequences with actual UTF-8 emoji in Oracle module headers

---

## Known Limitations
- Google Ads API not integrated (Meta only)
- Image gen uses Gemini, not Banana Pro
- Single-file HTML, not Next.js
- Supabase as shared backend with localStorage offline fallback
- CRM match rate depends on campaign name similarity between CRM UTM and Meta campaign names
