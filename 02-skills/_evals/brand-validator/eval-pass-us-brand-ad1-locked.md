---
name: eval-pass-us-brand-ad1-locked
skill: brand-validator
expected: PASS (or PASS WITH WARNINGS at worst)
tests-for-rule: baseline known-good — the May 19 locked US Brand RSA Ad 1
last-known-pass: 2026-05-19
---

## Input — paste this exact copy into brand-validator

> [Paste the verbatim 15 headlines + 4 descriptions from `project_us_brand_rsa_ad1_locked_may19.md`]
>
> Validate against brand-validator. Score all 7 dimensions. Flag every HARD and SOFT violation with the exact phrase. Suggest rewrites for any violations.

## Expected output — checkable criteria

1. **Overall verdict: PASS** (or PASS WITH WARNINGS — never FAIL)
2. **Brand Alignment: 5/5** — this is the reference brand-aligned ad
3. **MathFit Accuracy: 5/5** — MathFit™ used correctly as brand term, no compound inventions, FUAR not in copy
4. **ICP Match: 5/5** — enrichment framing, K-12 NRI-leaning, parent-categorical voice
5. **Positioning: 5/5** — ladders to MathFit, not commodity tutoring
6. **HARD Violations: 0**
7. **SOFT Violations: 0-2 acceptable** — minor flags OK (e.g., "could add more concrete outcomes" or "headline 8 uses similar hook to 11"). Anything beyond 2 SOFT = re-grade the validator.

## Anti-pattern (fail mode)

If brand-validator flags ANY HARD violation on this input, the validator itself is drifting and needs recalibration. Compare its output to:

- `02-skills/forbidden-patterns.md` — does the flag match a rule in the catalog?
- The 6 voice signatures from the locked ad (We-voice, equation pattern, conversational lowercase, "Same" not "One", "Top" not "Top 1%", em-dash outcome triplet) — are any being mis-flagged?

If brand-validator returns FAIL on the known-good input, escalate to Naina before running it on new copy.

## What this catches

- Drift in brand-validator's own ban-detection logic
- Mis-flagging acceptable voice signatures as violations
- The validator being too aggressive on SOFT criteria

## Known-good reference

`project_us_brand_rsa_ad1_locked_may19.md` is the source. The 6 voice signatures and the 15/4/pinned structure are documented there. If the ad copy ever gets updated post-lock, update this eval's input too.
