# Project Roadmap — Godfather v2

## Phase 1: MVP (Weeks 1–3)

### Goal: One agent working end-to-end with manual data input.

- [ ] Scaffold Next.js 14 app with Tailwind + DM Sans
- [ ] Build Tab 3 (Content Studio / Forge) first — highest daily-use value
  - [ ] 5-step brief wizard UI
  - [ ] Claude API integration with Forge system prompt
  - [ ] Copy output panel (headlines, body, CTA, why-this-works)
  - [ ] Inline refinement (Refine button per block)
  - [ ] Freeform chat mode (skip wizard)
- [ ] Build Brand Validation as a shared utility
- [ ] Build basic nav (4 tabs, only Tab 3 functional)
- [ ] Export as .txt

**Exit criteria:** Team can generate ad copy via Forge with brand validation, and refine it.

---

## Phase 2: Performance Layer (Weeks 4–6)

### Goal: Sentinel ingests data and powers Tab 1.

- [ ] Build Tab 1 (Performance Analytics / Sentinel)
  - [ ] CSV upload interface
  - [ ] Data Ingestion skill (header normalisation, validation)
  - [ ] Funnel Mapping skill
  - [ ] Threshold Scoring (green/amber/red)
  - [ ] Campaign → Ad Set → Ad drill-down tables
  - [ ] Anomaly Detection + flags panel
  - [ ] Top 5 / Bottom 5 cards (split by static/video)
- [ ] Write `sentinel_output.json` to shared data layer
- [ ] Wire Sentinel output to Forge (so generated copy references winning creatives)

**Exit criteria:** Team uploads a CSV, sees full funnel analysis with scoring, and Forge reads top performers when generating copy.

---

## Phase 3: Creative Intelligence (Weeks 7–9)

### Goal: Lens decodes creative patterns and powers Tab 2.

- [ ] Build Tab 2 (Creative Audit / Lens)
  - [ ] Creative Tagging engine (auto-tag from name + copy)
  - [ ] Pattern Correlation (attribute × metric matrix)
  - [ ] Fatigue Detection (time-series CPQL tracking)
  - [ ] Winning/Losing signal cards
  - [ ] Creative brief generation from patterns
- [ ] Write `lens_output.json` to shared data layer
- [ ] Wire Lens signals to Forge (hook recommendations, anti-patterns)

**Exit criteria:** Team sees which hooks, formats, and frames are winning. Forge uses these patterns to generate smarter copy.

---

## Phase 4: Master Intelligence (Weeks 10–11)

### Goal: Oracle synthesises all agents into Tab 0.

- [ ] Build Tab 0 (Dashboard / Oracle)
  - [ ] Cross-Signal Synthesis engine
  - [ ] 3–5 insight cards (priority-ordered)
  - [ ] Win/loss summary table
  - [ ] Metric ticker (CPQL trend, CPTD trend, spend efficiency)
  - [ ] Pipeline status bar
  - [ ] Anomaly alert banner
  - [ ] Stale data warning
- [ ] Write `oracle_digest.json`
- [ ] Auto-refresh on tab load

**Exit criteria:** Team opens Godfather and immediately knows: what's working, what's bleeding, and what to do next.

---

## Phase 5: Image Generation + API Integration (Weeks 12–14)

### Goal: Full creative production capability + live data feeds.

- [ ] Banana Pro API integration for AI image generation
  - [ ] Prompt engineering module
  - [ ] Format selector (1:1, 4:5, 9:16, 16:9, 1.91:1)
  - [ ] Brand colour injection
  - [ ] Text overlay post-processing
- [ ] Meta Ads API integration (replace CSV upload for Meta)
- [ ] Google Ads API integration (replace CSV upload for Google)
- [ ] Auto-sync scheduling (daily or on-demand)

**Exit criteria:** Data flows in automatically. Team can generate complete ad creatives (copy + image) from Godfather.

---

## Phase 6: Feedback Loop + Persistence (Weeks 15–17)

### Goal: Godfather learns from its own outputs.

- [ ] Supabase integration for persistent storage
- [ ] Brief Library (save + reuse past briefs)
- [ ] Performance tagging on Forge outputs ("Deployed" / "Won" / "Dropped")
- [ ] Lens incorporates Forge-generated creatives in its analysis
- [ ] Oracle surfaces Forge performance: "AI-generated statics have X% lower CPQL"
- [ ] Version history for refined copy blocks

**Exit criteria:** Godfather has a closed feedback loop — it generates, the team deploys, performance data feeds back, and future generations improve.

---

## See Also

- [[00-project/README|Project Overview]]
- [[04-workflows/00-orchestration|Orchestration & Data Flow]]
