---
name: eval-india-lp-single-usp
skill: forge
expected: pass with single-USP-per-fold + verified-only facts + fold-5 outcomes structure
tests-for-rule: LP-16 restructure (May 7) + feedback_lp_request_triage (May 10) + verified-facts discipline
last-known-pass: 2026-05-07 (LP-16 restructured)
---

## Brief / Input

> `/write lp`
>
> Notion destination: India LP Library (LinkedIn premium variant)
> Audience: India urban premium parent (LinkedIn-sourced, post-LinkedIn ad)
> Grade range: 6-12
> Pricing: ₹800/class + GST (verified May 7)
> Spine: Premium, parent-driven decision, ladder to MathFit + tutor-as-coach
> Length: 5-6 folds

## Expected output — checkable criteria

1. **Single USP per fold** — each fold makes ONE argument. No multi-USP folds. (LP-16 Fold 4 was deleted May 7 for multi-USP violation; same trap.)
2. **Hero fold** — leads with "personalised" (per LP-16 pending fix). Verified parent-language word from Trustpilot mining.
3. **Fold 2 Card 3** — does NOT lead with "engaging" / "gamified" (LP-16 pending fix per memory). Lead with depth / understanding / clarity instead.
4. **Fold 5 — Student Outcomes** — sourced from `cuemath.com/en-in/our-impact` (per May 7 swap). Use real students, real grade ranges, real wins. Min 5 cards per `feedback_min_5_testimonials.md`.
5. **Verified-only facts** — IIT/Stanford alumni IS verified. "30,000 applicants" is INVALID (caught May 7). Pricing ₹800/class + GST is verified. No invented stats.
6. **No remediation framing** — even in India enrichment-category messaging.
7. **No fold-deletion-induced gaps** — if Fold 4 was deleted historically, the remaining folds must read continuously without a missing-argument hole.
8. **Closing fletch present** — LP-16 was missing this (pending fix). The bottom-of-page should have a brand close that lands AFTER the page argument is earned.
9. **FAQs** — accurate to current operational model (3/6/12-month plans, 55-min class, academic counsellor flow). No conflicting policy statements.
10. **No code-side images / no embedded WebP** — LP PRs add ZERO image files (per `reference_package_leap_image_pipeline.md`). CDN URLs only.

## Workflow check

- LP-16 host is `leap.cuemath.com/bau/ind-pricing-bau` (not performance-website per May 13 PR closure correction). Verify host before any PR.
- Output drafted to Notion LP Library FIRST. Review with Naina BEFORE pushing to code.
- 8-segment slug confirmation: `Domain/Acquisition/User-Flow/Country/Channel/Topic/Ethnicity/Action` — confirm slot values with Naina if any are ambiguous.

## What this catches

- Multi-USP folds (LP-16's Fold 4 trap)
- "Engaging / gamified" leading instead of depth (current LP-16 pending issue)
- "30K applicants" or other invented stats slipping in
- Skipping closing fletch
- Pushing to wrong host (the PR #1906 close-in-error)
- Adding image files to PR (out-of-band image pipeline ignored)

## Known-good reference

- LP-16 current state: `project_lp16_ind_pricing_bau_in_progress.md` — last commit `3c4b8c845` has board field removed + Rs.800 pricing + neighbour typo fix
- 9-phase workflow at `package-leap/.claude/skills/landing-page/SKILL.md`
- LP inventory sheet: `10tXqFrZKyDeQ5EtCB4XPcnxGI5SkzQ8r08sTJCWC5sQ`
