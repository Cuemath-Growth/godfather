# Agent Architecture — How the Six Agents Work Together

## System Design Principle

Godfather is **not** a stack of independent tools sharing a UI. It's an **agent mesh** — each agent produces structured outputs that become inputs for others. Oracle is the orchestration layer that reads from the four domain agents and synthesises a unified intelligence view. Scout feeds the mesh forward-look context. Curator watches the mesh itself.

---

## Agent Roster

| # | Agent | Role | Direction | Tab / Surface |
|---|---|---|---|---|
| 1 | **Sentinel** | Performance agent — funnel metrics, anomaly detection, fatigue | Backward (what happened) | Tab 1 |
| 2 | **Lens** | Creative audit agent — taxonomy tagging, attribute-to-metric correlation | Backward (what worked) | Tab 2 |
| 3 | **Forge** | Content studio agent — generates copy, scripts, LPs grounded in Sentinel + Lens + Scout | Forward (what to make) | Tab 3 |
| 4 | **Oracle** | Master insights agent — synthesises Sentinel + Lens + Forge + influencer feed into a single digest | Now (what to do today) | Tab 0 |
| 5 | **Scout** | Forward-look context agent — reads calendar 3–6 weeks out, outputs Context Cards that brief Forge | Forward (what's coming) | LP planning |
| 6 | **Curator** | Structural audit agent — read-only check on folder/role/reference integrity | Meta (is the system itself healthy?) | CLI only (`/curator`) |
| 7 | **Marquee** | Owned-channel agent — YouTube channel audience, packaging, playlists, slate | Forward (what the channel recruits) | CLI only (`/marquee`) |

---

## Agent Hierarchy (data-flow mesh)

```
                    ┌─────────────┐
                    │   ORACLE    │  ← Master insights (Tab 0)
                    │             │     Reads from all four domain agents
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                      │
 ┌──────▼──────┐    ┌──────▼──────┐    ┌─────────▼──────┐
 │  SENTINEL   │    │    LENS     │    │     FORGE      │
 │ Performance │    │  Creative   │    │   Content      │
 │   (Tab 1)   │    │   Audit     │    │   Studio       │
 │             │    │  (Tab 2)    │    │   (Tab 3)      │
 └──────┬──────┘    └──────┬──────┘    └────────┬───────┘
        │                  │                    ▲
        │                  │                    │
        │                  └────────────────────┤
        └───────────────────────────────────────┤
                                                │
                                       ┌────────┴───────┐
                                       │     SCOUT      │
                                       │  Forward-look  │
                                       │  Context Cards │
                                       └────────────────┘

Owned channel: MARQUEE — YouTube channel audience graph + packaging
               Reads YouTube Studio (which Sentinel does not ingest) + Lens + Scout.
               Writes Video Cards → Forge, channel state line → Oracle.

Out-of-band:  CURATOR — read-only audit of folder + role + reference integrity
              Does not produce data the other agents consume.
```

External feeds:
- Meta Ads API + Google Ads API + CSV upload → Sentinel
- Creative assets + Sentinel performance → Lens
- Claude API + Gemini → Forge
- LP planning sheet + seasonal calendar + market briefs → Scout
- Influencer dashboard feed → Oracle direct
- YouTube Studio audience reports (geography, age, traffic sources) → Marquee

---

## Data Flow Between Agents

### Sentinel → Lens
Sentinel passes structured performance data so creative analysis is grounded in actual funnel metrics, not visual impressions.

**What flows:**
- Campaign / ad set / ad hierarchy preserved (never aggregated)
- Fatigue signal: ad-level frequency >2 in last 30 days flags as Fatigued
- Audience segment performance per creative — which targeting pairs with which creative
- All metrics per the main project file

### Sentinel → Forge
Sentinel passes "what's working" signals so Forge can generate copy informed by real data.

**What flows:**
- Top 5 / bottom 5 creatives with full metric context
- Winning audience + format combinations
- Seasonal performance patterns (which months, which hooks)

### Lens → Forge
Lens passes decoded creative intelligence so Forge replicates winning patterns.

**What flows:**
- Winning hooks (first 3 seconds / headline patterns)
- Visual + colour patterns correlated to performance
- Format recommendations (static vs video, aspect ratios)
- Pain-point / benefit frames that convert
- Anti-patterns to avoid

### Scout → Forge
Scout produces Context Cards 3–6 weeks ahead of each market moment so Forge can brief and write before the moment opens.

**What flows:**
- Per-moment Context Card: market, audience, hook, channel, priority, signal, why, action, LP status
- LP gap detection — which moments have no asset live yet

### Marquee → Forge
Marquee owns the owned-channel packaging layer and briefs scripts the way Scout briefs LPs. It does not write.

**What flows:**
- Per-video **Video Card**: format, primary KPI, the metric it's allowed to lose, audience cell, who the packaging recruits *and repels*, Brand Beats, register, spine, route (playlist + position + end screen + LP/UTM), what Forge must write
- Packaging Blocks go to design/edit, not to Forge

### Marquee ← Lens
Marquee reads Lens output so the channel doesn't re-test hooks and frames paid already settled.

### All domain agents → Oracle
Oracle reads the latest state from all domain agents on every dashboard refresh.

**What flows from Sentinel:** funnel health summary, anomaly flags, spend efficiency
**What flows from Lens:** top creative patterns, fatigue alerts, format mix recommendations
**What flows from Forge:** generation history + which generated content has been deployed and how it performed (feedback loop)
**What flows from Scout:** upcoming moments needing assets — Oracle surfaces these as "what to ship this week"

### Curator (out-of-band)
Curator does **not** participate in the data mesh. It reads every agent / skill / reference / memory file and reports structural drift to Naina. Read-only by default. Output is a markdown audit, not data the other agents consume.

---

## Agent Communication Protocol

Domain agents don't call each other in real time. They write to a shared data layer.

```
┌─────────────────────────────────────────────┐
│              SHARED DATA LAYER              │
│                                             │
│  sentinel_output.json    ← Sentinel writes  │
│  lens_output.json        ← Lens writes      │
│  forge_output.json       ← Forge writes     │
│  scout_context_cards.md  ← Scout writes     │
│  oracle_digest.json      ← Oracle reads all │
│                            four + writes    │
└─────────────────────────────────────────────┘
```

Each domain agent writes structured output after every run. Oracle reads all four on refresh and produces the dashboard digest. Curator reads everything but writes only an audit report.

---

## Refresh Cadence

| Agent | When it runs |
|---|---|
| Sentinel | On data import (CSV upload or API sync) |
| Lens | After Sentinel completes (needs performance data) |
| Forge | On-demand (user triggers generation) |
| Scout | Weekly — calendar review for next 3–6 weeks |
| Marquee | Weekly — channel state line. Per-upload at 72h for the wrong-audience alarm |
| Oracle | On every dashboard tab load (reads latest outputs) |
| Curator | On-demand (`/curator`) — suggested weekly Friday |

---

## See Also

- [[01-agents/01-sentinel|Sentinel — Performance Agent]]
- [[01-agents/02-lens|Lens — Creative Audit Agent]]
- [[01-agents/03-forge|Forge — Content Studio Agent]]
- [[01-agents/04-oracle|Oracle — Master Insights Agent]]
- [[01-agents/05-scout|Scout — Forward-Look Context Agent]]
- [[01-agents/06-curator|Curator — Brain Organisational Agent]]
- [[01-agents/07-marquee|Marquee — Owned-Channel Agent (YouTube)]]
- [the brand bible](https://cuemath-brand-book.netlify.app/) — canonical brand authority for every agent that touches creative
- [[06-channels/README|06-channels]] — owned-channel practice, fenced from the paid rulebook
