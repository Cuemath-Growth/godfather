# Intelligence Chassis — Master Spec

*Path C: shared module powering both Godfather (Meta) and Google Creative Dashboard.*
*Locked Apr 28, 2026. Timeline: 6 weeks at ~4 working days/wk.*

---

## Decisions resolved (Apr 28)

| # | Decision | Resolution |
|---|---|---|
| 1 | Where shared code lives | **Same git repo as Godfather**, in `~/Documents/Brain/godfather/shared/`. Deploys with same Cloudflare project. |
| 2 | Outcome tracking storage | **Existing Cuemath Supabase project** (same one Godfather uses). Add 2 tables: `recommendation_log` + `recommendation_dismissals`. |
| 3 | Brand keyword list | **PENDING USER INPUT.** Naina to confirm/extend list. Starter: cuemath, cue math, mathfit + competitors (Kumon, Mathnasium, Sylvan, Khan Academy, Outschool, Brighterly, Splash Math, Mathletics). Needed by Week 5. |
| 4 | Severity weighting per market | **PENDING USER INPUT.** Either rough ABVs per market OR confirm flat "US 3× / others 1×" rule. Needed by Week 1. Default fallback if no answer: flat US 3×. |
| 5 | Out-of-scope features | **Confirmed dropped:** ML anomaly detection, predictive forecasting, Slack alerts, mobile UI. |
| 6 | Migration cutover style | **Hybrid.** Soft (parallel) cutover for first 2-3 verdicts; hard cutover for the rest after pattern proven. |
| 7 | Settings toggle "Action Queue (beta) / Legacy cards" | **Yes**, in Settings panel. Removed after all migrations complete (~Week 5). |
| 8 | Timeline | **6 weeks full plan** (no MVP cut). |

---

## What goes in the chassis vs. per-tool

| Capability | Shared chassis | Godfather only | Google only |
|---|:---:|:---:|:---:|
| Action queue (unified ranked surface) | ✅ | | |
| Per-card signal contract | ✅ | | |
| Severity × confidence × effort scoring | ✅ | | |
| Outcome tracking + nightly measurement | ✅ | | |
| Dismissal memory (snooze/skip/never-again) | ✅ | | |
| "Why now?" engine (24h/72h diff) | ✅ | | |
| Universal guardrails contract | ✅ | | |
| Per-market threshold config pattern | ✅ | | |
| Market priority weighting | ✅ | | |
| Cohort maturity gating | ✅ | | |
| Volume floor gating | ✅ | | |
| `_PARSER_VERSION` cache invalidation | ✅ | | |
| Match-rate measurement at boot | ✅ | | |
| Data-health gates display | ✅ | | |
| BAU vs PLA flow toggle | ✅ | | |
| Canonical `lead_type` BAU/PLA detection | ✅ | | |
| Refresh-don't-Pause for historical winners | ✅ | | |
| Brand vs Non-Brand toggle | | | ✅ |
| Quality Score components | | | ✅ |
| Impression Share lost-to-budget vs lost-to-rank | | | ✅ |
| Search terms / negative keyword workflow | | | ✅ |
| Auction Insights | | | ✅ |
| RSA asset performance labels | | | ✅ |
| PMax channel-mix breakdown | | | ✅ |
| Creative thumbnails grid (Lens) | | ✅ | |
| AUDIENCE_FAMILIES adjacency | | ✅ | |
| 14-field tag taxonomy | | ✅ | |
| Influencer attribution | | ✅ | |
| Tag definitions modal | | ✅ | |

Shared module ≈ 2,000 lines. Per-tool = verdict catalog + data adapters + tool-specific renderers.

---

## Architecture

```
~/Documents/Brain/godfather/
├── shared/
│   ├── cuemath-data.js              # ~1,500 lines — extracted from index.html
│   └── cuemath-intelligence.js      # ~2,000 lines — chassis
├── index.html                       # Godfather (Meta) — uses shared + Meta verdicts
├── google.html                      # Google Creative Dashboard — uses shared + Google verdicts
├── google-csv-ingest.js             # Drive folder reader, 6-report parser
├── CHANGELOG.md
└── 02-skills/
    ├── google-intelligence-skills.md
    └── intelligence-chassis-spec.md   # this file
```

Single Cloudflare project. Shared modules versioned via filename hash (`cuemath-intelligence.v1.js`). Both tools pin a version.

---

## Chassis API — verdict contract

```javascript
registerVerdict({
  id: 'meta_pause_cptd_leak',
  channel: 'meta',
  tool: 'godfather',
  detect: (data, context) => [
    {
      entity_type: 'ad',
      entity_id: '120214567890',
      market: 'US',
      signal: 'CPTD ₹89K vs market amber ₹70K, 14d cohort',
      why: '12 TDs from 380 QLs (3.2% conv) at ₹89K CPTD. Spend ₹1.07M/14d.',
      raw_metrics: { cptd: 89000, td: 12, ql: 380, spend: 1070000 },
    }
  ],
  scoreSeverity: (signal) => signal.raw_metrics.spend / 14,
  scoreConfidence: (signal) => {
    if (signal.raw_metrics.td < 5) return 'LOW';
    if (signal.cohort_age_days < 14) return 'LIKELY';
    return 'CONFIDENT';
  },
  scoreEffort: (signal) => '1_CLICK',
  guardrails: [
    'cohort_matured', 'volume_floor', 'not_recently_dismissed',
    'brand_defense_exception', 'market_priority_check', 'historical_winner_check'
  ],
  whyNow: (signal, history) => ({
    last_24h: { spend_delta: '+₹45K', cptd_delta: '+₹12K' },
    last_72h: { /* ... */ },
    config_changes: []
  }),
  action: {
    label: 'Pause ad',
    type: 'direct_link',
    handler: (signal) => `https://business.facebook.com/.../${signal.entity_id}`,
  },
  outcomeMetric: 'spend_avoided_inr',
  outcomeWindow: 21,
});
```

Chassis handles: detection loop, guardrail enforcement, scoring → ranking, Supabase logging, dismissal tracking, Action Queue render, nightly outcome measurement, decay of patterns where outcome consistently null.

**Design principles:**
- Verdicts declare guardrails by name; chassis runs them. One place to add a new guardrail.
- Severity is per-verdict (no universal formula); chassis normalizes to 0-100 for ranking.
- Confidence is 3 buckets: CONFIDENT / LIKELY / LOW.
- Effort is 3 buckets: 1_CLICK / 5_MIN / INVESTIGATE.
- `whyNow` optional but encouraged.

---

## Supabase schema

```sql
CREATE TABLE recommendation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_id text NOT NULL,
  tool text NOT NULL,
  channel text,
  entity_type text,
  entity_id text,
  market text,
  signal jsonb,
  severity_score numeric,
  confidence text,
  effort text,
  priority numeric,
  guardrails_passed text[],
  recommended_at timestamptz NOT NULL DEFAULT now(),
  acted_at timestamptz,
  dismissed_at timestamptz,
  dismiss_reason text,
  outcome_measured_at timestamptz,
  outcome_value numeric,
  outcome_status text,
  status text NOT NULL DEFAULT 'pending'
);
CREATE INDEX ON recommendation_log (verdict_id, status);
CREATE INDEX ON recommendation_log (entity_type, entity_id, dismissed_at);
CREATE INDEX ON recommendation_log (recommended_at);

CREATE TABLE recommendation_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict_id text,
  entity_type text,
  entity_id text,
  market text,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  reason text
);
CREATE INDEX ON recommendation_dismissals (verdict_id, entity_id, expires_at);
```

Nightly Edge Function: for `acted` rows where `acted_at < now() - outcomeWindow`, re-run `measureOutcome()`, write `outcome_value`/`outcome_status`. Weekly: per `verdict_id`, if acted ≥10 AND positive <30%, alert "verdict needs recalibration".

---

## Action Queue UI (the new top-level surface)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎯 Action Queue              All ▾  US ▾  All Verdicts ▾  ☰ Sort │
│ Today: 14 actions · ₹2.3L/wk at stake · 8 acted · 3 dismissed    │
├──────────────────────────────────────────────────────────────────┤
│ 🔴 ₹85K/wk · CONFIDENT · 1-CLICK                                  │
│ Pause: USA_PFX_FB_..._Adv+Audience_Static_Y-Hindi_300925         │
│ Why: ₹89K CPTD vs ₹70K market amber, 12 TDs/14d cohort           │
│ Why now: spend up 67% over last 7d, performance label dropped     │
│ Guardrails: cohort matured ✓ volume ≥25K ✓ not historical winner ✓│
│ [▶ Pause Ad]  [Snooze 24h]  [Skip 7d]  [Wrong recommendation]    │
└──────────────────────────────────────────────────────────────────┘
```

- Filter: tool / market / verdict_type / severity threshold
- Sort: priority (default), severity, confidence, recency, effort
- Bulk actions: "Apply all 1-CLICK + CONFIDENT" with confirmation
- Outcome stats in header (transparency)
- Top-N-per-market interleaving (so India signals don't get drowned by US — replaces flat 3× US weighting)
- ≤7 cards above the fold; "Show N more" expands

---

## 6-week phasing (day-level)

| Week | Day | Ships |
|---|---|---|
| 1 | 1-2 | Extract `cuemath-data.js` from `index.html`, validate Godfather parity |
| 1 | 3-5 | Chassis core: `registerVerdict`, scoring, queue render skeleton, `_PARSER_VERSION` |
| 2 | 1 | Supabase schema (both tables), outcome measurement job (placeholder) |
| 2 | 2 | Dummy "hello world" verdict end-to-end validation |
| 2 | 3-4 | First real verdict migration: `meta_pause_cptd_leak` (parallel-build with old card) |
| 2 | 5 | Validate parity, deprecate old CPTD card |
| 3 | 1-2 | Migrate 2 remaining Pause verdicts (`meta_pause_cptql_leak`, `meta_pause_wrong_audience`) |
| 3 | 3-4 | Migrate 3 Scale/Refresh verdicts (Tier 1/Tier 2/Refresh) |
| 3 | 5 | Migrate Market Health verdicts |
| 4 | 1 | Migrate Funnel Leak + Influencer attribution alerts |
| 4 | 2 | `_filterLeadsByFlow` switch to canonical `lead_type` column |
| 4 | 3 | `_PARSER_VERSION` boot logic to invalidate stuck "General" tags |
| 4 | 4-5 | Google CSV ingest layer (Drive folder read + 6-report parser) |
| 5 | 1-2 | Google Phase 0 data-health gates measured against first day's upload |
| 5 | 3-4 | Google verdict 1: Add Negative end-to-end |
| 5 | 5 | Google verdicts 2-3: Pause Keyword + Brand Health |
| 6 | 1-2 | Google verdicts 4-5: Reallocate Budget + Cannibalization |
| 6 | 3 | Google verdicts 6-8: Scale Up + Refresh |
| 6 | 4 | Google verdicts 9-13: Theme Expansion + Geo + LP + Audience Saturation + Pollinate to Meta + Tracking Health |
| 6 | 5 | Final cleanup, outcome wiring, verdict-recalibration audit, remove Settings toggle |

**Total: ~24 working days = 6 calendar weeks at 4 days/week.**

Outer-bound risks could push to 8 weeks if M2 (first real migration) reveals chassis design flaw, or Google CSV ingest fights us, or existing Godfather verdict logic is more entangled than grep suggests.

---

## Godfather verdicts to migrate (the migration list)

| Today | Future verdict id |
|---|---|
| Pause Now Signal 1 (CPTQL Leak) | `meta_pause_cptql_leak` |
| Pause Now Signal 2 (CPTD Leak) | `meta_pause_cptd_leak` (FIRST migration) |
| Pause Now Signal 3 (Wrong Audience) | `meta_pause_wrong_audience` |
| Make More Tier 1 (Proven) | `meta_scale_tier1_winner` |
| Make More Tier 2 (Emerging) | `meta_scale_tier2_winner` |
| Refresh (was-a-winner) | `meta_refresh_fatigued_winner` |
| Market Health row alerts | `meta_market_health_alert` |
| Funnel waterfall ethnicity leak | `meta_funnel_leak` |
| Asian audience underperformance | (rolls into `meta_market_health_alert`) |
| Influencer match drops | `meta_influencer_attribution_alert` |

10 verdicts total. ~1-2 days each in chassis migration.

---

## Anti-scope (refused)

| Refused | Why |
|---|---|
| ML-based anomaly detection | Statistical thresholds + cohort maturity catch 90% of value |
| Real-time streaming | Daily refresh is enough |
| Multi-user collaboration (assignments, comments) | 5 people; Slack works |
| Slack/email integrations | Add later if asked |
| Generative explanations beyond template-based "Why now" | Templates work and are debuggable |
| Forecasting / "what if I do X" simulation | Quantified Reallocate Budget is enough |
| User-defined custom verdicts | Lock the catalog; additions via design review |
| Mobile UI | Desktop only |
| A/B testing of recommendation strategies | Comes later if outcome data warrants |

---

## Pending user inputs (block specific phases, not the start)

| # | Input | Blocks | Default if not provided |
|---|---|---|---|
| 3 | Brand keyword list confirmation | Week 5 (Google Add Negative verdict) | Use starter list above; risk of recommending brand terms as negatives |
| 4 | ABVs per market OR "use flat US 3×" | Week 1 (chassis severity scoring) | Top-N-per-market interleaving with flat US weighting |

---

## Outcome tracking — honest expectations

- Logging starts day 1 (Week 2).
- First measurable outcomes arrive ~Week 5 (21 days after first acted recommendation).
- Verdict recalibration ("decay patterns that don't move metrics") meaningful by Week 12+.
- UI doesn't show outcome stats until N≥10 measurements per verdict.
- Don't promise "feedback loop" benefits in the first 8 weeks.

---

## Risks tracked

| Risk | Mitigation |
|---|---|
| First verdict migration (Wk 2) reveals chassis design flaw → redesign | M0c includes 1 dummy verdict that exercises all chassis features end-to-end before M2 |
| Google CSV ingest fights us (date format, column drift) | Verify column structure with first real upload before parser is locked |
| Outcome measurement edge cases (campaigns paused mid-window) | Conservative: skip measurement if entity status changed during window |
| Existing Godfather verdict logic more entangled than grep suggests | Parallel-build for first 2-3 catches surprises; hybrid cutover protects |
| Brand-defense list incomplete → tool recommends adding brand as negative | Human-in-loop for Add Negative v1 (no bulk-apply, single-row review) |
| Action Queue with 50+ items overwhelms | First-screen ≤7 cards; verdict-type filter; "Today's actions" header |
