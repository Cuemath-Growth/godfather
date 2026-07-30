---
name: eval-fail-remediation-c-to-aplus
skill: brand-validator
expected: FAIL with HARD violation flagged for remediation framing
tests-for-rule: forbidden-patterns §1.2 (Enrichment, not remediation)
last-known-pass: rule confirmed May 19
---

## Input — paste this exact copy into brand-validator

> **Headline:** From C to A+ with Cuemath
> **Headline:** Fix Your Child's Math Gaps Fast
> **Description:** Is your child struggling in math? Cuemath helps kids go from failing to top of class. 1-on-1 online tutoring, $20/class.
>
> Validate against brand-validator.

## Expected output — checkable criteria

1. **Overall verdict: FAIL**
2. **HARD Violation flagged with exact phrase:**
   - "From C to A+" — flagged for remediation framing
   - "Fix Your Child's Math Gaps" — flagged for same rule
   - "Is your child struggling" — flagged for starting-point-test failure
   - "From failing to top of class" — flagged for same rule
3. **Reason cited matches forbidden-patterns §1.2** — references either: (a) only 2.2% of US/NRI audience describes their child as struggling, (b) 96%+ of audience is enrichment not remediation, (c) repels real ICP / attracts price-sensitive shortcut-seeker (anti-ICP), or (d) starting-point test ("does this line imply the child is currently underperforming?")
4. **Suggested rewrites provided** pointing to enrichment alternatives:
   - "Excel in School with Cuemath" / "Master Math with Cuemath" / "Get Ahead in Math"
   - "Deepen Math Understanding" / "Build Strong Math Foundations"
   - "Want Stronger Math? Try Cuemath" (instead of "Struggling?")

## Edge case — testimonial exception

If the input were FRAMED as a parent testimonial (e.g., "My daughter went from a C to an A+ — and now she actually explains her work"), brand-validator should NOT fail it. Parent-voice testimonials describing a real transformation ARE allowed per forbidden-patterns §1.2 Exception clause. Make sure the validator checks WHO is speaking before flagging.

If validator flags the parent-testimonial version as HARD violation, that's over-aggressive — the rule is *Cuemath's self-framing of itself*, not parent-voice transformation stories.

## Anti-pattern (fail mode for the validator)

- Returns PASS — validator missing the §1.2 rule entirely
- Flags only "$20/class" (verified-fact, not a violation) — validator wrong-target
- Flags as SOFT instead of HARD — under-categorising

## What this catches

- The May 19 "From C to A+ Made Easy" lift from an old top-performing ad (10.33% conv rate). The rule explicitly states: even high-CTR remedial framing should be killed because it brings the wrong segment in.

## Known-good reference

- `feedback_enrichment_not_remediation_us.md` (the original May 19 catch) — now absorbed into forbidden-patterns §1.2
- ICP guide — confirms 96%+ enrichment audience
- `reference_creative_direction_doc.md` — brand bible: "Make math meaningful, not easy"
