# Godfather Daily Operating Playbook

> **The operating rhythm for the Cuemath growth team.** When to run what, what to look for, what to do about it. Every action in plain English.

---

## Monday Morning (10 minutes)

**Goal:** Know the state of the business. One Slack message to the team.

### Step 1: Weekly Performance Digest
Run Skill: Weekly Performance Digest

**What you're looking for:**
- Did CPQL go up or down this week vs last week, in each market?
- Did we hit our weekly TD target?
- Are any markets in Red?
- Are the structural ratios holding? (NRI advantage ~2.5x, Brand advantage ~2.8x, Mothers advantage ~1.4x)

### Step 2: Market Health Scorecard
Run Skill: Market Health Scorecard

**Quick check:**
```
US:     CPQL [G/A/R]  CPTD [G/A/R]  QL->TD% [G/A/R]  TD->Paid% [G/A/R]
India:  CPQL [G/A/R]  CPTD [G/A/R]  QL->TD% [G/A/R]  TD->Paid% [G/A/R]
APAC:   ...
ME:     ...
UK:     ...
```

**What to do with it:**
- All Green → "Good week. Stay the course."
- Any Red → drill into that market with Funnel Leak Detector
- Structural ratio eroding → escalate to CMO immediately

### Step 3: Creative Portfolio Check
**Look at:**
- How many active creatives? (Healthy: 20+, Critical: <10)
- How many launched this week vs fatigued?
- Are we on pace for 17-21 pieces/week?

### Output: Monday Slack Message (copy-paste template)

```
WEEKLY UPDATE — Week of [Date]

HEADLINE: [One sentence — the most important thing]

MARKETS:
  US: [Status] — CPQL [X], CPTD [X], [trend]
  India: [Status] — CPQL [X], CPTD [X], [trend]
  APAC/ME/UK: [Status]

WINS: [1-2 bullets]
NEEDS ATTENTION: [1-2 bullets]

THIS WEEK'S 3 ACTIONS:
1. [Action + owner]
2. [Action + owner]
3. [Action + owner]

CREATIVE PORTFOLIO: [X] active, [Y] launched, [Z] fatigued
```

---

## Daily (5 minutes)

**Goal:** Catch problems before they cost money. Max 3 actions per day.

### Step 1: Anomaly Check
Run Skill: Anomaly Spotter (or glance at Godfather Dashboard)

**What you're looking for:**
- Any metric spiked or dropped >20% vs yesterday?
- Any campaign suddenly burning money with no conversions?
- Any new campaign launched that needs monitoring?

**Decision:**
- REAL anomaly (3+ days, large sample) → Act now
- WATCH (1-2 days, uncertain) → Note it, check tomorrow
- NOISE (1 day, small sample) → Ignore

### Step 2: Fatigue Check
Run Skill: Fatigue Alerts (or check Godfather Tagger → Creative Review)

**What you're looking for:**
- Which creatives have CPQL rising >30% over 30 days?
- Is this creative fatigue (one ad dying) or audience saturation (all ads in a segment dying)?

**Decision tree:**
- Creative fatigued → PAUSE it today. Shift budget to best-performing ad in same audience.
- Audience saturated → Don't pause. Reduce spend 20% on that segment for 1 week. Brief 2-3 fresh creatives.
- Seasonal dip → Don't panic. Check seasonal calendar. Expected dips aren't fatigue.

### Step 3: Today's Action List
From the anomaly + fatigue check, write max 3 actions:

```
TODAY'S ACTIONS:
1. [e.g., "Pause US_NRI_March_Keerthi_v2 — CPQL +45% over 30 days. Shift INR 80K/day to Shalini campaign."]
2. [e.g., "Check why India CPQL jumped 25% yesterday — could be noise (only 30 QLs) — monitor today."]
3. [e.g., "Brief 2 new NRI statics — only 12 active vs 20 target."]
```

---

## Wednesday (15 minutes)

**Goal:** Mid-week course correction. Are we spending right? Where are leads dying?

### Step 1: Funnel Leak Detector
Run Skill: Funnel Leak Detector for each market with >100 QLs this month

**What you're looking for:**
- Where is the BIGGEST leak by cost impact?
- Is the same leak happening in multiple markets?
- Is PLA TB→TC still at ~35% (target 45%)? Is it improving?

**What to do:**
- Top leak is QL→TD? → Marketing problem (creative or targeting)
- Top leak is TD→Paid? → Sales problem (follow-up, pricing, product)
- PLA TB→TC still >50% timeout? → Product/UX problem (scheduling flow)

### Step 2: Spend Optimizer
Run Skill: Spend Optimizer for US (largest budget)

**What you're looking for:**
- Are we on pace vs the monthly budget plan?
- Which channel is most over/under the CPQL target?
- Any audience segment burning budget with high CPTD?

**What to do:**
- Over-pacing by >10% → Reduce daily budgets on lowest-efficiency campaigns
- Under-pacing by >10% → Increase budgets on highest-efficiency campaigns
- Channel over CPQL target → Run Creative Diagnostician on that channel's ads

### Output: Mid-Week Adjustment

```
MID-WEEK CHECK — [Date]

BIGGEST LEAK: [Stage] — [X] leads lost, INR [Y] impact
ACTION: [Specific fix]

BUDGET PACE: [On track / Over by X% / Under by X%]
ADJUSTMENT: [Shift INR X from Y to Z — reason]
```

---

## Friday (20 minutes)

**Goal:** Plan next week's creative production. Close the intelligence-to-action loop.

### Step 1: Post-Mortem (if any campaign ended this week)
Run Skill: Campaign Post-Mortem

**What to capture:**
- What worked? (Keep for future campaigns)
- What failed? (Never repeat)
- Any surprises?

### Step 2: Next-Best-Creative
Run Skill: Next-Best-Creative for US + India (highest volume markets)

**What you're looking for:**
- Which creatives are about to die? (Fatigue pipeline)
- What gaps exist in the portfolio? (Missing combos)
- What should we produce next week?

### Step 3: Tag-to-Brief (top 2-3 recommendations)
Run Skill: Tag-to-Brief for the top recommendations from Step 2

**Output:** 2-3 production-ready creative briefs with:
- Full tag specification
- Platform specs (sizes, character limits)
- Visual direction
- Data grounding (why this combo)
- Deadline: following Friday

### Output: Friday Creative Brief Package

```
NEXT WEEK'S CREATIVE PLAN

REPLACING: [X fatiguing creatives]
FILLING GAPS: [Y portfolio holes]

BRIEF 1: [Title] — [Market] [Audience] [Format]
  Hook: [specific]
  Why: [data backing]
  Deadline: [date]
  Assigned to: [name]

BRIEF 2: [Title] — ...
BRIEF 3: [Title] — ...
```

---

## Monthly (30 minutes — first Monday of the month)

**Goal:** Strategic review. Are our bets paying off? Is the data clean?

### Step 1: Growth Bet Tracker
Run Skill: Growth Bet Tracker

**What you're looking for:**
- Which of the 14 initiatives are active vs stalled?
- Any kill-switches triggered on EA expansion bets?
- Creative velocity: producing enough to sustain portfolio?

### Step 2: Tagger QA
Run Skill: Tagger QA on the full corpus

**What you're looking for:**
- Taxonomy Health Score (target: >85)
- Any systematic tagging errors creeping in?
- Tag distribution drift (any field >60% one value?)

### Step 3: Cross-Market Transfer
Run Skill: Cross-Market Transfer (all markets)

**What you're looking for:**
- Winning combos in one market with 0 deployment in another
- Telugu testimonial underrepresentation (C-07 — always flag)
- NRI patterns transferable to APAC/MEA NRI audiences

### Step 4: Deep Dives
Run Skill: Creative DNA on top 5 and bottom 5 performers this month
Run Skill: Creative Scorer on any new concept ideas

### Output: Monthly Strategic Memo

```
MONTHLY CREATIVE INTELLIGENCE MEMO — [Month]

PORTFOLIO HEALTH: [Score] — [X] active, [Y]% fresh, [Z]% fatigued
TAG QUALITY: [Score]/100

TOP FINDING: [The single most important insight this month]

GROWTH INITIATIVES: [X] active, [Y] on track, [Z] stalled
  STALLED: [List — these need attention]

CROSS-MARKET OPPORTUNITIES: [N] found
  TOP: [Best transfer opportunity with data]

TOP 5 PERFORMERS: [Names + why they worked]
BOTTOM 5: [Names + why they failed + what to do differently]

NEXT MONTH PRIORITIES:
1. [Strategic priority]
2. [Strategic priority]
3. [Strategic priority]
```

---

## Quick Reference: Which Skill for Which Question

| When someone asks... | Run this skill |
|---------------------|---------------|
| "Why is CPQL high?" | Creative Diagnostician |
| "Where are we losing leads?" | Funnel Leak Detector |
| "Should we shift budget?" | Spend Optimizer |
| "What happened this week?" | Weekly Performance Digest |
| "Something looks off in the numbers" | Anomaly Spotter |
| "Which ads are dying?" | Fatigue Alerts |
| "What should we make next?" | Next-Best-Creative |
| "Turn that insight into a brief" | Tag-to-Brief |
| "Why did this ad work/fail?" | Creative DNA |
| "Would this concept work?" | Creative Scorer |
| "Are our tags clean?" | Tagger QA |
| "Can we replicate US success in APAC?" | Cross-Market Transfer |
| "How did that campaign do?" | Campaign Post-Mortem |
| "Which markets are healthy?" | Market Health Scorecard |
| "Are our growth bets working?" | Growth Bet Tracker |
