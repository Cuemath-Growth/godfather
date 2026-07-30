---
name: eval-pass-top1pct-with-mechanism
skill: brand-validator
expected: PASS (or PASS WITH WARNINGS) — Top 1% with mechanism is acceptable contextual use
tests-for-rule: forbidden-patterns §1.4 (Top 1% — moderate use, tutor-selection contexts only)
last-known-pass: rule clarified May 19 (not a ban, a context rule)
---

## Input — paste this exact copy into brand-validator

> **Headline:** Top 1% of Math Tutors, Chosen for How They Explain
> **Headline:** Coaches Screened on Teaching Skill, Not Just Credentials
> **Description:** Cuemath hires from the top 1% of math tutor applicants — and we screen for explanation skill, not just degrees. Your kid gets a coach who can actually teach. $20/class, 1-on-1 online.
>
> Validate against brand-validator.

## Expected output — checkable criteria

1. **Overall verdict: PASS** (or PASS WITH WARNINGS — but NOT FAIL)
2. **Top 1% NOT flagged as a HARD violation** — context here is tutor-selection / hire-bar explanation, which is the explicitly OK use case per §1.4
3. **Validator demonstrates understanding of the context rule** — output should NOT say "Top 1% is banned" because that's wrong; the §1.4 rule is contextual, not absolute
4. **Acceptable SOFT flags (if any):**
   - "Could explain what '1%' means more concretely" (acceptable suggestion)
   - "Consider pairing with what-this-means-for-your-kid line" (matches §1.4 guidance)
5. **No HARD violations on Indian Tutors, remediation, MathFit compounds, or stat fabrication** — none of those are present

## The discrimination test

The validator's job here is to distinguish:

- ❌ **Banned default trust badge** — "Top 1% Tutors" standalone in a headline with no mechanism behind it
- ✅ **Acceptable contextual use** — "Top 1% of Math Tutors, Chosen for How They Explain" + a mechanism line backing it up

If validator can't make this distinction (always passes OR always fails), it's missing the §1.4 contextual rule and needs recalibration.

## Anti-pattern (fail mode for the validator)

- Returns FAIL flagging "Top 1%" as a hard ban → validator has the old May-prior rule cached, not the May 19 clarification
- Returns PASS but ALSO says "consider replacing 'Top 1%' with 'certified math tutors'" → validator under-recognises the contextual acceptance
- Misses the OTHER acceptable signals — pairing with "screened on teaching skill" IS the mechanism, validator should explicitly note this satisfies §1.4

## What this catches

- Validator drift toward absolute bans when the rule is contextual
- Lack of nuance — treating context rules as binary rules
- Failure to recognise that "Top 1%" + mechanism is the §1.4 acceptable pattern

## Contrast: same number, banned form

For comparison, the validator SHOULD fail this version:

> **Headline:** Top 1% Math Tutors Online
> **Headline:** Pick from the Top 1%
> **Description:** Cuemath has the top 1% of math tutors. $20/class. Book today.

This version uses Top 1% as default trust badge (no mechanism, no explanation, no kid-outcome link) — that's the banned form. Run BOTH inputs against the validator and confirm it distinguishes correctly.

## Known-good reference

- forbidden-patterns §1.4 (May 19 clarification: not a ban, a context rule)
- The §1.4 entry includes both "When OK" and "When NOT OK" sub-rules — the validator should reference this distinction
