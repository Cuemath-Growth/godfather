# Creative Guardrails — Lens-Specific

These guardrails apply specifically to Lens's creative audit and pattern analysis. They supplement the [[03-guardrails/00-master-guardrails|Master Guardrails]].

---

## Tagging Rules

### C-01: Confidence Levels Are Mandatory
Every attribute tag must carry a confidence level:
- `verified` — confirmed from actual creative file (image/video reviewed)
- `inferred` — derived from ad name, copy text, or performance metadata
- `hypothesis` — educated guess based on partial signals

**Never present inferred attributes as verified.** If Lens can't see the video file, it says so.

### C-02: Multi-Tag, Don't Force Single-Label
A creative can have multiple hook types, pain points, and format attributes. "Video_Keerthi_MathKangaroo" is both `H-MATH` and `H-EVENT`, and `F-INFLU` and `PB-COMP`. Tag all that apply — don't force a single label.

### C-03: Ad Name ≠ Full Truth
Creative names often encode useful info (influencer name, topic, version). But names can be misleading or outdated. Always cross-reference with available copy text and performance data before finalising tags.

---

## Correlation Rules

### C-04: Correlation ≠ Causation — But Still Useful
When Lens finds that `H-MATH` hooks correlate with 2x better CPTD, it reports this as a pattern, not a proven cause. Language should be: "Math-anchored hooks are associated with lower CPTD" not "Math-anchored hooks cause lower CPTD."

### C-05: Minimum Sample Size for Signals
A pattern must appear in ≥3 creatives to be called a "signal." A single high-performing creative with a Telugu testimonial is an anecdote. Three Telugu testimonials all performing well is a signal.

### C-06: Influencer Split Is Non-Negotiable
This is [[03-guardrails/00-master-guardrails#G-11|G-11]] applied specifically: "Influencer" is never analysed as one category. Always split by:
- Hook type (math-anchored vs lifestyle vs testimonial)
- Math moment on screen (yes/no)
- Language (English, Hindi, Telugu, etc.)

Keerthi (math-anchored, CPTD $18k) and Jharna (lifestyle, CPTD $150k) are not the same category.

### C-07: Telugu Testimonial Opportunity Flag
Per Feb US analysis, Telugu testimonials are the highest-performing subcategory but the most underrepresented. Lens must flag this gap in every analysis where it applies, until the mix is balanced.

---

## Fatigue Detection Rules

### C-08: Fatigue = CPQL Increase >30% Over 30 Days
If a creative's CPQL increases >30% over a trailing 30-day window with no targeting change, it's flagged as fatigued. Recommendation: refresh visual (same hook, new layout/colour) before pausing entirely.

### C-09: Distinguish Creative Fatigue from Audience Saturation
If ALL creatives in a targeting segment degrade simultaneously, the problem is audience saturation, not creative fatigue. Lens should flag this distinction — the fix is different (new audience vs new creative).

---

## Output Rules

### C-10: Winning Signals Include Actionable Brief
Every winning signal in Lens's output must include a concrete creative brief suggestion. Not just "math-anchored hooks work" but "Create 3 new statics: math-anchored headline + NRI audience + Indian tutor visual. Format: 1:1 for Instagram, 1.91:1 for Facebook."

### C-11: Losing Signals Include Kill/Fix Recommendation
Every losing signal must recommend either:
- **Kill:** "Pause all lifestyle-hook influencer videos. Reallocate budget."
- **Fix:** "Math Kangaroo creative is fatigued but the angle works. Refresh with new visual, keep the hook."

Never leave a losing signal without a next step.

---

## See Also

- [[03-guardrails/00-master-guardrails|Master Guardrails]]
- [[01-agents/02-lens|Lens Agent Definition]]
- [[02-skills/key-skills#Skill: Creative Tagging|Creative Tagging Skill]]
