# Godfather Changelog — Guard Reference

Every fix and change to index.html is logged here. Guard reads this before approving any new change.

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
