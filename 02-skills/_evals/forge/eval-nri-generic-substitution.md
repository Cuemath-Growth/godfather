---
name: eval-nri-generic-substitution
skill: forge
expected: pass with substitution-stack output, no ethnic identifiers, no spec-sheet voice
tests-for-rule: forbidden-patterns §1.1 (Indian Tutors HARD BAN) + Cuemath brand voice (May 20 Tesla pushback) + NRI substitution rule (May 19)
last-known-pass: 2026-05-20 direction locked, ads pending rebuild
---

## Brief / Input

> `/write rsa`
>
> Market: US NRI (Indian-American parent, first-gen + second-gen blended)
> Audience: parents searching "indian math tutor" / "math tutor for indian kids" / "online math tutor for desi kids"
> Surface: Google Ads, performance, generic ad group (no brand keyword)
> Spine: Substitution stack — translate the ethnic-identifier search intent into Cuemath's substitute signals
>
> Generate 3 ads for the generic NRI rotation.

## Expected output — checkable criteria

1. **No "Indian Tutors" framing** — anywhere, in any headline or description. HARD BAN regardless of search keyword.
2. **No "Indian Experts" / "Indian-Trained" / "India's Best Tutor"** — same rule.
3. **Substitution-stack signals present** — at least one ad uses each of: IIT & Stanford alumni (curriculum lineage = ethnic credibility substitute), $20/class (price = affordability substitute), 4.9★ rating (trust substitute), AMC/AP/SAT (test-prep substitute where relevant). The brand "Cuemath" IS the India-origin signal — the copy should not repeat the ethnic identifier.
4. **No Tesla voice / spec-sheet voice** — banned per May 20 catch:
   - No "Live 1:1 — Never Recorded" style spec-sheet headlines
   - No anti-competitor jabs ("Unlike Wyzant…", "Not like other tutors…")
   - No B2B SaaS feature-stacking
5. **Kid-centered / parent-trusted / warm-confident voice** — subject of headline is the kid or the parent or Cuemath, not the product feature
6. **5-test voice check passes** — per `feedback_cuemath_brand_voice.md`: subject / warmth / no anti-frame / no spec-sheet / uses 1+ of 6 locked voice signatures
7. **3 ads structurally distinct** — different Pos 2 leads, no cross-ad accidental duplicates, no in-ad permutation overlap (per `feedback_rsa_preflight_audit.md`)
8. **Verified facts only** — same as eval-us-brand-rsa (#8)
9. **Parent-categorical voice** — no she/he

## What this catches

- The May 19 ethnic-identifier slip on NRI Ad 1 (used "Indian" framing despite HARD BAN)
- The May 20 Tesla / spec-sheet drift ("Live 1:1 — Never Recorded" style)
- Substituting ONE signal (e.g., price only) instead of building the full stack

## Known-good reference

`project_nri_generic_build_state.md` — Direction Option A locked May 20. 3 ads pending rebuild after spec-sheet/Tesla drift caught. Voice signatures + open items in that file.

## Cross-check after output

Paste Forge's output back and run `/write audit nri` — the NRI variable scorecard should grade it on coach_tenure_signal, three_beat_compliance, outcome_anchor, mathfit_dimension. Anything below threshold = re-draft.
