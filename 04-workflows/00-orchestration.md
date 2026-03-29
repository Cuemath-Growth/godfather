# Orchestration & Data Flow

## How the Four Agents Work Together — Step by Step

This document defines the exact sequence of operations when Godfather runs.

---

## Workflow 1: Fresh Data Import

**Trigger:** User uploads CSV or triggers Meta/Google API sync.

```
Step 1 │ DATA IN
       │ User uploads CSV or API sync fires
       ▼
Step 2 │ SENTINEL runs
       │ → Invokes: Data Ingestion → Funnel Mapping → Threshold Scoring → Anomaly Detection
       │ → Writes: sentinel_output.json
       │ → Contains: per-row metrics, top 5, bottom 5, anomalies, funnel summary
       ▼
Step 3 │ LENS runs (auto-triggered after Sentinel completes)
       │ → Reads: sentinel_output.json
       │ → Invokes: Creative Tagging → Pattern Correlation → Fatigue Detection → Brief Generation
       │ → Writes: lens_output.json
       │ → Contains: winning/losing signals, fatigue alerts, format mix, creative briefs
       ▼
Step 4 │ ORACLE runs (auto-triggered after Lens completes)
       │ → Reads: sentinel_output.json + lens_output.json + forge_output.json (if exists)
       │ → Invokes: Cross-Signal Synthesis → Prioritisation → Action Formatting
       │ → Writes: oracle_digest.json
       │ → Contains: 3–5 prioritised insights, headline, actions, pipeline status
       ▼
Step 5 │ DASHBOARD RENDERS
       │ → Tab 0 (Dashboard): renders oracle_digest.json
       │ → Tab 1 (Performance): renders sentinel_output.json
       │ → Tab 2 (Creative Audit): renders lens_output.json
```

**Total time estimate:** ~15–30 seconds for a typical month's data (100–500 ad rows).

---

## Workflow 2: Content Generation

**Trigger:** User opens Tab 3 (Content Studio) and submits a brief or freeform request.

```
Step 1 │ BRIEF IN
       │ User completes 5-step wizard OR types freeform request
       ▼
Step 2 │ FORGE activates
       │ → Invokes: Brief Interpretation (if freeform)
       │ → Reads: lens_output.json (winning signals, recommended hooks)
       │ → Reads: sentinel_output.json (top performers for grounding)
       │ → Invokes: Copy Generation / Script Writing / Image Prompting
       │ → Invokes: Brand Validation (auto-gate before output)
       │ → Invokes: Channel Adaptation (format for target channel)
       ▼
Step 3 │ OUTPUT DISPLAYED
       │ → Headlines, body copy, CTA, "why this works"
       │ → User can: Copy, Refine (inline), Regenerate, Export
       ▼
Step 4 │ FORGE LOGS
       │ → Appends to forge_output.json:
       │   - generation_id, brief, outputs, timestamp
       │   - Later: deployment status, performance feedback
       ▼
Step 5 │ ORACLE reads updated forge_output.json on next refresh
       │ → Surfaces: "6 creatives generated, 2 deployed, 0 performance data yet"
```

---

## Workflow 3: Dashboard Refresh

**Trigger:** User opens Tab 0 (Dashboard) or manually refreshes.

```
Step 1 │ ORACLE checks data freshness
       │ → Reads timestamps from sentinel_output, lens_output, forge_output
       │ → If sentinel data > 48 hours old: flag "stale data" warning
       ▼
Step 2 │ ORACLE synthesises
       │ → Combines latest state from all three agents
       │ → Produces: headline, 3–5 insights, actions, pipeline status, metric ticker
       ▼
Step 3 │ DASHBOARD RENDERS
       │ → Insight cards (priority-ordered)
       │ → Win/loss summary table
       │ → Metric ticker (CPQL trend, CPTD trend, spend efficiency, QL volume)
       │ → Pipeline status bar
       │ → Anomaly alerts (if any)
```

---

## Workflow 4: Refinement Loop

**Trigger:** User clicks "Refine" on a generated copy block.

```
Step 1 │ USER FEEDBACK
       │ → Types refinement instruction OR selects contextual chip
       │ → Chips: "More urgent" / "Softer CTA" / "Add social proof" / "Shorten"
       ▼
Step 2 │ FORGE re-runs
       │ → Original output + refinement instruction → Claude API
       │ → Previous version preserved as v1; new output = v2
       │ → Brand Validation gate re-runs on v2
       ▼
Step 3 │ VERSION DISPLAY
       │ → User sees v1 and v2 side by side (or toggled)
       │ → Can lock preferred version, continue refining, or export
```

---

## Workflow 5: Performance Feedback Loop (Phase 3)

**Trigger:** User marks a deployed creative's performance in Forge.

```
Step 1 │ USER TAGS
       │ → Marks Forge-generated creative as: "Deployed" / "Won" / "Dropped"
       │ → Optionally attaches performance metrics
       ▼
Step 2 │ FORGE LOG UPDATES
       │ → forge_output.json updated with deployment status + performance
       ▼
Step 3 │ LENS incorporates
       │ → Next Lens run includes Forge-generated creatives in its analysis
       │ → Correlates: did Forge's data-grounded approach outperform legacy creatives?
       ▼
Step 4 │ ORACLE surfaces
       │ → "Forge-generated statics have 30% lower CPQL than legacy statics this month"
       │ → OR: "Forge recommendations underperformed — review hook selection"
```

---

## Agent Communication Summary

```
┌──────────┐    writes     ┌──────────────────┐
│ SENTINEL ├──────────────►│sentinel_output.json│
└────┬─────┘               └────────┬─────────┘
     │                              │
     │ triggers                     │ read by
     ▼                              ▼
┌──────────┐    writes     ┌──────────────────┐
│   LENS   ├──────────────►│ lens_output.json  │
└──────────┘               └────────┬─────────┘
                                    │
                                    │ read by
                                    ▼
┌──────────┐    writes     ┌──────────────────┐
│  FORGE   ├──────────────►│forge_output.json  │
└──────────┘               └────────┬─────────┘
                                    │
     ┌──────────────────────────────┘
     │ reads all three
     ▼
┌──────────┐    writes     ┌──────────────────┐
│  ORACLE  ├──────────────►│oracle_digest.json │
└──────────┘               └──────────────────┘
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Sentinel receives malformed CSV | Reject with error message listing invalid rows. Never partially process. |
| Lens can't access creative files | Tag with `confidence: "inferred"`. Never invent visual attributes. |
| Forge generates copy that fails Brand Validation | Auto-regenerate (up to 3 attempts). If still failing, return partial output with violation notes. |
| Oracle finds stale data (>48 hrs) | Display insights with prominent "⚠️ Based on data from [date]" banner. |
| API rate limit hit | Queue and retry with exponential backoff. Show "syncing" state in UI. |

---

## See Also

- [[01-agents/00-agent-architecture|Agent Architecture]]
- [[01-agents/04-oracle|Oracle — the orchestration hub]]
- [[03-guardrails/00-master-guardrails|Master Guardrails]]
