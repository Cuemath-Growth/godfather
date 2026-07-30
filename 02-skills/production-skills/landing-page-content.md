# Landing Page Content — Production Skill

The production layer for Cuemath LPs. Invoked by Forge once strategy has decided what story to tell.

**Read order:**
1. `02-skills/lp-strategy.md` — what story for this audience, what beat sequence
2. `02-skills/format-manuals/lp.md` — operational constraints, per-market truth, word budgets
3. This file — variant principles, channel awareness, brief-loading
4. `02-skills/voice-canons/voice-{cell}.md` — final tonal pass

Reading this file *before* lp-strategy.md produces template-driven LPs. Don't.

---

## When this skill is invoked

Forge invokes this skill whenever:
- A brief's `content_type` is `landing_page`, OR
- Scout surfaces a Context Card with no LP attached, OR
- A winning ad in Sentinel points to an LP that's underperforming (message-match gap)

---

## Input

A **Context Card** from Scout (or a manual brief in the same shape):

```
MOMENT, WHEN, MARKET, AUDIENCE, HOOK, CHANNEL, PRIORITY
```

If any field is missing, ask before writing. Don't invent a moment.

Per `lp-strategy.md`, you also need before you draft:
- Notion LP Content Library — 2-3 canonical examples for this cell
- Godfather CPTD amber benchmark
- Trustpilot mining for this cell + intent
- `market-operational-models.md`
- The upstream ad that drives traffic to this LP

---

## Three modes of LP work

### Mode A · Net-new LP

Default when starting from scratch. Three variants, each testing a real story hypothesis. See "Variant principles" below.

### Mode B · Revision of a live LP

When the user names an existing Notion page or live URL. Single variant — audit-led, fold-by-fold iteration. The three-variant rule does not apply here.

### Mode C · Variant generation on a winner

When data shows the current LP is winning and we want to test new angles. Two variants (Stretch + Wild) testing genuinely different stories against the winner. Skip Safe — the current LP IS Safe.

---

## Variant principles (the rule, restated)

When you write three variants, they must differ on the *story*, not the *copy*. Three pages with the same narrative spine, different word choices, are one page written three ways. That's polish, not testing.

Variants test hypotheses about what moves the audience:

| Variant | Hypothesis it tests |
|---|---|
| **Safe** | Current winning ad theme + brand voice for this cell. Default for paid traffic where CPTD targets are tight. Lowest risk, lowest info. |
| **Stretch** | Same moment, fresh angle. Different validation pattern OR different mechanism emphasis OR different proof slice. Tests a real hypothesis. |
| **Wild** | Genuinely different framing of the same moment. Different hero archetype (e.g., influencer-mom POV vs founder POV vs child-outcome POV). High-risk, high-info. Kill it fast or scale it fast. |

**Differentiation test:** swap the variant labels. If you can't tell Safe from Wild from the copy alone, Wild isn't wild enough. Rewrite.

If you find yourself writing variants that share a narrative spine, stop. The differences must be architectural (per `format-manuals/lp.md` variation axes — opening promise, differentiator emphasis, proof slice, form scope, CTA repetition, outcome filter).

---

## Output — section spec per variant

For each variant, deliver these elements. Word caps are design-system constraints from `format-manuals/lp.md`, not opinions.

| Element | Spec |
|---|---|
| **Hero headline** | 6–10 words. Anchored in the moment + outcome. |
| **Hero subhead** | 1 sentence, 12-18 words. Expands the headline. RTB or specific proof. |
| **Proof block** | Choose what's winning in ads for this market right now — parent quote / parent video / number / star rating / logo wall. Don't default. |
| **Offer** | What we're giving (free 1:1 class / SAT diagnostic / strategy call). |
| **CTA copy** | 3–5 words. Verb-first. "Book a free 1:1 class" by default. HS exception applies. |
| **FAQ** | 4–6 Qs. Real parent objections, not soft questions. |
| **Vernac variant** | Only if market segment includes vernac speakers (India primary). |
| **Why this works** | One sentence per variant citing the data signal, Trustpilot pattern, or Context Card field that informed this variant's story. |

---

## Forge output format

A `forge_output.json` block per variant:

```json
{
  "variant": "safe | stretch | wild",
  "story_hypothesis": "[one sentence — what this variant tests vs the others]",
  "moment": "[from Context Card]",
  "market": "[from Context Card]",
  "audience_cell": "[market + sub-ICP + grade band]",
  "core_belief_tension": "[from lp-strategy.md Step 2]",
  "beat_sequence": "[list of beats in order, from format-manual menu]",
  "hero": { "headline": "", "subhead": "" },
  "proof_block": { "type": "parent_quote | testimonial_wall | number | star_rating", "copy": "" },
  "offer": "",
  "cta": "",
  "faq": [{ "q": "", "a": "" }],
  "vernac": null,
  "why_this_works": ""
}
```

---

## Hard rules — operational locks

These don't change. They're brand integrity, not style preferences.

1. **Message match is non-negotiable.** Hero must echo the upstream ad's promise. If the ad says "summer math camp," the LP can't open with "1:1 tutoring."
2. **Window-shopper test.** If a variant could be true for any ed-tech brand at any time, rewrite. The moment + market + audience must be specific enough that the LP only makes sense for *this* parent in *this* week.
3. **HS brief applies for grades 8–12.** K–6 brand voice for younger. See `05-reference/hs-performance-marketing-brief.md` and `05-reference/brand-voice.md`.
4. **MathFit anchor.** Every variant ladders to MathFit (FUAR for marketing copy: Fluency, Understanding, Application, Reasoning). Never reorder, never paraphrase the framework.
5. **No banned bleached words on hero / strap lines.** unlock potential · bright future · amazing · incredible · powerful · love for learning · world-class · transformative · empower · holistic · synergy.
6. **No "classroom," no "center."** Cuemath is online. Always.
7. **Buyer = honoree on holiday creative.** Mother's Day = honor mom's invisible work, not "gift Cuemath to mom." Father's Day same rule.
8. **Exclude Kiran + Rohini** from any creator references.
9. **Diaspora runs in US, never India.** NRI / Vernac / Chinese hooks are US LPs, not India LPs.
10. **Markets are silos.** US LP voice ≠ India LP voice ≠ AU LP voice. Don't translate — rewrite.
11. **Anchor in outcomes, not feelings.** What the child will be able to *do*, not how they'll *feel*.
12. **No guaranteed marks / grades.** No "easy math." No "quick results." No fabricated scarcity. No named competitors.
13. **Coach on brand surfaces, tutor on perf surfaces, teacher never** — except in verbatim testimonials.
14. **"Academic counsellor" parent-facing globally.** Never "Admissions Manager."

---

## Voice — principles, not banned-word lists

`lp-strategy.md` carries the full voice principles. The short version:

**When it's right, the LP sounds like a thoughtful coach talking to a thoughtful parent.**

Read-aloud questions before shipping any variant:

1. *Could TutorCo say this?* → Brand-flat. Rewrite until it's recognisably Cuemath.
2. *Would a parent at the school gate roll their eyes?* → Brochure. Rewrite as conversation.
3. *Do two sentences in a row share the same rhythm?* → Parallel "we don't / we do" structure. Break it.
4. *Does the closing line summarise the page back at me?* → Slogan. Cut it.
5. *Did I just use a word that means nothing specific?* → Bleached word. Replace with a concrete one.
6. *Is the headline true for any ed-tech?* → Generic. Rewrite for THIS cell, THIS week.

If a variant fails any of these, regenerate. Don't apologise and ship.

---

## Per-market context to load before writing

Per-market briefs (operational + parent-voice context). Read alongside the Context Card:

| Market | File | Why |
|---|---|---|
| **ME / MEA** | `05-reference/lp-planning/briefs/me-perf-creative-brief-2026-04-15.md` | 116 trial transcripts + 282 AC calls. IB/Cambridge priority boards. Parent quotes verbatim. |
| **AUS** | `05-reference/lp-planning/briefs/trial-mastery-archetypes.md` | 5 AU archetypes (NAPLAN Mum, Switcher, Panic Parent, OC/Selective Chaser, NRI Returner). Year 8 cap. **maths**. |
| **UK** | `05-reference/lp-planning/briefs/trial-mastery-archetypes.md` | 5 UK archetypes (11+ Mum, KS2 SATs Mum, GCSE Crisis, Indie Scholarship Chaser, NRI Returner). **maths** + **fee**. |
| **US / India / AUS / UK** | `05-reference/lp-planning/narratives/[market]-[period].md` | Decided narratives + creative ideas for the next 3 months. The hook anchor for every Context Card lives here. |

If the Context Card market is one of the above, **read the relevant brief and narrative file first**, then write.

---

## Channel awareness — read before writing

Always check `05-reference/lp-planning/media-plan/channel-mix-summary.md` to confirm:

1. **Is the Context Card's channel actually live for this market?** Don't brief LPs for channels that aren't running.
2. **BAU or experimental?** BAU (Meta, Google performance) → lead with **Safe** variant. Experimental (LinkedIn, TikTok, Taboola) → lead with **Wild** — experimental traffic is for learning, not optimisation.
3. **Brand or performance?** Brand awareness LPs (Meta/YouTube reach) skip the hard CTA and go story-first. Performance LPs run hook → proof → offer → CTA → FAQ.
4. **Does the channel format change the LP shape?**
   - **TikTok** — vertical-native, LP continues the TikTok hook visually. Short copy blocks, big visuals.
   - **LinkedIn** (India HS / IB) — formal, parent-as-professional, achievement-anchored. IB/IGCSE references. Higher trust signals.
   - **Taboola** — native discovery. LP must justify the click in the first 3 seconds (Taboola headlines are intentionally vague).
   - **WhatsApp / CTWA** — LP handoff to WhatsApp; CTA = "Talk to us on WhatsApp" not "Book a class."
   - **Instant Forms** — when LP is the destination, the form is the hero. Minimal scroll, form above the fold.

---

## See Also

- [[lp-strategy]] — **read this first** — story thinking, audience psychology, premium check
- [[format-manuals/lp]] — operational truth: per-market overrides, word budgets, beat menu
- [[voice-canons/voice-{cell}]] — final tonal pass
- [[coherence-protocol]] — ad ↔ LP ↔ nurture bridge
- [[brand-validator]] — pre-ship brand integrity gate
- [[01-agents/05-scout]] — provides the Context Card
- [[01-agents/03-forge]] — invokes this skill
- [[production-skills/meta-ad-copy]] — coherence pair
- [[production-skills/landing-page-email]] — the follow-up email, not the page
- [[05-reference/hs-performance-marketing-brief]] — mandatory for grades 8–12
- [[05-reference/brand-voice]] — brand voice bible

---

*Version 2 · 2026-05-13 · refactored from "section spec + hard rules" to "story-led variant principles + design constraints" · structure decisions moved to lp-strategy.md · revise as variant failure modes surface.*
