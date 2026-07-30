---
name: eval-fail-slot-mismatch-headline
skill: brand-validator
expected: FAIL (slot-mismatch flag) — line is fine, slot is wrong
tests-for-rule: forbidden-patterns §3.2 (Brand-atom / close-card lines in headline slot)
last-known-pass: rule re-categorised May 19 (slot mismatch, not philosophy)
---

## Input — paste this exact copy into brand-validator

> **Headline 1:** Tricks Fade. Understanding Compounds.
> **Headline 2:** If She Can Explain Why, She'll Never Forget How
> **Headline 3:** Same Cuemath Coach. Every Single Class.
> **Description 1:** 1-on-1 online math tutoring for grades K-12. $20/class. Book your free trial today.
>
> Validate against brand-validator.

## Expected output — checkable criteria

1. **Overall verdict: FAIL** (slot-mismatch is a HARD-equivalent violation per §3.2)
2. **Violation flagged per headline, with slot-mismatch reasoning:**
   - "Tricks Fade. Understanding Compounds." — flagged as brand-atom line in headline slot. ALSO: phrasing issue ("understanding compounds" is technical/abstract — not layman parent speech). Dual violation.
   - "If She Can Explain Why, She'll Never Forget How" — flagged as outcome line in headline slot. ALSO: contains "she/her" pronouns (US RSA market rule forbids she/he regardless of frame — see forbidden-patterns §3.1).
   - "Same Cuemath Coach. Every Single Class." — flagged as literal close-card hoisted to headline. Brand atom belongs at close (and only on brand films per §6.4).
3. **Suggested rewrites point to slot map** —
   - Headline slot should carry PAIN (parent's worry) or HOOK (specific scroll-stop situation)
   - Subline carries MECHANISM (what Cuemath does)
   - Close-card carries BRAND ATOM (after the click is earned)
4. **Validator demonstrates understanding of slot taxonomy** — output references "slot mismatch" or equivalent, not "philosophical" / "too abstract" / "too long."

## Anti-pattern (fail mode for the validator)

- Returns PASS — validator missing §3.2
- Flags as "headline too long" (a char-count concern) instead of slot-mismatch (the actual rule)
- Suggests rewriting the LINE rather than moving it to the right slot (these are good lines in the wrong place — the line stays, the slot changes)

## What this catches

- May 19 re-categorisation by Naina: the May 12 "philosophy-as-opener" framing was wrong — actual rule is slot mismatch
- Mis-categorising the rule pulls validator output in the wrong direction (rewrites instead of relocations)

## Known-good usage of these lines

These lines aren't bad — they're misplaced. Acceptable usage:
- "Tricks fade. Understanding compounds." → close card for a brand film. ALSO: rewrite "understanding compounds" to a layman variant before shipping even at close. ("Understanding sticks." / "Understanding lasts.")
- "If she can explain why, she'll never forget how." → close card / brand atom on parent-voice testimonial. For US RSA, replace "she" with "your kid."
- "Same Cuemath Coach. Every Single Class." → close card for brand films ONLY (per §6.4). Not for Meta, RSA, LP, UGC.

## Known-good reference

- forbidden-patterns §3.2 (slot map: Headline=PAIN, Subline=MECHANISM, Close=BRAND ATOM)
- forbidden-patterns §3.1 (US RSA she/he rule)
- forbidden-patterns §6.4 (brand-films-only scope on May 10 close card)
