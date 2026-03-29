# Skill: Data Ingestion

**Used by:** Sentinel

## Purpose
Parse raw campaign data from Meta Ads API, Google Ads API, or CSV upload into a normalised internal schema that all agents can consume.

## Input
- Raw CSV file OR API response JSON
- Source identifier: `meta | google | csv`
- Geography: `US | IN | AU | MEA`

## Logic

### Step 1: Header Normalisation
Map platform-specific column names to Cuemath's internal schema:

| Internal Field | Meta Ads | Google Ads | CSV (expected) |
|---|---|---|---|
| campaign_name | Campaign name | Campaign | Campaign |
| ad_set_name | Ad set name | Ad group | Ad Set |
| ad_name | Ad name | Ad | Ad Name |
| impressions | Impressions | Impr. | Impressions |
| clicks | Link clicks | Clicks | Clicks |
| spend | Amount spent (USD) | Cost | Spent |
| ql | *custom event* | *custom event* | QL |
| nri | *custom event* | *custom event* | NRI |
| td | *custom event* | *custom event* | TD |

### Step 2: Data Validation
- Reject rows where campaign_name is null
- Reject rows where spend = 0 AND impressions = 0 (dead rows)
- Flag rows where QL > 0 but TD = 0 (funnel break candidates)
- Flag rows where spend > geo-threshold AND QL = 0 (budget leak candidates)

### Step 3: Derived Metrics
Calculate for every row:
```
CPQL = spend / ql (if ql > 0, else null)
CPNRI = spend / nri (if nri > 0, else null)
CPTD = spend / td (if td > 0, else null)
QL_TD_PCT = (td / ql) * 100 (if ql > 0, else null)
CTR = (clicks / impressions) * 100 (if impressions > 0, else null)
```

### Step 4: Currency Tagging
- Auto-detect from source (Meta API includes currency)
- For CSV: require explicit currency column OR use geography default
- **Never assume currency.** If ambiguous, flag for user confirmation.

## Output
Normalised JSON array of campaign rows ready for Sentinel to process.

## Rules
- Never aggregate during ingestion. Every row stays individual.
- Never drop columns — carry forward all original fields + add derived metrics.
- Log any rows rejected or flagged for manual review.

---

# Skill: Creative Tagging

**Used by:** Lens

## Purpose
Assign multi-dimensional attributes to each creative for pattern analysis.

## Input
- Creative name (from Sentinel data)
- Creative type (static/video — from Sentinel data)
- Ad copy text (if available — from Notion, Drive, or paste)
- Thumbnail/image (if available — binary file)
- Performance metrics (from Sentinel output)

## Logic

### Auto-tagging from Creative Name
Most Cuemath creative names encode information:
```
Video_Keerthi_230126     → F-INFLU, influencer name: Keerthi
Static_IndianTutors_v1   → F-STATIC, PB-TUTOR + PB-INDIAN
MathKangaroo_Feb         → F-STATIC or F-VIDEO, PB-COMP, H-EVENT
Testimonial_Lakshami_Tel → F-TESTI, language: Telugu
```

### Auto-tagging from Ad Copy
Scan primary text + headline for keyword signals:
- "Indian tutor" / "tutor from India" → PB-INDIAN, PB-TUTOR
- "Olympiad" / "AMC" / "MATHCOUNTS" / "Math Kangaroo" → PB-COMP
- "grade" / "marks" / "test" / "score" → PB-GRADE
- "summer" / "back to school" / "NAPLAN" / "board exam" → H-EVENT
- "free trial" / "book now" → CTA type: urgency
- Question mark in first sentence → H-QUES

### Confidence Levels
| Source | Confidence |
|---|---|
| Verified from actual creative file | `verified` |
| Inferred from ad name + copy text | `inferred` |
| Hypothesised (no copy/file available) | `hypothesis` |

**Rule:** Always tag confidence. Never present inferred attributes as verified.

## Output
Per-creative attribute object added to the creative's data row.

---

# Skill: Copy Generation

**Used by:** Forge

## Purpose
Generate ad copy that is brand-compliant, data-informed, and channel-specific.

## Input
- Brief (geography, product, channel, audience, key message, CTA preference)
- Lens signals (winning hooks, losing hooks, recommended frames)
- Sentinel context (top performers for reference)

## Logic

### Step 1: Channel Spec Check
Load character limits and format rules for the target channel:

| Channel | Element | Limit |
|---|---|---|
| Meta | Primary text | 125 chars (ideal), 250 max |
| Meta | Headline | 40 chars |
| Meta | Description | 30 chars |
| Google RSA | Headline | 30 chars (strict) |
| Google RSA | Description | 90 chars (strict) |

### Step 2: Hook Selection
Based on Lens's winning_signals, select the primary hook type.
Priority order: use winning signals first, then brief-specified angle, then default to H-MATH.

### Step 3: Generation
Generate 3 headline variants that are:
- Genuinely different from each other (not the same idea reworded)
- Within character limits (verified post-generation)
- Using at least 2 different hook types across the 3

### Step 4: Brand Validation
Run output through [[02-skills/brand-validation|Brand Validation]] skill.
Auto-reject and regenerate if any hard rule is violated.

### Step 5: Data Grounding
Attach a "why this works" note citing the specific Sentinel/Lens data that informed the output.

## Output
Structured copy object (headlines[], body, meta_copy, why_this_works, data_grounding).

## Rules
- Every headline is individually char-count verified before output.
- No headline is a reword of another headline in the same set.
- "Why this works" note is mandatory — never skip it.

---

# Skill: Brand Validation

**Used by:** Forge, Oracle

## Purpose
Validate any text output against Cuemath's brand rules. Acts as a final gate before any copy is presented to the user.

## Banned Words/Phrases (auto-reject)

```
classroom          → Cuemath is digital-first
center / centre    → Cuemath is online, not a learning center
unlock potential   → generic edtech filler
bright future      → generic edtech filler
love for learning  → generic edtech filler
amazing            → empty adjective
incredible         → empty adjective
powerful           → empty adjective
capable, strong and confident → incorrect brand language
kiddish            → off-tone for parent-facing copy
```

## Required Substitutions

| Instead of | Use |
|---|---|
| "capable, strong and confident" | "think clearly, reason deeply, solve confidently" |
| "classroom learning" | "online learning" or "1:1 sessions" |
| "our centre" / "learning center" | "our program" / "Cuemath's platform" |
| Generic confidence language | Specific outcome: "reason through problems, not just memorise steps" |

## Structural Rules
- MathFit™ always has the ™ symbol on first mention. Can omit in body copy after first prominent use but must reappear in headers, end frames, sign-offs. Correct: MathFit™. Incorrect: MathFit / mathfit / Math Fit.
- MathFit skills dimension (for marketing): Fluency, Understanding, Application, Reasoning — FUAR, in this order
- MathFit mindset dimension: interest, confidence, growth mindset & resilience, math relevance
- Memory is ONLY used in app-specific copy (App Store, in-app), not in marketing copy
- Parent-facing voice: never address children directly ("your child will..." not "you will learn...")
- No duplicate words within a single caption, headline set, or body copy block
- Outcomes over feelings: what the child will DO, not how they will FEEL
- Never promise shortcuts, hype speed, say "guaranteed marks", or over-index on ease/fun
- Use the AI-era frame: "AI calculates. Humans must think."
- Every ad must ladder back to MathFit as the outcome
- Reference "cue don't tell" pedagogy when writing about teaching method
- Reference Talk-o-Meter when writing about engagement

## Output
Pass/fail with list of violations if any. Auto-suggest corrections for each violation.
