---
name: eval-fail-mathfit-compound-invention
skill: brand-validator
expected: FAIL with HARD violation flagged for invented MathFit compound nouns
tests-for-rule: forbidden-patterns §4.1 (MathFit compound inventions banned)
last-known-pass: rule confirmed May 12
---

## Input — paste this exact copy into brand-validator

> **Headline:** MathFit Minds for Your Year 6
> **Headline:** MathFit Thinking, Made Easy
> **Description:** Build your child's MathFit confidence-building skills with 1-on-1 Cuemath tutors. MathFit Application that lifts grades. Book a free class today.
>
> Validate against brand-validator.

## Expected output — checkable criteria

1. **Overall verdict: FAIL**
2. **HARD Violation flagged with exact phrase:**
   - "MathFit Minds" — invented compound, flagged
   - "MathFit Thinking" — invented compound, flagged
   - "MathFit confidence-building" — invented compound (the canonical is **MathFit™ Confidence**, not "confidence-building"), flagged
   - "MathFit Application that lifts grades" — partial-canon-with-free-suffix, flagged
3. **Reason cited matches forbidden-patterns §4.1** — references either: (a) only canonical three dimensions are MathFit™ Application / MathFit™ Clarity / MathFit™ Confidence, (b) free-form noun glued to MathFit dilutes IP, (c) MathFit is optional in lead-gen — don't force it in
4. **Suggested rewrites provided** — using ONLY canonical forms:
   - "MathFit™ Application" / "MathFit™ Clarity" / "MathFit™ Confidence" (the canonical three)
   - "Making your child MathFit™" (as standalone brand term)
   - "The MathFit method" (acceptable variant)

## Acceptable MathFit usage (validator should NOT flag)

- "Making your child MathFit™" — brand-term standalone
- "MathFit™ Application" — canonical dimension
- "the MathFit method" — acceptable variant
- "MathFit™" as adjective with no free-form noun — "your MathFit™ kid" is borderline; "your kid is MathFit™" is fine

## Anti-pattern (fail mode for the validator)

- Returns PASS — validator missing §4.1 entirely
- Catches "MathFit Minds" but misses "MathFit confidence-building" (under-catches the subtler compounds)
- Flags canonical "MathFit™ Application" as a violation — over-catches

## What this catches

- May 12 AUS session — "MathFit Minds," "MathFit Thinking," "MathFit concept depth" inventions caught and re-banned
- The trademark-dilution risk of free-form compounds
- The "if MathFit doesn't fit, don't force it" rule (team ships without it in 4-of-4 PTs per the AUS session memory)

## Known-good reference

- Canonical three dimensions: MathFit™ Application · MathFit™ Clarity · MathFit™ Confidence
- `feedback_session_may12_meta_failures.md` Section 4 (original catch)
- forbidden-patterns §4.1 (consolidated)
