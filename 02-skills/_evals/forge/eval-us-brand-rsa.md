---
name: eval-us-brand-rsa
skill: forge
expected: pass with all 11 criteria
tests-for-rule: US Brand RSA build state + verified facts + forbidden-patterns §1.1, §1.2, §1.4, §2.1, §3.1, §6.5
last-known-pass: 2026-05-19 (Ad 1 locked)
---

## Brief / Input

> `/write rsa`
>
> Market: US (NRI-leaning, brand-keyword traffic)
> Audience: parents of K-12 students searching "cuemath" / "cuemath review" / "cuemath pricing"
> Surface: Google Ads, performance
> Spine: MathFit™ / Thinking
> Offer: 20% off annual plans
> Pricing: $20/class
> Trial CTA: Book a Free 1-on-1 Class
>
> Generate Ad 2 for the 3-ad rotation (Ad 1 is locked; Ad 2 should run the "Same Tutor" spine).

## Expected output — checkable criteria

The output must satisfy ALL of these:

1. **Headline count** — 15 headlines (no more, no fewer)
2. **Description count** — 4 descriptions (no more, no fewer)
3. **Pinning** — 3 pinned to position 1, 3 to position 2, 1 to position 3 (default brand-search structure)
4. **Char limits** — every headline ≤ 30, every description ≤ 90
5. **No Top 1% as standalone trust badge** — if "Top 1%" appears, it's paired with a mechanism (per `forbidden-patterns.md` §1.4); never as a generic credibility line
6. **No Indian Tutors / Indian Experts / ethnicity-led tutor framing** — HARD BAN
7. **No remediation framing** — no "C to A+" / "Fix Math Gaps" / "Struggling" / "Behind in Math"
8. **Verified facts only** — $20/class (NOT $16), 20% off (NOT 30%), 200,000+ students, 400,000 parents, "Built by IIT & Stanford alumni", "Aligned with US Common Core", "Book a Free 1-on-1 Class" as CTA
9. **Parent-categorical voice** — no "she" / "he" / "her" / "his" anywhere; always "your kid / your child"
10. **One stat max per ad line** — no stat-stacking (e.g., "400K parents and 200K students" in one headline)
11. **Spine consistency** — every headline + description ladders to the "Same Tutor" spine; no wedge-as-suffix duplicates of Ad 1

## What this catches

- May 19 wedge-as-suffix mistake (made TWICE in one day on brand Ad 3 + NRI Ad 1)
- The $16 vs $20 pricing fabrication
- The "30K applicants" stat fabrication
- Ethnic-identifier slip on NRI ad groups (the May 20 substitution-stack pivot)
- "She/he" pronouns sneaking into US copy

## Known-good reference

`project_us_brand_rsa_ad1_locked_may19.md` in memory has the locked Ad 1 verbatim. Pattern-match the structure (15h/4d, pinned 3/3/1, 6 voice signatures: We-voice, equation pattern, conversational lowercase, "Same" not "One", "Top" not "Top 1%", em-dash outcome triplet).

If Ad 2 differs structurally from Ad 1 in any way other than spine substitution, that's a fail.
