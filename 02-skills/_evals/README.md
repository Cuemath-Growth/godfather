# Evals — Forge + Brand Validator

Golden test cases for the two highest-leverage skills in the stack. Run when:

- A skill file changes (Forge, brand-validator, forbidden-patterns, voice canons)
- A new failure mode gets caught in production
- Naina is away >1 week (drift check on return)
- Any team member onboards and wants to verify their setup matches Naina's

## Why these exist

Forge and brand-validator are the two surfaces where voice drift would ship to clients before anyone noticed. Without evals, drift only surfaces when Naina or a senior reviewer catches it post-ship — usually 1-3 weeks late. Evals catch drift at the point of change.

The pattern follows Anthropic's `skill-creator` eval loop: each eval has an input (brief or copy), an expected behavior (pass / fail / specific output property), and a why-it-matters note tying back to a real past failure.

## How to run

Two modes — pick by intent.

### Mode 1: Quick spot-check (10 min)

Pick 2-3 evals across both skills. Paste the input into a Claude Code session. Compare output against the expected criteria. Note any failures.

### Mode 2: Full sweep (45 min)

Run all 11 evals in sequence. Log results in a table (pass / fail / partial). Update `_evals/last-run.md` with the date, who ran it, and any failures. If anything failed: open `forbidden-patterns.md` and check whether the failure indicates a rule that's missing or unclear.

## Pattern (every eval file follows this)

```markdown
---
name: eval-<descriptive-slug>
skill: forge | brand-validator
expected: pass | fail | specific-behavior
tests-for-rule: <which rule from forbidden-patterns.md or which Forge frame>
last-known-pass: <date>
---

## Brief / Input
[Exact prompt or copy to test]

## Expected output
[What the right behavior looks like — specific, checkable criteria]

## What this catches
[The real-world failure mode this guards against]

## Known-good reference
[Verbatim past output that passes, if any]
```

## When you catch a new failure mode

1. Add it to `forbidden-patterns.md` first (the catalog is canon).
2. Write a new eval here that exercises that specific failure.
3. Update `last-run.md` after running all evals.

## Files

```
_evals/
├── README.md          ← you are here
├── last-run.md        ← log: date / who / pass-rate / failures (create on first run)
├── forge/
│   ├── eval-us-brand-rsa.md
│   ├── eval-nri-generic-substitution.md
│   ├── eval-tutor-on-camera-reel.md
│   ├── eval-influencer-no-past-script.md
│   └── eval-india-lp-single-usp.md
└── brand-validator/
    ├── eval-pass-us-brand-ad1-locked.md
    ├── eval-fail-indian-tutors-hard-ban.md
    ├── eval-fail-remediation-c-to-aplus.md
    ├── eval-fail-mathfit-compound-invention.md
    ├── eval-fail-slot-mismatch-headline.md
    └── eval-pass-top1pct-with-mechanism.md
```

This is v1. Add evals as new failure modes surface — the suite should grow with the stack.
