# Cuemath ME — Curriculum-specific Landing Pages

Built May 4, 2026 per the May 5 alignment brief. Five LP variants for ME perf campaigns, each aligned to a curriculum sold in UAE / KSA / wider ME international schools. Premium baseline design (clean white surface, yellow primary, generous whitespace) — drops the India-themed motifs of the legacy LP.

## Variants

| File | Curriculum | Hero hook | Primary audience |
|---|---|---|---|
| `ib.html` | IB DP (and full IB stack) | "Math builds on math. Is your child's foundation strong enough?" | IB families, MYP Grade 6+ and DP. Highest-converting board (36% vs 14% baseline). |
| `cambridge.html` | Cambridge / IGCSE | "Concepts, not calculator hacks." | Cambridge Primary, Lower Secondary, IGCSE. Multi-child households. |
| `myp-pyp.html` | IB PYP & MYP (younger) | "Build the foundation while your child still enjoys math." | Younger IB students (PYP, lower MYP). Joy-first, enrichment-friendly. |
| `american.html` | American (Common Core / AP / SAT) | "Classroom math is the floor. Build the ceiling." | US-curriculum schools in UAE / KSA. Competition + college-track depth. |
| `british.html` | British / UK National Curriculum + GCSE / A-Level | "A maths tutor who actually knows the British curriculum." | British schools in ME. UK English ("maths", "fees"). |

All five share `styles.css` (premium baseline). Edit one HTML without touching the others.

## What's the same across all five

- Pricing: **60 AED/class** (monthly plan, no annual lock-in)
- CTA: **Book a FREE 1:1 class**
- Trustpilot 4.9 + 200,000+ students + 80+ countries proof bar
- Form fields: parent name, email, WhatsApp/phone (with ME country codes), child's grade
- Continuity promise (same teacher every class)
- Sibling discount mention
- WhatsApp summary line — handles the "I'll discuss with my partner" objection from the Apr 15 brief
- Final CTA section, dark surface
- No India-themed copy, motifs, or imagery

## What differs per variant

- Curriculum pill in hero (e.g., "For IB families in the Middle East")
- Hero headline + sub
- Grade dropdown options (PYP/MYP/DP vs Year 1–13 vs K–12 etc.)
- "Built for the [X] curriculum" section copy
- Parent quote (one per LP, drawn from the Apr 15 ME parent-voice brief)
- FAQ — tuned to the objections specific to that curriculum
- Hidden form field `curriculum=` so leads are tagged in CRM

## Form wiring (handoff for engineering)

Each form posts to `action="#"` as a placeholder. Engineering needs to:

1. Wire `action` to the trial-booking endpoint (same one the legacy ANZ/India LPs use)
2. Pass `curriculum` and `market` hidden fields through to CRM tags
3. UTM-pass-through: ensure `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` carry from the URL into the lead row
4. WhatsApp opt-in confirmation: trigger the post-trial WhatsApp summary template

## Suggested URL structure (for Meta ads)

```
class.cuemath.com/perf/me/ib/
class.cuemath.com/perf/me/cambridge/
class.cuemath.com/perf/me/myp-pyp/
class.cuemath.com/perf/me/american/
class.cuemath.com/perf/me/british/
```

This keeps the URL legible to parents and clean to read inside Meta. Vamsi's targeting filters (Indian ethnicity + international board + premium) can map cleanly: e.g., Indian-ethnicity-IB audience → `ib.html`; non-Indian ethnicity-IB → same page (the LP is curriculum-aligned, not ethnicity-aligned).

## Source of voice

Every parent quote and FAQ on these LPs is grounded in the Apr 15 ME Performance Marketing Parent Voice Brief (`05-reference/lp-planning/briefs/me-perf-creative-brief-2026-04-15.md`) — built from 116 trial transcripts + 282 pre-trial AC calls. Nothing invented.

## Testing checklist (before going live)

- [ ] Form submits to live endpoint and creates a CRM lead with curriculum tag
- [ ] WhatsApp summary fires post-submission
- [ ] All five LPs render on mobile (375px viewport, dominant traffic)
- [ ] All five LPs render on desktop (1440px)
- [ ] Trustpilot count + ratings match current public claims
- [ ] No "India" / "₹" / India-themed motifs anywhere — including OG tags and meta description
- [ ] Pricing reads "60 AED/class" everywhere (not "25% off", not "12+3")
- [ ] CTA reads "Book a FREE class" or "Book my free class" — never "Sign up", "Get started"
- [ ] Page loads in <2.5s on 4G

## Live by

Wed May 7 (Naina, per action items in May 5 alignment).

## What's not here yet (deferred)

- Brand-awareness variant (separate from performance) — for Meta reach / YouTube. Different page, story-first, no hard CTA. Build once perf LPs are live and learning.
- Ethnicity-tuned creative pairing layer — pending Gokul's ethnicity-conversion analysis (Meta vs Google) per his action item.
- LP-level A/B copy variants (Safe / Stretch / Wild per the Forge framework) — these five are the Safe baseline. Stretch and Wild come after week 1 data lands.
