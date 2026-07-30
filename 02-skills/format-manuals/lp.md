# LP — format manual

Operational truth for Cuemath landing pages. Read this *after* `lp-strategy.md`, not before.

This file does not tell you what to put on the page. Strategy decides that — story first, fold sequence second. This file tells you the *operational constraints* every LP has to honour once you know what you're saying: currency, curriculum, exam-prep cycle, follow-up role, visual locks, voice locks, and the per-fold word budgets the design system can actually carry.

The KPI is CPTD via form-completion rate × trial-attendance rate. The LP is where the ad's promise either gets reinforced or breaks. **Coherence is the entire game** — but coherence is a strategic decision, not a formatting one. This file gives you the operational guardrails after strategy has made the coherent decision.

---

## When this manual applies

You're writing an LP when all of these are true:
- Surface = a destination page after an ad click or organic search
- Format = scrollable, fold-by-fold, with a form as the conversion event
- Production host = either `class.cuemath.com/perf/{region}/{segment}/signup` (performance-website, Astro) OR `leap.cuemath.com/{bau|lp}/{slug}` (@cuemath/leap consumer)
- Audience cell = mapped to one market + sub-ICP + grade band

Before drafting: check the LP inventory sheet `10tXqFrZKyDeQ5EtCB4XPcnxGI5SkzQ8r08sTJCWC5sQ` to confirm which host this LP lives on. They're different repos, different workflows.

If the work is a Notion-only LP brief for review, write in the Notion LP Content Library DB first (default destination per [[feedback_notion_default_lp_destination]]). Only ship to package-leap or performance-website when engineering deploys are confirmed.

---

## Physics of this surface

| Property | Reality |
|---|---|
| Read context | Parent has clicked. Active intent. More attention than Meta, less than a sales call. |
| Time budget | **First 5 seconds of scroll decides whether they keep going.** Opening fold has to confirm the ad's promise within those 5 seconds. |
| Scroll behaviour | F-pattern on desktop, single-column on mobile. Mobile is 70%+ of traffic. |
| Trust state | Already warmed by the ad. Now in "show me proof" mode. |
| Conversion event | Form submission. Field count drives completion rate. |
| Production constraints | CDN images only (cloudfront.net/static/website-v3/) — LP PRs add ZERO image files. Component pool comes from package-leap. |

---

## Story beats (not a fold template)

Strategy (`lp-strategy.md`) decides which beats to use, in what order, for this audience and this intent. This is the menu of beats the design system supports, with the operational job of each. **You pick from this list — you don't follow it in order.**

| Beat | The parent's question it answers | Operational job |
|---|---|---|
| **Opening** | "Is this the thing I clicked for?" | Echo the ad's promise within 5 seconds. CTA visible. |
| **Validation** | "Does Cuemath understand what I'm worried about?" | Mirror the Core Belief Tension in the parent's own language. |
| **Mechanism** | "How does Cuemath actually work?" | The Cuemath Way made visible — Cue-don't-tell, MathCanvas, MathGym. Show the screen + the coach. |
| **Tutor** | "Who's actually teaching my child?" | Named coaches. Real photos. Market-appropriate credentials. |
| **Proof** | "Has this worked for kids like mine?" | Trustpilot-verified testimonials, named-kid outcomes, Achievers/MathfitCommunity carousels. Filter by market + intent. |
| **Comparison** | "Why Cuemath and not the alternative I'm already considering?" | Characteristic-based competitor framing. Never names. |
| **Curriculum / scope** | "Does this cover what my child needs?" | Per-market boards + exam-prep cycle. Operational truth. |
| **FAQ** | "What do I still need to know?" | Real objections — fee, format, schedule, refund, follow-up. Per-market specifics. |
| **Form** | "How do I take the next step?" | Form fields per market. Trust signal density above form. |
| **Close fletch** | — | *"Same Cuemath Coach. Every Single Class. Making Your Child MathFit™."* Verbatim. |

Common sequences you'll see — none of them mandatory:

- **Canonical (cold TOFU, broad audience):** Opening → Validation → Mechanism → Proof → Curriculum → Tutor → Proof (wall) → FAQ → Form → Close
- **Proof-first (high-intent results-driven: Selective, 11+, NAPLAN, AMC):** Opening → Proof → Tutor → Mechanism → Comparison → Curriculum → FAQ → Form → Close
- **Pricing-led (BOFU, premium-tier comparison shoppers):** Opening → Pricing → Mechanism → Proof → Tutor → FAQ → Form → Close
- **Story-first (UGC/influencer handoff):** Opening (continuing the influencer's hook) → Mechanism → Proof → Form → Close

Pick what serves the story. Skip beats that don't move the audience forward. Repeat beats if proof needs more than one rendering.

---

## Per-fold body-word budgets (design-system constraint)

These are not opinions — they're what the design components can actually carry. Exceed them and your copy either gets truncated or your fold turns into a blog block.

| Beat | Component shape | Body word cap |
|---|---|---|
| Opening | Hero (image / split / video / text-only variants) | Headline 6–10 · Subhead 12–18 · CTA 3–5 |
| Validation | Single statement + optional supporting line | 20–35 |
| Mechanism | 3 steps with icons + 1-line each | 3 × 15–25 |
| Tutor | Cards 1-up / 2-up / 3-grid | Single card 80–120 · grid card 25–40 |
| Proof | Testimonial wall / single / carousel | Wall 40–60 each · single 120–180 · carousel 80–120 |
| Comparison | Table | Intro 1 line + table + closing 1 line |
| Curriculum | Dropdown list + brief intro | Intro 1 line + list |
| FAQ | Accordion | Q 6–12 each · A 30–60 each |
| Form | Fields + sub-headline | 0 body copy in the form itself; trust signals above are 10–20 words |
| Close fletch | Locked banner | Verbatim only |

**Failure mode:** Body copy exceeds fold cap → design slot truncates the message, fold becomes blog-density, page reads "stuffed." The cap is the discipline.

---

## Per-market overrides (operational truth — prescriptive)

This section IS prescriptive — it's operational reality, not style choice.

### India (Tier-1 metro CBSE/ICSE + Premium IB/IGCSE — K-8)

| Concern | India operational truth |
|---|---|
| Currency | ₹ only · 18% GST disclosed |
| Pricing range | ₹26K-₹124K per tenure × frequency grid |
| Curriculum | CBSE · ICSE · IB · IGCSE/Cambridge (single dropdown entry) · American · British |
| Exam-prep | IMO · Cueprep · Olympiad cycle. **No K-8 board exam prep** (boards are Class 10/12). |
| Form fields | Grade · board · current school · current performance · WhatsApp number (primary contact channel) |
| Follow-up role | Academic counsellor |
| Tutor framing | India-based · Indian first names OK as audience-recognition |
| Spelling | **maths** (British/Indian) |
| Channels routed in | Meta · Google · WhatsApp · LinkedIn (premium audience) |
| Visual locks | NO group classroom · NO cartoonish illustrations · NO parent-kitchen-moment (doesn't land in India) |
| Voice notes | Vernacular phrase OK in subline / parent-quote moments. NOT "personalised" as hero lead — only in body. |

### US (First-gen + Second-gen + East Asian — K-12, only HS market in Cuemath)

| Concern | US operational truth |
|---|---|
| Currency | $ USD (note: en-us/pricing page currently displays INR — bug; on LPs always show USD) |
| Curriculum | Common Core + AP / SAT / ACT / AMC / MATHCOUNTS / STAR (TX) / GT cohort |
| Exam-prep | SAT (HS-only CTA exception: "Free SAT diagnostic" per CD v1 §5) · AP · AMC · MATHCOUNTS |
| Form fields | Grade · current course (Algebra 1, Geometry, Algebra 2, Pre-Calc, AP Calc — for HS) · target outcome · zip code |
| Follow-up role | Academic counsellor |
| Tutor framing | Tutors named. NRI-friendly cultural fit OK as life-context signal, NEVER as "Indian-trained" framing. |
| Spelling | **math** (US) |
| Channels routed in | All 4: Meta · YouTube · Google · LinkedIn/Reddit/NextDoor/WhatsApp (community plays NEW) |
| Visual locks | NO "Indian-trained" framing · NO Indian-tutor visuals as a selling point · NO group classroom. Audience-recognition kid visuals (NRI / EA / Anglo per cell) OK. |
| HS-specific | FUAR vocabulary per CD v1 §3 in body. CTA may be "Free SAT diagnostic" or "Free strategy call" for 9-12. |

### UK (Settled UK Asian + Anglo-British — K-8)

| Concern | UK operational truth |
|---|---|
| Currency | £ |
| Pricing range | £390-£1,872 per tenure × frequency grid |
| Curriculum | UK National Curriculum (single dropdown for England NC / Scotland CfE / Wales / NI — never split) · IGCSE · IB (PYP/MYP) |
| Exam-prep | 11+ (primary) · KS2 SATs (Y6 May) · 7+/8+/13+ indie school entry (Nov-Jan). **NOT GCSE / A-Level** — out of K-8 cap. |
| Form fields | Year · target school/grammar (optional) · 11+ exam date (where applicable) · postcode |
| Follow-up role | Academic counsellor |
| Tutor framing | UK-based or IN time-zone-matched. UK credentials (PGCE, NCETM) when available. |
| Spelling | **maths** · **mum** · **Year X** · **fee** |
| Channels routed in | Meta + Google only |
| Visual locks | NO cartoonish illustrations · NO group classroom · NO parent-kitchen-moment · NO "Indian-method" / "Indian-rigour" framing |
| Positioning rule | School maths + 11+ in one plan, one coach. **NEVER "11+ specialist."** Headlines should contrast: "Not Just An 11+ Tutor" / "Year 3 to GCSE. 11+ Is One Chapter." |

### AU (Indian-Australian + East Asian + Anglo-Australian — K-8)

| Concern | AU operational truth |
|---|---|
| Currency | A$ |
| Pricing range | A$728-A$3,510 per tenure × frequency grid · higher tenure = higher discount |
| Class duration | 55 min (global standard) · parent app + 8-session conference cadence |
| Curriculum | Australian Curriculum (ACARA) · NSW (NESA) · Victorian (VCAA) · WA (SCSA) · NZ Curriculum · MOE Singapore · IB · IGCSE / Cambridge. State-specific dropdown. |
| Exam-prep | NAPLAN (Y3/5/7/9 March — in-season Feb-Mar only) · OC Test (Y4→Y5 May NSW) · Selective Schools (Y6→Y7 May NSW+other states) · Scholarship exams (Y5-6 May ACER/Edutest/AAS). **NOT NZ NCEA · NOT SG PSLE.** |
| Form fields | Year · state · target test (NAPLAN/OC/Selective/Scholarship) · postcode |
| Follow-up role | Academic counsellor |
| Tutor framing | IN-based, AU/NZ/SG time-zone-matched. AU-curriculum-trained framing. |
| Spelling | **maths** · **mum** · **Year X** |
| Channels routed in | All 4: Meta · Google · YouTube · WhatsApp/community |
| Visual locks (Naina May 13 — tight) | **NO real kids in AU context** · NO parent-kitchen-moment · NO Indian-method framing · NO group classroom |
| Allowed visuals | Product / platform interface · outcome visuals ONLY |
| Positioning rule | School maths + exam in one plan. **NEVER "NAPLAN specialist" / "Selective specialist."** NAPLAN out-of-season (May-Oct) = no NAPLAN-anchored creative. |

### MEA (Indian/South Asian + Western expat + nominal Arab — K-8)

| Concern | MEA operational truth |
|---|---|
| Currency | AED (د.إ) |
| Pricing range | د.إ1,950-د.إ9,360 per tenure × frequency grid |
| Curriculum | IB · Cambridge · MYP-PYP · American · British (5 LPs shipped May 4). KHDA UAE not currently surfaced. |
| Exam-prep | IGCSE / IBDP transitions (mentioned, not packaged) · IMO + Cueprep universal. No MEA-specific packaging. |
| Form fields | Year · curriculum board · emirate (UAE only) · contact channel |
| Follow-up role | Academic counsellor |
| Tutor framing | IN-based, MEA time-zone-matched · international curriculum-trained |
| Spelling | **maths** (international expat register) |
| Channels routed in | Meta · Google · YouTube |
| Visual locks | NO South Asian cultural framing · NO Indian-tutor visuals · NO parent-kitchen-moment · NO outcome-led visuals (bank too thin) · NO group classroom |
| Allowed visuals | Product / platform interface · real expat kids in international school context ONLY |
| Voice notes | Neutral expat English · no vernacular · single voice canon |
| Outcomes constraint | Verified MEA outcomes bank is thin — Trustpilot quotes as substitute proof OK |

---

## Intent narrowing for single-moment LPs

When an LP targets one high-intent moment (Selective / 11+ / NAPLAN-anchored / AMC / AP / Olympiad / IB transition), the audience-cell psychology applies — but every beat narrows to that moment.

| Beat | Standard | Narrowed |
|---|---|---|
| Proof | All market outcomes | Only the test the LP targets |
| Curriculum | All boards | Boards relevant to that test (e.g., NSW NESA for NSW Selective) |
| Tutor cards | All coaches | Coaches with documented track record in that test |
| FAQ | All objections | Objections specific to that test prep |

**Cross-intent contamination ban:** A Selective LP cannot mention NAPLAN even if both are AU. A NAPLAN LP cannot mention AMC even if both are competition-adjacent. **One page, one moment.**

If the narrow-intent testimonial pool is < 5, escalate to per-market Acads for fresh harvest. Do not soften the filter to fill the wall.

---

## Lock / Free / Anchor per funnel stage

### TOFU LPs (cold traffic — "What is Cuemath?")

**Locked (operational):**
- Opening beat answers the click within 5 seconds
- Close fletch verbatim
- CTA = "Book a free 1:1 class" (HS exception: "Free SAT diagnostic")
- Min 5 Trustpilot-verified proof cards, gold-standard format
- Per-market currency / curriculum / exam-prep accuracy (no cross-market borrowing)
- IGCSE / Cambridge = single dropdown entry (never split)
- "Academic counsellor" parent-facing — never "Admissions Manager"

**Free (strategic):**
- Opening copy specific to the audience cell
- Beat sequence
- Which differentiator leads (continuity / method / outcomes / pedigree — strategy decides)
- Which outcome anchors to surface
- FAQ scope and order

**Anchor:**
- 2-3 recent shipped LPs from Notion LP Content Library (canonical examples — mandatory)
- Trial Mastery doc for the market
- `market-operational-models.md`
- Trustpilot CSV slice for this market + grade band + intent

### MOFU LPs (audience comparing options)

**Locked (additional):** Comparison framing one-sided (we differ on X) — **never names competitors.**

**Free:** Comparison-row structure · curriculum-mapping table · specific objection-handlers in FAQ.

**Anchor:** Per-market competitor characteristic descriptions (never names) · specific differentiator data (1-in-200 selectivity · same-coach retention · Trustpilot star count).

### BOFU LPs (intent-hot — pricing / offer / specific seasonal hook)

**Locked (additional):** **No fabricated offers · no countdowns · no "limited spots" framing.** Seasonal hooks must be date-verified against `seasonal-calendar.md`.

**Free:** Pricing fold structure · specific seasonal hook · shorter form (parent already qualified).

**Anchor:** Per-market pricing (verified May 12 — see market-ops) · per-market trial flow (Trial Mastery) · the exact ad driving this traffic — message-match the upstream.

---

## Variation axes — A/B by architecture, not surface

When you ship variants (per `lp-strategy.md` variant rule), they must differ on at least 2 of these axes:

1. **Opening promise** — pain-led ("B− isn't a math problem...") vs outcome-led ("Year 5 to grammar school...") vs identity-led ("The mathematical thinking company...")
2. **Differentiator emphasis** — coach-continuity first vs method-depth first vs outcome-evidence first
3. **Outcome carousel filter** — same-grade-band kids vs same-exam-prep kids vs same-tenure kids
4. **Proof slice** — by grade band vs by tenure vs by outcome type
5. **Form scope** — minimal (3 fields) vs detailed (6+ fields, qualifying questions)
6. **CTA repetition** — opening-only vs opening + mid-page sticky vs opening + every fold

Surface-level word swaps don't count as a variant. Three pages with the same narrative spine are one page polished three ways.

---

## Quality questions (formerly "failure modes" — same content, different posture)

Before shipping, walk the LP through these. Each one is a "stop and fix" question if the answer is wrong.

1. **Did the opening confirm the upstream ad's promise within 5 seconds?** If the ad promised "11+ + school maths, one coach" and the opening says "11+ specialist tutor" — the promise broke. Fix.
2. **Is every fold doing one job?** Multi-USP folds = no USP lands. One per fold.
3. **Are all testimonials Trustpilot-verified, gold-standard format, and narrow-intent-filtered?** No invented signatures. No Kiran / Rohini.
4. **Are there at least 5 testimonials, each a different angle?** Foundation / continuity / outcome / clarity / engagement.
5. **Is per-market truth respected?** ₹ pricing on UK LP = fail. "Monthly plan" on APAC LP = fail. NAPLAN on US LP = fail.
6. **Are competitor specifics real?** Don't add comparison rows for features Cuemath doesn't actually have. Drop rows that need embellishment.
7. **Are any Storybook URLs leaking into copy?** Strip per [[feedback_storybook_is_research_only]].
8. **Is the follow-up role rendered as "academic counsellor" everywhere parent-facing?** "Admissions Manager" = fail.
9. **Is "personalised" used as the hero lead?** Allowed in body, banned on hero.
10. **Does the page cohere with the upstream ad?** Generic LP + specific ad = bait-and-switch.
11. **Is the curriculum claim correct for the market?** CBSE on UK LP = fail.
12. **Did the LP PR add any image files?** Per [[reference_package_leap_image_pipeline]] — LP PRs add ZERO images. CDN upload out-of-band.
13. **Is the same kid photo used across folds without grep?** Cuemath kids are reused — same kid may have different photos in MathfitCommunity vs AchieversCarousel.
14. **For UK LP: is any GCSE / A-Level prep mentioned?** Out of K-8 cap.
15. **For AU LP: is any NAPLAN content shown outside Feb-Mar window?** NAPLAN out-of-season = no NAPLAN-anchored creative.

If any answer is wrong, fix before shipping. These are the failures that recur — don't repeat them.

---

## Coherence block (fill before drafting)

```
Campaign ID: [e.g. AU-Selective-Y5Y6-2026]
LP funnel stage: [TOFU / MOFU / BOFU]
Production host: [class.cuemath.com/perf or leap.cuemath.com]
8-segment slug: [Domain/Acquisition/User-Flow/Country/Channel/Topic/Ethnicity/Action]

Audience cell: [market + sub-ICP + grade band]
Core Belief Tension: [from lp-strategy.md Step 2]
Seasonal window: [from per-market seasonal map]

Upstream surfaces (driving traffic to this LP):
- Meta static / Reel IDs:
- Google RSA IDs:
- Influencer post IDs:

Downstream surfaces (continuing parent journey after form-fill):
- WhatsApp welcome message
- Pre-trial email 1
- Trial booking confirmation
- Post-trial follow-up

The promise echoed across all surfaces (one sentence):
- 

Vocabulary lock (words that must stay consistent across ad / LP / email):
- 

Proof anchor referenced (same one across surfaces):
- 

CTA (must match upstream + downstream):
- LP: "Book a free 1:1 class" (or HS-only "Free SAT diagnostic")
- Upstream ad CTA:
- Email-1 CTA:
```

If the opening doesn't echo the upstream ad's promise within 5 seconds of scroll, change either the ad OR the LP. They must match.

---

## CPTD gates — what to ship-test against

Pull from Godfather before drafting:

1. **Cell-weighted CPTD amber** for this market + grade band + audience cell + intent
2. **Form-completion baseline** — what % of LP visitors fill the form today
3. **Trial-attendance rate** — of forms, how many attend
4. **TD conversion** — of trials attended, how many become qualified TDs
5. **Upstream CPL** — paired ad CPL × form-rate × trial-rate × TD-rate = end-to-end CPTD

Don't ship without these. Drafting blind = optimising blind.

---

## Output checklist before ship

- [ ] Opening beat confirms upstream ad's promise in <5 seconds
- [ ] Per-market operational accuracy: currency, curriculum, exam-prep, follow-up role
- [ ] IGCSE / Cambridge rendered as single dropdown entry
- [ ] Academic counsellor (never "Admissions Manager") parent-facing
- [ ] Min 5 Trustpilot-verified proof cards, gold-standard format, narrow-intent-filtered
- [ ] Each proof card a different angle
- [ ] Tutor cards real, named, market-appropriate
- [ ] Outcome carousel filtered to relevant grade band + market + intent
- [ ] Kiran / Rohini excluded from any kid carousel
- [ ] No invented product or competitor specifics
- [ ] No banned bleached words on hero / strap lines
- [ ] No banned opener patterns
- [ ] Close fletch verbatim
- [ ] CTA = "Book a free 1:1 class" (or HS exception)
- [ ] Form scope matches market + audience cell
- [ ] No Storybook URLs in copy
- [ ] LP PR has zero image files (CDN-only)
- [ ] Coherence block filled
- [ ] CPTD benchmarks pulled
- [ ] /radar pass — ship-readiness gate
- [ ] Premium check passed — does this feel like Cuemath, not like every tutor?
- [ ] Read-aloud test on opening copy (sister test)

---

## Canonical references — read before drafting

- 2-3 recent shipped LPs from Notion LP Content Library — **mandatory** per [[feedback_read_canonical_examples_first]]
- `~/Documents/CM Brain /godfather/02-skills/lp-strategy.md` — strategy thinking
- `~/Documents/CM Brain /godfather/05-reference/market-operational-models.md` — per-market truth
- `~/Documents/CM Brain /godfather/05-reference/cuemath-creative-direction-v1.md` — §3 dimensions, §5 three-beat, §7 always/never
- `~/Documents/CM Brain /godfather/05-reference/trial-mastery-*` — operational trial flow per market
- `~/Downloads/TrustPilot Reviews.csv` — proof sourcing
- `~/Documents/CM Brain /package-leap/.claude/skills/landing-page/SKILL.md` — engineering 9-phase workflow for new LP variants (package-leap host)
- Godfather dashboard — cell-weighted CPTD, form-rate, trial-attendance benchmarks
- LP inventory sheet `10tXqFrZKyDeQ5EtCB4XPcnxGI5SkzQ8r08sTJCWC5sQ`

---

## Related skills

- [[lp-strategy]] — strategy thinking (read this FIRST)
- [[production-skills/landing-page-content]] — variant generation + hard rules
- [[production-skills/_thinking-first]] — shared thinking preamble
- [[voice-canons/voice-{cell}]] — final tonal pass
- [[coherence-protocol]] — ad ↔ LP ↔ nurture bridge
- [[format-manuals/meta-static]] — coherence pair: most LPs receive Meta traffic
- [[format-manuals/google-rsa]] — coherence pair: most LPs receive RSA traffic

---

*Version 2 · 2026-05-13 · refactored from fold-pattern prescription to operational-truth + story-beat menu · structure decisions moved to lp-strategy.md · revise as per-market operational truth shifts.*
