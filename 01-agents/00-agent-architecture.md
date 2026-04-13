# Agent Architecture — How the Four Agents Work Together

## System Design Principle

Godfather is **not** four independent tools sharing a UI. It's an **agent mesh** — each agent produces structured outputs that become inputs for others. The Master Agent (Oracle) is the orchestration layer that reads from all three domain agents and synthesises a unified intelligence view.

---

## Agent Hierarchy

```
                    ┌─────────────┐
                    │   ORACLE    │  ← Master Insights Agent
                    │  (Tab 0)   │     Reads from all three agents
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐ ┌───────▼──────┐
     │  SENTINEL   │ │  LENS   │ │    FORGE     │
     │ Performance │ │ Creative│ │   Content    │
     │  (Tab 1)    │ │  Audit  │ │   Studio     │
     │             │ │ (Tab 2) │ │   (Tab 3)    │
     └──────┬──────┘ └────┬────┘ └───────┬──────┘
            │              │              │
     Meta Ads API    Creative Assets   Claude API
     Google Ads API  + Sentinel data   + Gemini
     CSV upload                        + Lens insights
```

---

## Data Flow Between Agents

### Sentinel → Lens
Sentinel passes structured performance data to Lens so that creative analysis is grounded in actual funnel metrics, not just visual impressions.

**What flows:**
- Campaign/ad set/ad hierarchy preserved (never aggregated)
- Fatigue Detection: When the frequency of an ad creative at an ad level reaches more than 2 in the last 30 days, it will considered as a Fatigue creative or ad. 
- Audience segment performance per creative - We will run our creative across different campaigns. Different campaigns will have different targeting and ads. We need to build a mechanism to understand which audience segment i.e. targeting parameter responds to which type of creative the best. 
- Pick all metrics from the main project file as defined. 

### Sentinel → Forge
Sentinel passes "what's working" signals so Forge can generate copy informed by real data.

**What flows:**
- Top 5 / bottom 5 creatives with full metric context
- Winning audience + format combinations
- Seasonal performance patterns (which months, which hooks)

### Lens → Forge
Lens passes decoded creative intelligence so Forge produces copy that replicates winning patterns.

**What flows:**
- Winning hooks (first 3 seconds / headline patterns)
- Colour/visual patterns correlated to performance
- Format recommendations (static vs video, aspect ratios)
- Pain point / benefit frames that convert
- Anti-patterns to avoid (hooks/formats that consistently fail)

### All Three → Oracle
Oracle reads the latest state from all three agents on every dashboard refresh.

**What flows from Sentinel:** Funnel health summary, anomaly flags, spend efficiency
**What flows from Lens:** Top creative patterns, fatigue alerts, format mix recommendations
**What flows from Forge:** Recent generation history, which generated content has been deployed and how it performed (feedback loop)

---

## Agent Communication Protocol

Agents don't call each other in real time. They write to a shared data layer.

```
┌─────────────────────────────────────────────┐
│              SHARED DATA LAYER              │
│                                             │
│  sentinel_output.json   ← Sentinel writes   │
│  lens_output.json       ← Lens writes       │
│  forge_output.json      ← Forge writes      │
│  oracle_digest.json     ← Oracle reads all   │
│                           three + writes     │
└─────────────────────────────────────────────┘
```

Each agent writes a structured JSON output after every run. Oracle reads all three on refresh and produces the dashboard digest.

---

## Refresh Cadence

| Agent | When it runs |
|---|---|
| Sentinel | On data import (CSV upload or API sync) |
| Lens | After Sentinel completes (needs performance data) |
| Forge | On-demand (user triggers generation) |
| Oracle | On every dashboard tab load (reads latest outputs) |

---

## See Also

- [[01-agents/01-sentinel|Sentinel — Performance Agent]]
- [[01-agents/02-lens|Lens — Creative Audit Agent]]
- [[01-agents/03-forge|Forge — Content Studio Agent]]
- [[01-agents/04-oracle|Oracle — Master Insights Agent]]
