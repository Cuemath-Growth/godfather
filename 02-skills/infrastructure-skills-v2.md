# Infrastructure Skills v2 — Boot, Schema, Cache, Feedback, Observability

> **Purpose:** Five infra skills that fill the gaps left by the original seven (engineering-skills, taxonomy-skills, system-skills shipped 2026-04-16). Each one is grounded in a recurring failure mode the codebase has actually hit.
> **Created:** 2026-04-28 | **Source:** `init()` boot trace, schema-drift bug history (commits `cae82f2`, `3f03d91`, `cbaf0dd`, `6b3ed30`), Apr 17 follow-ups list, Apr 28 blocker sweep.
> **Numbering:** 8, 9, 10, 12, 14 — gaps reserve 11 (Cloudflare deploy) and 13 (single-file perf) for when they earn the slot.

---

## SHARED DATA BLOCKS

### Storage Surfaces

Five places state lives. Knowing which surface owns which data prevents most cache bugs.

| Surface | What lives here | Lifetime | Authoritative? |
|---|---|---|---|
| **Supabase** | `meta_ad_data` (32K daily rows), `creative_tags`, `library_assets`, `library_deployments`, `library_notes`, `oracle_actions`, `generation_history`, `action_log` | Permanent | Yes — system of record |
| **Module globals** | `leadsData[]`, `costData[]`, `metaAdData[]`, `metaCreatives[]`, `state.taggerData[]`, `_campaignMap`, `_adMap`, `_tagMap`, `_oracleActions[]` | Page session | No — derived from Supabase + Sheets |
| **Compute caches** | `_adPerfCache`, `_dailyCache` | Until filter change | No — pure memoization |
| **localStorage** (`gf_*`) | API keys, sheet URL, `gf_taxonomy_v`, `gf_generationHistory` fallback, `gf_library` fallback | Until manual clear | No — cache only, except keys |
| **sessionStorage** | (unused as of Apr 28) | — | — |

`EVICTABLE_KEYS = ['gf_sentinelOutput','gf_analysis','gf_rawData','gf_lastContent','gf_currentBrief']` — wiped on every boot. Anything safe to recompute belongs here.

### Boot Phases (recap from engineering-skills.md SKILL 1, with infra lens)

```
Phase 0  init()                           — DOM bindings, pill setups, settings load
Phase 1  loadCachedData() + Cached*       — instant-fallback render from localStorage
Phase 2  Promise.all(bootPromises)        — 5 parallel async loads (see Skill 8)
Phase 3  Post-load processing             — buildLookupMaps → ad name resolve → PLA tag
                                            → mergeCRMWithMeta → invalidateAdPerfCache
Phase 4  Single render                    — navigateTo('dashboard') + renderLibrary()
Phase 5  Background sync (3s delay)       — fetchMetaCreatives + fetchMetaAdInsights
                                            (deploy-only via _IS_DEPLOYED)
```

---

## SKILL 8: BOOT ORCHESTRATION & LOAD ORDER

### What this skill knows
The exact dependency graph between every async load at boot, what's safe to parallelize, what must be sequential, and which "this works locally but breaks in prod" bugs come from boot-order assumptions.

### Mental model
Boot has **three classes** of work and they must not be confused:
1. **Independent loads** — can run in parallel. Five today: metaAdData, oracle_actions, library_assets, sheets-trio, generation_history.
2. **Dependent transforms** — must run after their inputs are present. Six today (Phase 3 list above).
3. **Background syncs** — fire-and-forget after first render. Two today: `fetchMetaCreatives`, `fetchMetaAdInsights`.

The most common boot bug: **a transform reads a global before its loader has resolved**. Symptoms: zeros on first load, correct numbers after refresh, no error in console.

### Key code
- `init()` — `index.html:3502` — orchestrator
- `bootPromises` array — `index.html:3556-3597` — the 5 parallel loads
- `Promise.all(bootPromises).then(...)` — `index.html:3599-3702` — the synchronization point
- `_IS_DEPLOYED` gate — `index.html:3690` — production-only background sync

### Dependency graph (read-it-and-go)
```
metaAdData ─┬─→ buildLookupMaps ─┐
            └─→ ad name resolve  │
leadsData ──┴─→ ad name resolve  ├─→ mergeCRMWithMeta ─→ invalidateAdPerfCache ─→ render
costData ────────────────────────┘
oracle_actions ──→ (independent, used by Pause/Make More renderers)
library_assets ──→ renderLibrary
generation_history ──→ Forge tab (lazy)
```

`metaCreatives` (thumbnails) is **NOT** on this graph. It loads in Phase 5 (background, 3s after render) and the UI degrades gracefully via `onerror` handlers.

### Failure modes (verified)
| Symptom | Cause | Fix | Ref |
|---|---|---|---|
| PLA ad performance shows 0 even though leads exist | Ad-ID resolution ran before `metaAdData` populated | Move resolution into `Promise.all().then()`, after metaAdData load | `3f03d91` |
| Tagger view empty on first load, populates on refresh | `taggerData` auto-hydrate fired before `metaAdData` ready | Gate auto-hydrate behind metaAdData length check | current code, `index.html:3661` |
| Boot 404 in console for `oracle_actions` table | Supabase table didn't exist; no error path defined | Created table with idempotent RLS; `loadOracleActions` already swallows 404s | Apr 28 sweep |
| `costData` empty for India + first 7 days of month | India CRM fetch chained AFTER PLA fetch (sequential), if PLA fails it cascades | Chain explicitly so India failure doesn't block subsequent transforms; each `.catch(e => null)` | current pattern, line 3568 |

### Diagnostic protocol
Open console on a fresh load (Cmd+Shift+R) and confirm this exact sequence appears:
```
Boot localStorage: <X>MB — keys: ...
Boot: <N> metaAdData rows
Boot: <N> leads, <N> cost
Boot PLA: +<N> leads, +<N> cost
Boot India CRM: +<N> leads
Boot: <N> generation_history rows from Supabase
Boot: ALL data ready — metaAdData:<N>, leadsData:<N>, costData:<N>
Post-boot ad resolve: <N> from utm_term, <N> from ad ID lookup, <N> empty backfilled, <N> PLA-tagged | total leadsData: <N>
```
Missing any line = that loader threw before logging. Search the codebase for the closest preceding log to find the gap.

### Anti-patterns
- **Don't add a new global without adding its loader to `bootPromises`.** New global = new dependency edge. Free-floating loaders run on first user click and produce flicker bugs.
- **Don't put a transform in Phase 5.** Phase 5 is for non-critical syncs whose failure does not affect any rendered metric. If anything reads from it synchronously, it belongs in Phase 2/3.
- **Don't `await` inside a Phase 2 promise body for another Phase 2 promise.** Use Phase 3 for cross-loader transforms.

---

## SKILL 9: SHEET SCHEMA & COLUMN-RANGE CONTRACT

### What this skill knows
Every Sheets fetch this codebase makes, the exact column range it requests, the columns it depends on, and the silent-failure mode when the sheet is widened past the range. This is the highest-impact infra failure mode in the project's history.

### Mental model
Google Sheets is a **schema-without-types** system. The column range (`A:BW`, `A:O`) is a contract between the sheet owner (humans editing columns) and the dashboard (this code). When a column gets inserted, the range silently truncates, the column doesn't error — it just isn't there. Symptoms: zeros where there should be numbers, no console error.

### Active range contracts
| Fetch | URL | Range | Required columns at edge | Last bumped |
|---|---|---|---|---|
| `fetchSheetData` leads | Main CRM | `leads!A:BW` (75 cols) | `board (ME)` at col 73 (BU) | `cae82f2` Apr 16 (was `A:BG`, India TQL=0) |
| `fetchSheetData` cost | Main CRM | `cost!A:O` (15 cols) | `amount_spent` at col 9 (I) | Apr 16 (was `A:H`, all spend missing) |
| `fetchPLAData` | 4 PLA tabs (PLA_AC, PLA_LP, PLA_LP_AC, EVAL_LP) | tab-specific | `prospectid`, `mx_utm_medium`, `_trialBooked` proxy | stable since Apr 14 |
| `fetchIndiaCRM` | India CRM sheet | `leads!A:Z` | `mx_utm_medium`, `mx_utm_campaign`, `adset` | India has no `mx_utm_adcontent` (verified Apr 28) |
| `fetchSheetAsCsv` | Costs Tracker, Regional, Creator Roster, Library tab fetches | gviz CSV (no range) | varies | Apr 28 — un-stubbed |

### Schema additions over the project lifetime (so we know the shape of the failure)
Reading `git log` is faster than re-grepping but the pattern is: every "India numbers wrong" / "X market silently zero" bug since launch traced back to a column added past our requested range. The sheet owner does not announce schema changes.

### Key code
- `fetchSheetData` — `index.html:4551` — the leads + cost fetch
- `fetchPLAData` — `index.html:4653` — the 4-tab PLA fetch
- `parseSheetValues` — converts Google's matrix-of-arrays into row objects keyed by header
- `fetchIndiaCRM` — see `index.html` near the India parser
- `fetchSheetAsCsv` — `index.html:6202` — gviz CSV fetcher (re-stored Apr 28)

### Failure modes (verified)
| Symptom | Cause | Fix |
|---|---|---|
| India + MEA TQL = 0 across the board | `board (ME)` column inserted at position 73, range was `A:BG` (59) | Range bumped to `A:BW`. Required column position checked at boot. |
| All `amount_spent` zero in cost data | `type` column inserted at G, pushed `amount_spent` to I, range was `A:H` | Range bumped to `A:O`. |
| Costs Tracker / Regional / Creator Roster all silently empty for ~10 days | `fetchSheetAsCsv` was stubbed to `Promise.resolve('')` during a refactor; consumers never errored | Apr 28 — restored implementation. |
| New `data_source` column appears in CRM and breaks no test | Doesn't break anything yet, but if it gets queried by name in a function downstream and isn't in range, silent zero | None — surveillance only. |

### Diagnostic protocol — "is the schema still our schema?"
Run in console (one-time on suspicion):
```js
// Confirm leads schema
console.table(Object.keys(leadsData[0] || {}));
// Confirm boundary column is non-empty
leadsData.filter(r => r['board (ME)']).length;  // expect > 0 for India/MEA leads
costData.filter(r => r.amount_spent > 0).length; // expect > 0
// India CRM presence
leadsData.filter(r => r._source === 'india_crm').length;
```
If `Object.keys` returns fewer than 70 keys for leads or fewer than 12 for cost, the range needs bumping.

### Anti-patterns
- **Don't query a column by string outside `fetchSheetData`/`parseSheetValues`.** That makes the schema dependency invisible to grep. Read the column once at fetch time, alias it onto the row object, then reference the alias.
- **Don't hardcode column letters** (`G`, `H`). The column letter is a function of position; positions move. Use the header name.
- **Don't widen the range "to be safe".** Wider range = wider payload = slower boot. Bump exactly to the column you need + a small buffer (10 cols).

---

## SKILL 10: CACHING LAYERS

### What this skill knows
The four cache surfaces in this codebase, the invalidation rules (or lack thereof) for each, and where stale data has produced visible bugs.

### Mental model
Caches in this app form a **read-down, write-up** stack:
```
Read: compute cache → globals → localStorage → Supabase → Sheets/Meta API
Write: Supabase ← globals ← user action / boot
```
A read miss falls through; a write goes up to Supabase and the global is mutated. localStorage is a read-only fallback for boot-time speed and offline resilience — it is **never** the source of truth, but the dashboard does render from it before live data arrives.

### Key code
- `loadCachedData()` — `index.html:4842` — Phase 1 localStorage rehydrate
- `loadCachedCreatives()` — `index.html:4870` — Phase 1 thumbnails rehydrate
- `_adPerfCache` / `_dailyCache` — `index.html:5502` — compute memoization
- `invalidateAdPerfCache()` — `index.html:5935` — single point of cache busting
- `EVICTABLE_KEYS` — `index.html:2403` — boot-time wipe list
- `_TAXONOMY_VERSION` check — `index.html:2151` — version-keyed tag cache
- `supabaseUpsert` — `index.html:1896` — the write path that should always be paired with a read-back or a global mutation

### Cache surface matrix
| Cache | Key | TTL | Invalidated by | Hot bug history |
|---|---|---|---|---|
| `_adPerfCache` (`getAdPerformance` results) | hash of (dateRange, market, flow) | until filter change | `invalidateAdPerfCache()` called from filter setters, data refresh, manual sync | If a transform mutates `metaAdData` without invalidating, every chart shows pre-mutation numbers |
| `_dailyCache` | same hash | same | same | shares fate with `_adPerfCache` |
| localStorage `gf_*` | key per concern | until eviction | Boot wipes `EVICTABLE_KEYS`; taxonomy version bump wipes `gf_tagCache` | `creative_tags` cache still has "General (BAU/PLA)" tags (taxonomy didn't bump) — open follow-up |
| Supabase `creative_tags` | (ad_name, account) | permanent | manual delete or upsert | Stale "General" rows persist; either force re-parse on boot or wait for natural turnover |
| Supabase `meta_ad_data` | (date, ad_id, account) | permanent | upsert via `fetchMetaAdInsights` | Idempotent — same row written twice is the same row |
| Meta API thumbnails (fbcdn URLs) | URL embedded in `metaCreatives` | 24-48h via signed URL expiry | Re-fetch via `fetchMetaCreatives` | Sessions left open >24h get 403s; `onerror` swaps to grey placeholder |

### Invalidation rules (mostly implicit — write them down here)
1. **Any mutation to `metaAdData`, `leadsData`, `costData`, `state.taggerData`** → `invalidateAdPerfCache()` MUST follow.
2. **Filter change** (date / market / flow / view) → `invalidateAdPerfCache()` MUST follow before the next render.
3. **Taxonomy version bump** (`_TAXONOMY_VERSION`) → automatic localStorage tag-cache wipe at line 2151.
4. **API key change in Settings** → no current invalidation. Soft bug: changing key mid-session keeps stale data until refresh.
5. **Boot** → wipes `EVICTABLE_KEYS` only. localStorage data caches survive (intentional fallback).

### Failure modes (verified)
| Symptom | Cause | Fix |
|---|---|---|
| CPTD changes when nothing changed | `metaAdData` synced via `fetchMetaAdInsights`, no invalidate at end | `invalidateAdPerfCache()` at end of sync (already in place at lines 5093, 5134) |
| "General (BAU/PLA)" tags persist after parser was changed | Supabase tags row wasn't deleted; localStorage cache wasn't bumped | Open: bump `_TAXONOMY_VERSION` to wipe local cache OR force re-parse on boot |
| Thumbnails 403 in left-open tabs | fbcdn URL signed expiry | `onerror` placeholder + `fetchMetaCreatives()` re-fetch on Tagger view open. Permanent storage was rejected as overkill (Apr 28). |
| User changes API key, dashboard still shows old data | No invalidation hook on Settings save | Open — low priority |

### Diagnostic protocol
```js
// Confirm cache key sanity
_adPerfCache.key;  // e.g., "all|all|2026-04-01|2026-04-28"
_adPerfCache.data.length;
// Force re-compute
invalidateAdPerfCache(); render();
// Wipe Supabase tag cache for one ad (manual fix)
await supabaseDeleteRow('creative_tags', 'ad_name', '<exact ad name>');
// Inspect what's in localStorage
Object.keys(localStorage).filter(k => k.startsWith('gf_')).map(k => [k, localStorage.getItem(k).length]);
```

### Anti-patterns
- **Don't add a new compute cache** that isn't routed through `invalidateAdPerfCache()`. Every cache needs a single bust point or it grows into a stale-data farm.
- **Don't write to localStorage outside the established `gf_*` namespace.** Stray keys won't get evicted and bloat boot-time scan.
- **Don't trust `metaCreatives` URLs across reloads.** Always re-fetch when the data is older than 24h.
- **Don't read from Supabase mid-render.** Renders are sync; Supabase is async. Read at boot, mutate via user actions, never inline.

---

## SKILL 12: RECOMMENDATION FEEDBACK LOOP

### What this skill knows
The architecture for closing the loop between recommendations the dashboard emits (Pause Now / Make More / Deploy) and what actually happened. This skill is **not yet implemented** — it documents the design so the next session can ship it consistently.

### Mental model
Today the recommendation system is **one-direction**:
```
data → classifier → card → user action (sometimes) → ???
```
There's no record of what was recommended, no attribution of outcomes back to the recommendation, and no decay on recs that consistently fail. The skill is to design a **bidirectional log** that:
1. Writes a row when a card is rendered (debounced daily — same card same day = one row).
2. Reads outcome via a nightly scan (was the ad paused? did the audience get a new ad? did CPTD improve?).
3. Decays the classifier signal for failed recs (e.g., if Make More on an audience produced no new winners 3x in a row, deprioritize that adjacency in `_findAdjacentAudience`).

### Proposed schema (Supabase `recommendation_log`)
```sql
CREATE TABLE recommendation_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type       text NOT NULL,                    -- 'pause_now' | 'make_more' | 'deploy' | 'refresh' | 'influencer_scale' | 'influencer_pause' | 'market_health'
  signal          text,                             -- e.g. 'burn', 'cptql_leak', 'wrong_audience' (Pause Now); 'tier1_proven', 'tier2_emerging' (Make More)
  item_id         text NOT NULL,                    -- ad_name | audience cluster id | creator handle
  market          text,                             -- 'US' | 'India' | 'AUS' | 'MEA' | 'UK' | 'all'
  flow            text,                             -- 'bau' | 'pla' | 'all'
  rendered_at     timestamptz DEFAULT now(),
  metrics_at_render jsonb,                          -- spend, td, ql, cptd, cptql at the moment of render
  why             text,                             -- the Why string we showed
  action          text,                             -- the recommended action
  -- Outcome fields (populated by nightly scan):
  outcome_status  text,                             -- 'followed' | 'ignored' | 'partial' | 'unknown'
  outcome_metrics jsonb,                            -- spend/td/ql snapshot 7-14d after render
  outcome_at      timestamptz,
  decay_score     float DEFAULT 0                   -- bumped by failed outcomes, read by classifier
);
CREATE INDEX recommendation_log_item_idx ON recommendation_log (item_id, card_type, rendered_at DESC);
CREATE INDEX recommendation_log_outcome_idx ON recommendation_log (outcome_status, rendered_at DESC) WHERE outcome_status IS NULL;
```

### Write hook (sketch)
```js
// One helper, called from each renderer with debouncing:
async function logRec({card_type, signal, item_id, market, flow, metrics, why, action}) {
  const todayKey = `${card_type}:${item_id}:${new Date().toISOString().slice(0,10)}`;
  if (window.__recLogged?.has(todayKey)) return;     // in-memory dedupe
  (window.__recLogged ||= new Set()).add(todayKey);
  await supabaseUpsert('recommendation_log', [{
    card_type, signal, item_id, market, flow,
    metrics_at_render: metrics, why, action
  }], 'card_type,item_id,rendered_at');
}
```
Renderers to instrument:
- `_renderPauseNow` (6 signal types) — `index.html` ~Pause Now block
- `_renderMakeMoreAds` — line ~9216
- `_renderDeployList`
- `_renderInfluencerScaling` (Scale Up + Pause Down)
- `_renderMarketHealth` (per-market verdicts)

### Outcome scan (nightly, run from Forge or a manual button)
Pseudo:
```
For each row WHERE outcome_status IS NULL AND rendered_at < now()-7d:
  Look up current metrics for item_id (uses getAdPerformance, getAudiencePerformance, etc.)
  Compare current vs metrics_at_render:
    - If card_type='pause_now' and ad now isPaused() or spend dropped 80%+ → 'followed'
    - If card_type='make_more' and a new ad in suggested audience appeared with > tier2 metrics → 'followed'
    - Else → 'ignored' (with optional 'partial' if directionally aligned)
  Bump decay_score on classifier hash for ignored 'ignored' rows
  UPDATE row
```

### Read hook (decay in classifier)
`_classifyWinner(ad)` becomes:
```js
const decay = await getDecayScore(ad);  // sum of decay_score over last N rendered rows for this ad's hash
if (decay > THRESHOLD) tier = downgradeTier(tier);
```

### Key code locations to instrument (when shipping)
- `_renderMakeMoreAds` — `index.html:9300` area
- `_renderPauseNow` (signal switch) — Pause Now block
- `oracleAction()` / `oracleSaveNote()` — `index.html:8062` — already a write hook for user-triggered outcomes; recommendation_log is the **automatic** counterpart

### Failure modes (anticipated — write before shipping so we recognize them)
| Symptom | Cause | Mitigation |
|---|---|---|
| recommendation_log table grows fast | Every card render writes a row | Debounce by `(card_type, item_id, day)` (sketch above). Expect ~50-200 rows/day. Index on `rendered_at` for cheap pruning. |
| Outcome scan misclassifies "followed" because ad got paused for unrelated reason | Pause-state is global, not per-rec | Only credit "followed" if pause happened within ~3 days of render |
| Decay score over-suppresses an audience that recovered | Stale decay never decays itself | Apply exponential decay on decay_score with 30-day half-life |

### Anti-patterns
- **Don't write a row per render call** — debounce per day per item.
- **Don't read decay synchronously in the render hot path** — preload decay scores at boot into a global map; reads are O(1).
- **Don't promote "followed" to the user as a vanity metric** until outcome attribution is validated against ≥4 weeks of data.

### Estimated effort
~3 hours: 1h schema + writeRow helper + debounce, 1h instrument 5 renderers, 1h nightly scan + decay read in `_classifyWinner`. Listed as top "what's not done" in `project_current_state.md`.

---

## SKILL 14: ERROR OBSERVABILITY & DIAGNOSTICS

### What this skill knows
Where errors get swallowed, where they surface, what the existing diagnostic surfaces are, and the protocol for adding new ones without polluting the console.

### Mental model
This app's error story is **swallow-and-log**: every async path has a `.catch(e => console.warn(...))` so a single load failure doesn't take down the boot. That's correct for resilience, but it means errors don't bubble to the user — they sit in the console waiting for someone to look.

The diagnostic story is **ad-hoc globals**: `window.__unclassifiedCampaigns`, console.table dumps, occasional `console.log`s. There's no structured surface that captures "what went wrong this session" in one place.

### Existing surfaces
| Surface | What it captures | Where |
|---|---|---|
| `console.warn` | Supabase + Sheets + Meta API errors | Throughout: `supabaseGet/Upsert/DeleteAll/DeleteRow`, `loadLibraryFromSupabase`, etc. |
| `console.error` | Boot-loader exceptions per source | `index.html:3558-3595` |
| `console.log` (boot trace) | Phase progress | See Skill 8 diagnostic |
| `window.__unclassifiedCampaigns` (Set) | Campaign names the parser couldn't classify | `index.html:2100` |
| `data-status-line` (UI) | Last successful data load timestamp + counts | `updateDataStatusLine()` |
| `bootLoader` overlay | Visual signal that boot is in flight | `index.html:3543` |

### Proposed: `window.__diag` — a single structured surface
```js
window.__diag = {
  errors: [],          // {source, message, ts, context}
  warnings: [],        // same shape
  unclassified: new Set(),
  schemaCounts: {},    // {leads: 75, cost: 15, india: 25, ...} captured at boot
  cacheHits: {adPerf: {hit:0, miss:0}, daily: {hit:0, miss:0}},
  rendered: [],        // (card_type, count) per render — feeds Skill 12
  push(level, source, message, context) {
    const entry = {source, message, ts: Date.now(), context};
    (level === 'error' ? this.errors : this.warnings).push(entry);
    if (this.errors.length + this.warnings.length > 500) {
      // ring buffer
      this.errors.splice(0, 100);
      this.warnings.splice(0, 100);
    }
    console[level](`[${source}]`, message, context || '');
  }
};
```
Adoption rule: replace `console.warn('X error:', e.message)` with `window.__diag.push('warn', 'X', e.message, {stack: e.stack})`. Existing console output is preserved (still readable in DevTools); the structured copy enables a "Show diagnostics" panel.

### Diagnostic Panel (lightweight, off by default)
Triggered by `Cmd+Shift+D` or a hidden button in Settings. Renders:
- Last 20 errors + warnings (clickable to copy stack)
- Schema counts vs. expected
- Cache hit rate
- Unclassified campaigns (with copy-all)
- Storage byte usage
- Boot timing (Phase 1/2/3/5 wall-clock)

This is **not** Sentry. It's a 100-line UI on top of `window.__diag` for the 5-person internal team.

### Failure modes (existing — what observability would have caught earlier)
| Symptom | Time to root-cause | What `window.__diag` would have shown |
|---|---|---|
| `oracle_actions` 404 at boot, ignored for ~10 days | 10 days | First-page error: "Boot oracle: relation oracle_actions does not exist" |
| `fetchSheetAsCsv` returning empty for 4 consumers | ~10 days | Schema panel: Costs Tracker = 0 rows (vs expected ~308) |
| Make More winner with 100% conv (3 TDs from 3 QLs) | 1 day (user caught) | Render panel: a "tier1" with TD=3 sample size — pre-Phase-7 classifier didn't know that was suspicious |
| Stale "General (BAU/PLA)" tags | ongoing | Unclassified panel would show count not zero post-parser-change |

### Anti-patterns
- **Don't add a new `console.log` without a source prefix.** Searching for `[Boot]`, `[Tagger]`, `[Supabase]` is how you find anything.
- **Don't `alert()` errors.** They block the boot for a single failure.
- **Don't catch and re-throw.** Either handle (fallback) or let it bubble. Re-throwing in an async chain duplicates the log.
- **Don't reference `window.__diag` in render hot paths** — the push helper does ~3 ops per call; ringbuffer trim is amortized.

### Diagnostic protocol — "what broke this session?"
```js
// Top of console
window.__diag.errors.slice(-10);
window.__diag.warnings.slice(-20);
window.__diag.schemaCounts;
window.__diag.cacheHits;
[...window.__diag.unclassified].sort();
```
If `window.__diag` doesn't exist yet (pre-Skill-14-shipped), fall back to:
```js
// Pre-skill: scan recent console output manually + check known surfaces
window.__unclassifiedCampaigns && [...window.__unclassifiedCampaigns];
_adPerfCache.key, _adPerfCache.data.length;
leadsData.length, costData.length, metaAdData.length;
```

### Estimated effort
~2 hours: 30min `window.__diag` + ringbuffer, 30min sweep of console.warn/error sites to push to diag, 1h optional Diagnostic Panel UI.

---

## RELATIONSHIP TO ORIGINAL 7

| Original skill | This file extends with |
|---|---|
| 1 Data Engineering | Skill 9 (schema contract surface) + Skill 8 (boot order) |
| 2 QA/Debugging | Skill 14 (structured diag surface beats `console.warn` greppage) |
| 3 Tagging | Skill 10 (cache invalidation rule for stale tag rows) |
| 4 Meta API | Skill 8 (background sync phase), Skill 10 (thumbnail expiry) |
| 5 Agent Architecture | Skill 12 (recommendation_log is the missing feedback edge) |
| 6 Supabase Patterns | Skill 10 (read-down/write-up rule), Skill 12 (new table schema) |
| 7 UI Patterns | Skill 14 (diagnostic panel as a new UI pattern) |

## NOT IN THIS FILE (deferred, with reason)

- **Skill 11 — Cloudflare Pages deploy & secrets.** Deploy is stable, no documented incidents. Write when first incident happens.
- **Skill 13 — Single-file performance.** No measured pain (boot under 5s on cached path). Write when render time on filter change exceeds 500ms or boot exceeds 10s.
