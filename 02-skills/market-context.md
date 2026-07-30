# Market Context — cell resolver

The skill that resolves the audience cell before any format manual runs. Loads market operational truth + sub-ICP + season + competitive frame + voice canon + CPTD benchmark. Auto-invoked by every format manual.

**Lives upstream of every format skill.** Without this, format manuals are loaded blind. With this, every format draft starts with the cell already resolved.

---

## When to invoke

Always, before any format-skill work begins. Auto-runs as the first step of every /write invocation.

---

## What this skill outputs

A structured market-context block that every format manual reads from:

```
MARKET CONTEXT — [YYYY-MM-DD]
============================
Market: [IN / US / UK / AU / MEA]
Sub-ICP (within market): [from voice canon options]
Grade band: [K-2 / 3-5 / 6-7 / 8-12 / Y5-Y6 / etc.]
Funnel stage: [TOFU / MOFU / BOFU]
Seasonal window: [primary + secondary if active]

K-12 or K-8 cap: [K-12 for US only; K-8 for IN/UK/AU/MEA]

Voice canon(s) applied: [from voice-canons/]
Language register: [vernacular-mixed / pure English / international expat / etc.]
Spelling lock: [BrE / AmE]
Math word: [math / maths]
Grade label: [Class / Grade / Year]
Currency display: [₹ / $ / £ / A$ / AED]

Available proof anchors:
- Trustpilot CSV slice (filter to market + grade band)
- Verified outcomes from Godfather (this cell)
- Tutor cards by market

Competitor frame for this cell:
- [List per market — describe by characteristic, never name in copy]

Banned-for-this-cell positioning:
- [Pull from cross-market borrowing list + market voice canon anti-patterns]

CPTD gates for this cell:
- Amber threshold from Godfather:
- Current winner tag profile:
- Volume floor:
```

---

## The 5 markets — one-screen-each lookups

### India

| Field | Value |
|---|---|
| K-? cap | K-8 |
| Sub-ICPs | Tier-1 metro CBSE/ICSE · Premium IB/IGCSE |
| Voice canon | [[voice-india-parent]] |
| Math word | maths |
| Grade label | Class / Grade interchangeably |
| Currency | ₹ (mention "4 Lakh+" not "400,000+") |
| Spelling | BrE (for international audiences) — but India accepts AmE on the website. For ads/LPs: BrE |
| Plan structure | 3 / 6 / 12 month tenure (universal grid) |
| Sales angle | Value justification — pedigree + pedagogy. NOT personalization. |
| Hooks live | Memorisation gap · falling behind · achievement (Olympiad / contest) · better-than-local |
| Seasonal | Apr-Jun (new academic year) · Aug-Nov (mid-cycle) · Sep-Dec (Olympiad). NOT Jan-Mar (Class 10/12 boards out of K-8 scope). |
| Channels | Meta · Google · WhatsApp · LinkedIn (premium audience). NOT YouTube primary. |
| Competitors | BYJU'S / Vedantu / PW (edtech apps) · Aakash / FIITJEE / Allen (coaching centres). NOT local 1:1 tutors. |
| "Fun / gamified" | Supporting claim — never lead |
| Maths anxiety | REAL in India (acknowledge it — unlike US where kids are ahead) |
| Vernacular | Mixed register — Hindi/regional at emotional anchors only |
| Visual styles | Product/platform interface · outcomes (named kid + cert/score) · real Indian kids studying. NOT parent-kitchen-moment. |

### US — only K-12 market

| Field | Value |
|---|---|
| K-? cap | **K-12** |
| Sub-ICPs | First-gen NRI · Second-gen / 1.5-gen NRI · East Asian (Chinese/Korean/Filipino) |
| Voice canons | [[voice-us-first-gen]] · [[voice-us-second-gen]] · [[voice-asian-mom-creator]] (Asian-American Mom Creator for non-NRI East Asian audiences) |
| Math word | math |
| Grade label | Grade |
| Currency | $ |
| Spelling | AmE |
| Plan structure | Class packs of 48/60/96 (HS brief) — though public site shows 3/6/12 tenure |
| Cultural framing | **No "Indian" framing anywhere**. Global brand voice. Vernacular allowed for parent-emotional-anchor moments in NRI canons (separate from brand positioning). |
| Grade-band worry | K-2 = habit + cliff-prevention · 3-5 = memorisation gap · 6-7 = middle-school cliff + AP positioning · 8-12 = HS rigour (per HS brief) |
| Hooks live | DBS 5-hypothesis test: pain · evidence · human · product · contrast |
| Seasonal | DBS quarterly — Q1 (Jul-Sep back-to-school) · Q2 (Oct-Dec mid-year + Diwali) · Q3 (Jan-Mar competitive exam) · Q4 (Apr-Jun summer) |
| Channels | All 4: Meta · YouTube · Google · LinkedIn/Reddit/NextDoor/WhatsApp (community plays NEW) |
| Competitors | RSM (prestige) · Kumon/Mathnasium (mainstream) · Outschool/Wyzant marketplaces. NOT Bhanzu (per Naina May 13). |
| CTAs | "Book a free 1:1 class" default; HS-only (Grades 8-12): "Free SAT diagnostic" / "Free strategy call" per CD v1 §5 |
| Target economics | $40 CPL · $267 CAC · $20M Y1 revenue · 10,000 customers (Apr 25 DBS p.57-58) |
| Visual styles | All 4: product · outcomes · real US Asian-origin kids · parent-kitchen-moment (DBS hub film dynamics). Most permissive market. |

### UK

| Field | Value |
|---|---|
| K-? cap | K-8 |
| Sub-ICPs | Settled UK Asian-origin (2nd-3rd gen, UK-fluent) primary. Recent UK NRI as secondary cell (less prioritised per Naina May 13). |
| Voice canon | [[voice-uk-british-indian]] |
| Math word | maths |
| Grade label | Year (NOT Grade) |
| Currency | £ |
| Spelling | BrE (personalised, centre, programme, colour, recognise) |
| Plan structure | 3 / 6 / 12 month tenure |
| Hooks live | 11+ / grammar school (primary) · KS2 SATs · 7+/8+/13+ indie school entry. **NOT GCSE / A-Level** (out of K-8 cap). |
| Seasonal | Year-round active. Pre-window peak Jul-Aug (11+). In-window Sep-Oct. Results Jan. KS2 SATs run-up Mar-May. 7+/8+/13+ Nov-Jan. |
| Channels | Tight — Meta + Google only. NOT YouTube/TikTok, NOT WhatsApp/community. |
| Competitors | Atom Learning (self-serve adaptive) · Kumon UK / Explore Learning (centres). NOT MyTutor, NOT Bonas MacFarlane. |
| Positioning rule | School maths + exam in one plan, one coach. NEVER "11+ specialist" framing. |
| Visual styles | Product · outcomes (11+ pass / grammar school name / KS2 band) · real UK kids in UK school context. NOT parent-kitchen-moment. |
| Vernacular | Allowed ONLY at influencer parent-quote moments. NOT in brand copy. |

### AU

| Field | Value |
|---|---|
| K-? cap | K-8 (Y2 to Y8) |
| Sub-ICPs | Indian-Australian (largest cohort, ~900K) · East Asian Australian (Chinese, Korean, Vietnamese, Filipino) |
| Voice canons | [[voice-au-indian]] · [[voice-au-east-asian]] (separate registers — Indian-AU has vernacular emotional anchors; East Asian AU is pure AU-fluent) |
| Math word | maths |
| Grade label | Year |
| Currency | A$ |
| Spelling | BrE |
| Plan structure | 3 / 6 / 12 month tenure |
| Hooks live | Selective (Y6→Y7 May NSW + others) · OC (Y4→Y5 May NSW) · NAPLAN (Y3/5/7/9 March nationwide) · Scholarship (Y5-6 May, ACER/Edutest/AAS) · evergreen pain |
| Seasonal | Year-round active. Feb-Mar (NAPLAN), Apr-May (Selective/OC/Scholarship peak), Aug-Nov (results + Term 3-4), Dec-Feb (summer + new academic year). |
| Channels | All 4: Meta · Google · YouTube · WhatsApp/community |
| Competitors | Kumon · Cluey Learning (1:1 online AU-native, rotating tutors). NOT Bhanzu (mentioned but not primary comp), NOT local 1:1 Indian-origin tutors. |
| Banned exam-prep | NCEA (NZ — not packaged) · PSLE (SG — not packaged) |
| Positioning rule | School maths + exam in one plan. Same as UK 11+ logic. |
| NAPLAN seasonality | Anchored copy ONLY Nov-Feb prep window. Pause Mar-Oct. |
| Visual styles | Product · outcomes ONLY. NOT real kids in AU context, NOT parent-kitchen-moment. Tightest constraint of any market. |

### MEA

| Field | Value |
|---|---|
| K-? cap | K-8 |
| Sub-ICPs | Indian / South Asian diaspora · Western expat (UK/US/European) primary. Arab in international schools nominal (low conversion). |
| Voice canon | [[voice-mea-expat]] |
| Math word | maths |
| Grade label | Year (international schools) |
| Currency | AED (د.إ) primary. Other GCC (SAR, QAR, KWD) get UAE pricing or counsellor-quoted. |
| Spelling | BrE (international school default) |
| Plan structure | 3 / 6 / 12 month tenure |
| Curriculum | IB · Cambridge · MYP-PYP · American · British (5 LPs shipped May 4). KHDA not currently surfaced. |
| Hooks live | Curriculum-fit · maths-anxiety · summer-retention (long UAE summer Jun-Sep) · evergreen pain |
| Seasonal | TBD — needs deeper research. Likely summer (Jun-Sep retention) as primary. |
| Channels | Meta · Google · YouTube. NOT WhatsApp/community. |
| Competitors | International online (MyTutor / Cluey-style / Brightspark) · Bhanzu / edtech apps. NOT local KHDA centres, NOT local 1:1 tutors. |
| Cultural framing | NO South Asian cultural framing. NO Indian-tutor visuals. Global expat positioning. NO vernacular (even at parent-emotional-anchor moments). |
| Visual styles | Product · real expat kids in international school context ONLY. NOT outcomes (verified MEA outcome bank too thin), NOT parent-kitchen-moment. |

---

## How to apply

For every /write invocation, the protocol fills the market context block FIRST:

1. **Identify market.** From the brief, the LP slug, the campaign ID, or by asking the user.
2. **Resolve sub-ICP.** Within the market, which audience cell? Voice canon comes from this.
3. **Identify grade band.** K-? cap applies per market.
4. **Identify funnel stage.** TOFU / MOFU / BOFU determines lock/free per format manual.
5. **Identify seasonal window.** Pull from per-market seasonal map. If out-of-season for a specific exam-prep hook, that hook is banned.
6. **Load voice canon.** Reference the canon file by market + sub-ICP.
7. **Load CPTD gates.** Pull from Godfather for this specific cell.
8. **Apply banned-for-cell list.** Cross-market borrowing + market-specific positioning bans.
9. **Pass full block to format manual.** Every format manual reads this before drafting.

---

## Universal cross-market locks (apply everywhere)

These don't change by market:

- Class duration: 55 minutes (extendable to 60)
- Class frequency: K-8 = 2/week · HS = 3/week (US only)
- Plan structure (parent-facing): "tenure" (3/6/12 months, 10/20% discount)
- Money word (brand): "fee" (even though website uses "pricing/price" — see [[reference_market_operational_models]])
- Post-trial role (parent-facing): "academic counsellor" — never "Admissions Manager"
- Role word: "coach" on brand surfaces · "tutor" on performance/trial/LP · "teacher" BANNED parent-facing
- Tutor selectivity: Top 1% (1 in 100)
- Locked close card (in-house content only): *"Same Cuemath Coach. Every Single Class. Making Your Child MathFit™."*
- Default CTA: "Book a free 1:1 class" (HS US exception: "Free SAT diagnostic" / "Free strategy call")

---

## Bleached / banned vocabulary (post-May-13 audit)

### Still banned everywhere
- classroom · centre/center · unlock potential · bright future · love for learning · amazing/incredible/powerful · capable strong and confident · kiddish hooks · guaranteed marks · quick results · math is easy · speed tricks/shortcuts · children (use kids) · specialist (use tutor + qualifier) · teacher (parent-facing) · Admissions Manager (parent-facing)
- Hand-picked · World-class · Best · Leading · Premier · Industry-leading + award-winning · transformational

### Now allowed in practice (came off the bleach list May 13)
- Personalised · Expert (as tutor qualifier) · Trusted · Top 1% · Proven outcomes · Loved by parents / Trustpilot framing
- Fun / gamified / engaging — supporting claim allowed, never lead

### Per-format / context bans (still active)
- "Indian tutors / Indian-trained / Indian rigour" — banned globally per May 12 (NRI exception retired May 13)
- "the tutor your child will keep" + other copywriter clichés
- "MathFit Minds" / "MathFit Pedagogy" / any invented MathFit compound
- "Tricks fade. Understanding compounds." as HEADLINE (it's a close)
- Bare-name coach in performance copy
- Coach as outcome source ("Coach X prepped Y students")
- Naming competitors (Kumon, Mathnasium, Khan, Wyzant, AI tutors, Bhanzu, RSM, Atom, MyTutor, Bonas, Cluey, BYJU'S, Vedantu, PW, Aakash, FIITJEE, Allen — describe by characteristic, never name)
- RSA-specific: "rote" · "cue don't tell" · MathFit dimensions · fabricated CTAs
- Limited spots / countdown / urgency in close

### Per-market bans (cross-market borrowing)
- ₹ pricing on non-India creative
- AmE spelling on UK/AU/MEA copy (default to BrE except US)
- "Class" / "Grade" instead of "Year" on UK/AU/MEA copy
- NAPLAN out of season (Mar-Oct = pause)
- NCEA / PSLE packaged-prep claims anywhere
- South Asian cultural framing on MEA (use international expat register)
- Vernacular phrases in brand body anywhere (allowed only at influencer parent-quote moments in IN / US-NRI / UK / AU-Indian canons)

---

## Related

- [[reference_market_operational_models]] — full per-market operational truth (pricing, curriculum, exam-prep, follow-up)
- [[voice-india-parent]] · [[voice-us-first-gen]] · [[voice-us-second-gen]] · [[voice-asian-mom-creator]] · [[voice-uk-british-indian]] · [[voice-au-indian]] · [[voice-au-east-asian]] · [[voice-mea-expat]]
- [[coherence-protocol]] — uses this skill's output to fill campaign briefs
- All format manuals — every one starts by loading this block

---

*Version 1 · 2026-05-13 · revise as new markets are added or sub-ICPs evolve*
