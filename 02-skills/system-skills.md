# System Skills — Agent Architecture + Supabase + UI Patterns

> **Purpose:** How Godfather's system works: agent responsibilities, data persistence, state management, filter propagation, and UI patterns. The reference for anyone building new features or debugging rendering issues.
> **Created:** April 16, 2026 | **Source:** 01-agents/ definitions + Supabase table analysis + index.html state management

---

## SHARED DATA BLOCKS

### Supabase Table Registry

**Instance:** `lcixlyyzlnzeiqjdbxfh.supabase.co`

| Table | PK / on_conflict | Purpose | Read Pattern | Write Pattern | Rows |
|-------|-----------------|---------|-------------|---------------|------|
| `creative_tags` | `ad_name, account` | Tag storage for all creatives. THE source of truth for taxonomy | `select=*` (full load at boot) | Upsert per-ad after tagging: `on_conflict=ad_name,account` | ~2,300 |
| `meta_ad_data` | `date, ad_id, account` | Daily Meta API insights cache (spend/impr/clicks per ad per day) | Paginated: 10K rows per page, ordered by date desc | Upsert batch 500: `on_conflict=date,ad_id,account` | ~32K |
| `oracle_actions` | `item_id` | Pause Now / Make More card states (done/dismissed/snoozed) | `select=*` at boot | Upsert on action: `on_conflict=item_id` | ~100 |
| `godfather_config` | `key` | Key-value config (create_pin, tagger_pin) | `select=*&key=eq.{key}` on demand | Rare writes (PIN changes) | ~5 |
| `generation_history` | auto-increment | Forge generation log (brief, output, model, feedback) | `select=*&order=created_at.desc&limit=50` at boot | Insert after each generation | ~200 |
| `library_assets` | auto-increment | Creative library metadata (name, type, thumbnail, tags) | `select=*&order=updated_at.desc` at boot | Insert/update from Library view | ~100 |
| `library_deployments` | auto-increment | Tracks which library assets are deployed live | `select=*&order=marked_live_at.desc` | Insert on deploy | ~50 |
| `forge_feedback` | auto-increment | User feedback on generated content | — | Insert on thumbs up/down | ~100 |

**Supabase patterns:**
- `supabaseGet(table, query)` — Returns array or null (NOT throw). Always check return value.
- `supabaseUpsert(table, rows, onConflict)` — Uses `resolution=merge-duplicates,return=minimal`. Fire-and-forget (`.catch()` logged).
- `supabaseDelete(table, column, value)` — DELETE with eq filter.
- **localStorage fallback:** `creative_tags` has localStorage backup (`gf_creativeTagsCache`). Checked when Supabase offline.

### Agent Data Flow

```
                    ┌──────────────┐
                    │   ORACLE     │  Dashboard tab — "What to do right now"
                    │  (Master)    │  Reads from ALL three agents
                    └──────┬───────┘
                           │ reads
           ┌───────────────┼───────────────┐
           │               │               │
   ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │  SENTINEL    │ │    LENS     │ │    FORGE    │
   │ (Performance)│ │  (Creative) │ │  (Content)  │
   │              │ │             │ │             │
   │ Ingests data │ │ Audits tags │ │ Generates   │
   │ Computes     │ │ Finds       │ │ copy using  │
   │ metrics      │ │ patterns    │ │ Sentinel +  │
   │ Flags        │ │ Scores      │ │ Lens data   │
   │ anomalies    │ │ creatives   │ │             │
   └──────────────┘ └─────────────┘ └─────────────┘
```

**In code:** Agents don't have separate processes. They are CONCEPTUAL roles that map to function groups:
- **Sentinel** → `getMarketMetrics`, `getAdPerformance`, `getPortfolioMetrics`, `runSentinelAnalysis`
- **Lens** → `mergeCRMWithMeta`, `getCreativeVerdict`, `renderTagCombos`, `renderTaggerHeatmap`, `getAudiencePerformance`
- **Forge** → `buildSystemPrompt`, `callClaude`, `validateBrand`, `tagCreatives`
- **Oracle** → `renderOracleCardsV2` (Pause Now + Make More), `renderWoWDigest`, `renderTrendCharts`, `renderMetricTicker`

### State Management Model

**Global state object:** `state` — persistent across tab switches:
```
state.taggerData[]          — All creative data (from getAdPerformance or sheet upload)
state.rawData.metaAds[]     — Raw Meta Ads sheet data (if uploaded)
state.rawData.metaCreatives[] — Creative assets from Meta API
state.sentinelOutput        — Last Sentinel analysis result
state.generationHistory[]   — Forge generation log
state.library[]             — Library assets from Supabase
state.currentBrief          — Active Create tab brief
state.metaApi               — Meta API credentials (token, accounts)
state.sheetConfig           — Google Sheets URLs
```

**Global arrays** (NOT inside `state` — performance-critical, used by 50+ functions):
```
leadsData[]      — CRM leads (intl + PLA + India). ~14K rows.
costData[]       — Daily spend (meta-only). ~5K rows.
metaAdData[]     — Supabase meta_ad_data cache. ~32K rows.
metaCreatives[]  — Meta API creative objects. ~2K rows.
```

**Lookup maps** (built by `buildLookupMaps()`, invalidated by `invalidateAdPerfCache()`):
```
_campaignMap     — campaign_name → {spend, market, rows} from costData
_adMap           — normalizedAdName → {thumbnail_url, image_url, campaign_name} from metaCreatives + taggerData
_tagMap          — normalizedAdName → {tags, type, thumb, campaign, adset} from taggerData
```

**Caches:**
```
_adPerfCache     — Last getAdPerformance result (keyed by market|dates|flow|includeNonLP)
_dailyCache      — Last getAdPerformanceDaily result (keyed by market|dates|flow)
```
Both invalidated by `invalidateAdPerfCache()` on filter change, data refresh, or flow toggle.

### Filter Propagation Model

**3 global filters** — affect ALL views and metric computations:

| Filter | Source | Synced across | Read by |
|--------|--------|--------------|---------|
| Geo (market) | `dashboardCountryFilter` dropdown | All tab geo dropdowns via `syncGeoFilter()` | Every metric function via `filterLeadsByMarket` + `filterCostByMarket` |
| Flow (BAU/PLA) | `.flow-btn` pill toggle | Global — no per-tab override | Every metric function via `_filterLeadsByFlow` + `_filterCostByFlow` |
| Date range | `dashboardDateFrom` + `dashboardDateTo` | Global | `getGlobalDateRange()` → passed to all metric functions |

**Propagation chain:**
```
User changes filter → onGlobalFilterChange()
  → invalidateAdPerfCache()     // clear cached data
  → syncGeoFilter(sourceId)     // sync all dropdowns
  → re-render active view:
      dashboard → onDashboardFilterChange() → renderMetricTicker + renderWoWDigest + renderOracleCardsV2 + ...
      tagger → showTaggerResults() → renderTaggerTable + renderTaggerHeatmap + ...
      insights → renderCreativeIntel()
      etc.
```

**Tab-specific filters** (NOT synced globally):
- Tagger: search query, verdict filter, category filter, format filter, sort, view level (ad/campaign/adset)
- Library: format filter, geo filter
- Create: audience pills, segment dropdown
- Creators: sort dropdown

---

## SKILL 5: AGENT ARCHITECTURE

### Role

You are the system architect. You understand how Oracle, Sentinel, Lens, and Forge relate to each other, what data each owns, and the scope boundaries. When someone asks "which part of the system handles X?", you route them to the right agent.

### Routing Table

| Question / Task | Agent | Key Function(s) | Skill Reference |
|----------------|-------|-----------------|----------------|
| "What are our numbers this week?" | Oracle | `renderMetricTicker`, `renderWoWDigest` | [[data-intelligence-skills#Skill-3\|Weekly Digest]] |
| "Why is CPTD up?" | Oracle | `_buildWoWWhy` | [[data-intelligence-skills#Skill-7\|Creative Diagnostician]] |
| "Which ads should I pause?" | Oracle | `renderOracleCardsV2` (Pause Now) | [[data-intelligence-skills#Skill-2\|Spend Optimizer]] |
| "What should I make next?" | Oracle | `renderOracleCardsV2` (Make More) | [[segwise-intelligence-skills#Skill-5\|Next Best Creative]] |
| "What tags work for US?" | Lens | `renderTagCombos`, `renderTaggerHeatmap` | [[segwise-intelligence-skills#Skill-2\|Creative DNA]] |
| "Tag these new creatives" | Lens | `tagCreatives`, `buildTaggerSystemPrompt` | [[taxonomy-skills#Skill-3\|Tagging/Taxonomy]] |
| "Write Meta ad copy for NRI audience" | Forge | `buildSystemPrompt`, `callClaude` | [[production-skills/meta-ad-copy]] |
| "Is this copy on-brand?" | Forge | `validateBrand` | [[production-skills/brand-validator]] |
| "What's the CRM match rate?" | Sentinel (eng) | `getAdPerformanceDaily` logs | [[engineering-skills#Skill-1\|Data Engineering]] |
| "Why does this ad show 0 QLs?" | Sentinel (eng) | Trace pipeline | [[engineering-skills#Skill-2\|QA/Debugging]] |

### Scope Boundaries

| Agent | Owns | Does NOT Own |
|-------|------|-------------|
| Sentinel | Metrics, thresholds, anomaly detection, market health | Creative analysis, copy generation |
| Lens | Tag taxonomy, creative patterns, combos, fatigue | Spend data, funnel metrics, copy |
| Forge | Copy generation, brand validation, prompt construction | Data ingestion, metric computation |
| Oracle | Decision synthesis, action cards, WoW analysis | Individual creative analysis |

### Personality Guardrails

Per [[03-guardrails/00-master-guardrails]]:
- **Sentinel:** Data-driven, precise, never speculative. Cites specific numbers. Uses [G/A/R] status colors.
- **Lens:** Pattern-focused, comparative. "This hook outperforms that hook by X%." Never prescribes copy.
- **Forge:** Creative, brand-aware. Follows [[05-reference/brand-guidelines]] strictly. Always validates output.
- **Oracle:** Decisive, action-oriented. "Do this NOW." Synthesizes from all three agents.

---

## SKILL 6: SUPABASE PATTERNS

### Role

You are the persistence layer expert. You know every table schema, every upsert pattern, every error mode.

### Key Patterns

#### Upsert (write)
```js
supabaseUpsert('creative_tags', [row], 'ad_name,account')
// → POST /rest/v1/creative_tags?on_conflict=ad_name,account
// → Headers: Prefer: resolution=merge-duplicates,return=minimal
// → Fire-and-forget: .catch(e => console.warn(...))
```

#### Paginated Read (meta_ad_data)
```js
// loadCachedAdData reads in pages of 10K
const PAGE = 10000;
let offset = 0, allRows = [];
while (true) {
  const page = await supabaseGet('meta_ad_data', `select=*&order=date.desc&limit=${PAGE}&offset=${offset}`);
  if (!page?.length) break;
  allRows.push(...page);
  offset += PAGE;
}
```

#### Error Handling
- `supabaseGet` returns `null` on error (not throw) → always check: `if (!rows) return;`
- `supabaseUpsert` returns `true/false` → fire-and-forget with `.catch()` logging
- Supabase offline → localStorage fallback for creative_tags only
- Table doesn't exist → 404 caught silently (oracle_actions may not exist on fresh setup)

### Known Gotchas
1. **`on_conflict` must match PK/unique constraint** — if table schema changes, upserts silently fail
2. **Row size limit** — creative_tags rows with long ad names + all 14 tag fields + thumbnail URLs can hit Supabase row size limits
3. **No RLS policies** — all tables are public (publishable key). Acceptable for internal tool.
4. **Stale localStorage** — `_TAXONOMY_VERSION` gate clears old tag caches when taxonomy changes

---

## SKILL 7: DASHBOARD / UI PATTERNS

### Role

You are the UI architect. You understand the "creative audit, not campaign audit" framing, the component library, and the rendering pipeline.

### Core Framing

**Godfather audits CREATIVE performance, not campaign optimization.**

The unit of analysis is the CREATIVE (ad name + tags + thumbnail). Campaign and ad set are CONTEXT, not the primary grouping. This means:
- Tagger groups by ad, not by campaign
- Combos show tag combinations, not campaign combinations
- Pause Now flags individual creatives, not campaigns
- Make More recommends creative patterns, not budget shifts

Per [[DECISIONS#Tab-Roles|Tab Roles]]:
- **Library** = asset tracker ONLY (no performance data)
- **Lens landing** = Winning/Losing Patterns (audience-segmented combos)
- **Oracle landing** = WoW digest ("this week vs last week" on open)

### Rendering Pipeline

```
Data Load → Filter → Compute Metrics → Render
   ↑                                      │
   └──── onGlobalFilterChange() ──────────┘
```

**Never render before data load.** Every render function checks:
```js
if (!leadsData.length) { /* show spinner or placeholder */ return; }
```

**Never compute metrics outside filter context.** Every metric function receives market + date range:
```js
const m = getMarketMetrics(market, from, to);  // CORRECT
const m = getMarketMetrics();                   // WRONG — no market context
```

### Component Patterns

| Component | Usage | Key Pattern |
|-----------|-------|------------|
| KPI Card | Dashboard hero metrics (CPTD, TDs) | `metric-card` class, `border-l-4` color accent, trend badge |
| Comparison Table | BAU vs PLA, market comparison | `<table>` with colored delta column |
| Sparkline | 30-day trend on metrics | `generateSparklineSVG()` — inline SVG, no charting library |
| Hierarchy Expand | Campaign → AdSet → Ad in Tagger | `toggleTaggerGroup()`, `data-parent` attribute, hidden by default |
| Creative Card | Tagger Insights, Pause/Refresh | Thumbnail + verdict badge + tag pills + metric arrows |
| Accordion | Oracle sections (Pause Now, Make More) | `<details>` with `oracle-accordion` class |
| Flow Toggle | BAU/PLA/All | 3 `.flow-btn` pills, purple = active |
| Toast | Success/error feedback | `showToast(message)` — auto-dismiss 3s |

### Tab Structure

| Tab | Nav Label | Primary Data Source | Key Renders |
|-----|-----------|-------------------|-------------|
| Dashboard | "What to do right now" | `getMarketMetrics` (KPIs), `getAdPerformance` (Oracle cards) | metricTicker, funnelTable, WoW, trends, Pause/Make More |
| Insights | "What's working & why" | `getFilteredTaggerData` → Lens analysis | Winning/Losing patterns, audience map, heatmap |
| Create | "Generate copy & visuals" | Forge + Haiku API | Brief form, generation, brand validation |
| Tagger | "Tag & analyze creatives" | `getFilteredTaggerData` | Data table, heatmap, combos, distributions, leaderboard |
| Library | "Your creative assets" | Supabase library_assets | Grid view, deploy tracking |
| Performance | "Funnel scoring & drill-down" | `getAdPerformanceDaily` | Day-by-day table |
| Creators | "Influencer performance" | `getInfluencerAds` | Creator cards, organic metrics |
| Settings | Config | — | API keys, sheet URLs, data refresh |

### When Reporting

When describing a UI change or debugging a rendering issue:
1. Name the TAB and SECTION (e.g., "Dashboard → Pause Now cards")
2. Name the RENDER FUNCTION (e.g., `renderOracleCardsV2`)
3. Name the DATA FUNCTION it calls (e.g., `getAdPerformance`)
4. Check the FILTER CHAIN (does it respect geo, flow, date range?)
