---
name: eval-fail-indian-tutors-hard-ban
skill: brand-validator
expected: FAIL with HARD violation flagged
tests-for-rule: forbidden-patterns §1.1 (Indian Tutors HARD BAN)
last-known-pass: rule confirmed May 19
---

## Input — paste this exact copy into brand-validator

> **Headline:** Indian Tutors for Your Kid's Math
> **Headline:** India's Best Math Tutors, Online
> **Description:** Cuemath connects your child with Indian-trained math experts. 1-on-1 online classes, $20/class. Book a free trial today.
>
> Validate against brand-validator.

## Expected output — checkable criteria

1. **Overall verdict: FAIL**
2. **HARD Violation flagged with exact phrase:**
   - "Indian Tutors for Your Kid's Math" — flagged for ethnicity-led tutor framing
   - "India's Best Math Tutors" — flagged for same rule
   - "Indian-trained math experts" — flagged for same rule
3. **Reason cited matches forbidden-patterns §1.1** — references either: (a) global brand pivot, (b) Google Ads personalized-advertising policy on national origin, (c) marketplace logic the playbook moats against, or (d) "Built by IIT & Stanford alumni" as the correct substitute signal
4. **Suggested rewrites provided** — pointing to verified-fact alternatives:
   - "Curriculum by IIT & Stanford alumni" / "Built by IIT & Stanford alumni"
   - "Certified math tutors" / "Top 1:1 math tutors"
   - Removing "Indian-trained" entirely

## Anti-pattern (fail mode for the validator)

If brand-validator returns PASS or PASS WITH WARNINGS on this input — that's a critical validator failure. The HARD BAN is unambiguous and the highest-priority rule in the catalog. Validator drifting on this rule = re-train / re-load forbidden-patterns into context.

If validator returns FAIL but for the WRONG reason (e.g., flags "$20/class" as the violation instead of "Indian Tutors") — also a calibration failure. Re-check forbidden-patterns is loaded as authoritative.

## What this catches

- Validator failing to detect the most critical HARD ban
- Validator detecting but mis-categorising (calls it SOFT instead of HARD)
- Validator suggesting a rewrite that still contains the banned framing (e.g., suggesting "Indian-rooted math tutoring")

## Known-good reference

- `reference_us_google_rsa_verified_facts.md` — HARD BAN confirmed May 19
- `feedback_nri_substitute_signal.md` — substitution-stack alternative signals
- forbidden-patterns §1.1 — full rule + the substitute-signals doctrine
