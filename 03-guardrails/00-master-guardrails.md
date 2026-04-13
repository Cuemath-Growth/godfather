# Master Guardrails

These guardrails apply to **every agent, every skill, every output** in Godfather. They are derived from real mistakes caught across months of Cuemath marketing work. Each guardrail exists because something went wrong without it.

---

## Tier 1: Non-Negotiable (violation = auto-reject)

These are hard stops. If any of these are violated, the output is rejected and regenerated.

### G-01: No Row Aggregation
Each campaign instance of the same creative stays as its own row. Never collapse, average, or merge rows — even if the same creative ran in 5 campaigns.
> **Origin:** First data analysis — aggregation masked that the same creative performed differently across targeting segments and time periods.

### G-02: Best and Worst Never Overlap
A creative earns one label per analysis cycle. If it's in top 5, it cannot appear in bottom 5 — even on a different metric.
> **Origin:** Feb US analysis — a creative appeared as "best CPQL" and "worst CPTD" simultaneously, creating confusing recommendations.

### G-03: No "Classroom" Ever
Cuemath is digital-first. The word "classroom" never appears in any output — copy, analysis, scripts, image prompts, or insights.
> **Origin:** Brand book review — "classroom" implies a physical product Cuemath doesn't have.

### G-04: No "Center" / "Centre" Ever
Cuemath is online. References to "learning center" or "tuition centre" are always wrong.
> **Origin:** Google RSA headline review — "center" appeared in a Learning Center ad group despite the product being entirely online.

### G-05: MathFit™ Accuracy
For marketing copy, the skills framework is **FUAR: Fluency, Understanding, Application, Reasoning**. Always in this order. Plus a mindset dimension (interest, confidence, growth mindset & resilience, math relevance). Never paraphrased loosely. Never invented extra dimensions. ™ on first mention; can omit in body copy after first prominent use but must reappear in section headers, end frames, and sign-offs. Correct: MathFit™. Incorrect: MathFit / mathfit / Math Fit.
> **Origin:** MathFit Constitution + App Store description review — the App uses a 5-skill model including Memory, but the brand Constitution defines FUAR for all marketing. Keep them distinct.

### G-05b: No Shortcuts, Speed, or Guaranteed Marks
Never promise shortcuts, hype speed or tricks, say "guaranteed marks/grades", or over-index on ease or fun. We don't say "math is easy." We say "math makes sense when taught the right way."
> **Origin:** MathFit Constitution — Positioning Rules.

### G-06: Parent-Facing Voice Only
All ad copy addresses parents. Never address children directly. "Your child will..." not "You will learn..."
> **Origin:** Brand framework — parent is the buyer, child is the user. Copy speaks to the decision-maker.

### G-07: Currency Always Labelled
Every monetary figure must have an explicit currency label — INR, USD, AUD. Never assume. If ambiguous, flag for user confirmation.
> **Origin:** Cross-geo data analysis — INR and USD figures were unlabelled, causing incorrect threshold comparisons.

### G-08: Character Limits Are Hard Limits
Google RSA headline = 30 chars. Google RSA description = 90 chars. Meta headline = 40 chars. These are verified post-generation, not estimated.
> **Origin:** RSA headline bank — multiple headlines were 31–32 chars, which Google truncates or refuses to serve.

---

## Tier 2: Structural (violation = flag + correct)

These ensure output quality and analytical integrity.

### G-09: ICP Content Must Be Distinctly Different
If you swap the ICP label (Foundation Rebuilder / Personalization Seeker / Confidence Builder / Accelerator) and the copy still feels right, it's too generic. Each segment must have visibly different language, pain points, and benefit frames.
> **Origin:** LP content review — three ICP sections used near-identical language with only the header changed.
> **Note:** These are brand copy personas from ICP research (used by Forge for copy generation). In the Godfather dashboard, audience is tracked via the `campaign_audience` taxonomy field: NRI, Broad, PLA, Influencer, Vernacular, etc.

### G-10: USP Blocks Are Intent-Specific Per Ad Group
USP headlines in Google RSA are tailored to the ad group's search intent, not generic across all groups. A "Tutoring" ad group USP is different from an "Olympiad Prep" ad group USP.
> **Origin:** RSA headline review — generic USPs were copy-pasted across 12 ad groups without adaptation.

### G-11: Influencer Performance Split by Hook Type
Never report "influencer" as a monolithic category. Math-anchored influencer content and lifestyle influencer content perform fundamentally differently. Always split.
> **Origin:** Feb US creative analysis — "influencer videos are underperforming" was misleading because Keerthi (math-anchored) had CPTD $18k while Jharna (lifestyle) had CPTD $150k.

### G-12: Regional Accuracy Over Convenient Bundling
Geography-specific content must be individually verified. Never bundle or assume: separate Onam from Gujarati New Year, use correct Australian school terms, handle overlapping MEA school calendars and Islamic calendar separately.
> **Origin:** Contextual advertising calendars — festivals were lumped together, Australian seasons were reversed, MEA calendar had missing Islamic dates.

### G-13: Churn Risk Must Be Flagged
When using Accelerator ICP framing (competition prep, advanced math), always include a churn risk note. Strategy doc flags this segment as highest churn risk. Proceed with the content, but surface the tension.
> **Origin:** LP content for Accelerator segment — competition-prep content was written without flagging the known retention risk.

### G-14: No Duplicate Words in Copy
No word should repeat within the same caption, headline set, or body copy block. Includes morphological variants (e.g., "build" and "building" in the same paragraph).
> **Origin:** LinkedIn caption review — "stage" was used twice; "solve" appeared in both headline and body.

---

## Tier 3: Quality (violation = warn + suggest)

These are quality signals that improve output but don't block it.

### G-15: Social Proof Tags Must Vary
When displaying multiple review cards or testimonial badges, each should lead with a different keyword tag. Repetition reduces scannability.
> **Origin:** AU Trustpilot review cards — three cards all led with "Great tutors."

### G-16: USPs Must Be Tangible
"Lasting Confidence" is vague. "Confidence you can see in their next test" is tangible. USPs should name a specific, observable outcome.
> **Origin:** LP USP section — abstract benefit language failed the "so what?" test.

### G-17: Comparison Table Rows Must Be Genuinely Different
Each row in a competitor comparison table should name a distinct pain or benefit — not say the same thing differently across rows.
> **Origin:** LP comparison table — 4 of 6 rows were variations of "better teaching quality."

### G-18: Headlines Earn Variety
In a set of 3 headline variants, at least 2 should use different hook types (e.g., one math-anchored, one testimonial, one stat-based). Three variations of the same hook is not A/B testable.
> **Origin:** Copy generation — three "Indian tutors" headlines generated with no other hook represented.

### G-19: "Why This Works" Is Mandatory
Every piece of generated content must include a brief note explaining which data signal, creative pattern, or audience insight informed it. No ungrounded output.
> **Origin:** Godfather v1 design — ensures the team can evaluate and learn from AI output, not just accept it.

---

## How Agents Use Guardrails

| Agent | Guardrails Applied |
|---|---|
| **Sentinel** | G-01, G-02, G-04, G-07 |
| **Lens** | G-02, G-11, G-12 |
| **Forge** | G-03, G-04, G-05, G-06, G-08, G-09, G-10, G-14, G-15, G-16, G-17, G-18, G-19 |
| **Oracle** | G-01, G-02, G-07, G-13, G-19 |

---

## See Also

- [[03-guardrails/01-data-guardrails|Data Guardrails (Sentinel-specific)]]
- [[03-guardrails/02-creative-guardrails|Creative Guardrails (Lens-specific)]]
- [[03-guardrails/03-copy-guardrails|Copy Guardrails (Forge-specific)]]
