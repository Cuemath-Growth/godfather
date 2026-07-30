# Google RSA — format manual

The format manual for Google Search Responsive Ads (RSAs) — intent-capture across every market.

KPI is CPTD via CTR × Quality Score × LP form-rate. RSA is the only paid surface where the parent has TYPED A QUESTION. Intent is hottest of any channel. Your job: match the search intent within 30 characters, carry the brand moat across unpinned headlines + descriptions, hand off to an LP that confirms the promise within 5 seconds.

---

## When to invoke

You are writing an RSA when ALL of these are true:
- Surface = Google Search results page (SERP) — top of page or mid-page text ad
- Format = 15 headlines × 30 chars + 4 descriptions × 90 chars (Google rotates dynamically)
- Audience = parent who has typed a maths-related search query
- Funnel stage = MOFU (brand defence — "cuemath uk" / "cuemath review") or BOFU (intent-capture — "11 plus tutor near me" / "AMC 8 prep online")

If you're writing Demand Gen ads, PMax assets, YouTube ads, or display creative — wrong manual.

---

## Physics of this surface

| Property | Reality |
|---|---|
| Read context | Parent typed a query. Active intent. Hottest of any paid surface. Reading SERP results, choosing which ad to click. |
| Time budget | **3-5 seconds across all visible ads.** Your headline competes with 3 other ads + organic listings + map pack. |
| Display logic | Google rotates 3 headlines + 2 descriptions per impression from your 15+4 pool. Headlines can be pinned to position; pinning kills rotation. |
| Char budget | Headline = 30 chars (HARD cap). Description = 90 chars (HARD cap). Spaces count. |
| Quality Score | CTR + relevance + LP experience drives Quality Score → drives CPC → drives volume. Bad LP message-match kills Q Score fast. |
| Final URL | Must match the search intent. Generic homepage = ad-disapproval risk + Q Score penalty. Use intent-matched LP. |

---

## The structure — 15 headlines + 4 descriptions

Every RSA has 15 headline slots and 4 description slots. Pin sparingly — pinning kills the variation engine.

| Slot category | Job | Pinning advice |
|---|---|---|
| **Position 1 (H1) — brand-defence** | "Top 1% Maths Tutors UK" / "Cuemath — Online Maths Tuition" — brand recognition + market | Pin 1-2 headlines here for brand consistency |
| **Position 2 (H2) — campaign lead** | The campaign-specific lead. *This is where RSAs in the same campaign differ.* "Not Just An 11+ Tutor" / "Year 5 To GCSE. 11+ Included." | Pin if running RSA variants; otherwise leave unpinned |
| **Unpinned 6+ headlines** | Carry the **full moat balance** across all of them. Each unpinned slot covers one moat. | Leave unpinned — Google rotates |
| **Descriptions × 4** | Each one carries 1-2 moats + truthful CTA. 90 chars forces compression. | Leave unpinned — Google rotates |

### The 6-moat balance (every campaign must cover all 6 across unpinned headlines + descriptions)

| Moat | Example headline | Example in description |
|---|---|---|
| **School maths + exam in one** (longitudinal) | "Year 3 To GCSE. One Coach." | "Maths tuition that doesn't stop after the exam." |
| **One coach for years** (continuity) | "Same Coach. Every Class." | "The teacher who knows your child for years, not weeks." |
| **Method depth** (Cuemath Way) | "Maths That Makes Sense" | "We teach the why behind every answer." |
| **Outcome credibility** | "Top 1% Tutors. 4.9 On Trustpilot." | "Trusted by 200,000+ kids in 80+ countries." |
| **Tutor quality** | "Hand-Picked Maths Tutors" | "Tutors selected from the top 1% of applicants." |
| **Brand recognition** | "Cuemath — Online Maths" | "Live 1:1 online classes for Year 1 to 8." |

If any RSA in the campaign is missing any of the 6 moats across its unpinned slots, the moat balance is broken. Q Score will rotate to whichever is the strongest individual match, but the parent doesn't get the full picture.

---

## Lock / Free / Anchor per funnel stage

### Brand-defence RSAs (MOFU — parent typed "cuemath" or near-brand)

**Locked:**
- H1 = brand variant ("Cuemath — Online Maths Tuition" / "Top 1% Maths Tutors Online")
- CTA = "Free 1:1 Class" or "Book Free 1:1 Class" (truthful, never fabricated)
- No competitor names in copy
- Final URL matches brand intent (general LP, not exam-specific)

**Free:**
- Which proof points to surface (Trustpilot 4.9 · 200,000+ kids · same coach · 1:1)
- Descriptions can vary tone (warm vs evidence)
- Sitelinks (4-6) cover sub-pages

### Intent-capture RSAs (BOFU — parent typed exam / topic / pain)

**Locked:**
- All MOFU locks. Plus:
- Final URL matches the exam/topic LP exactly
- School-maths-plus-exam positioning — NEVER position as exam-only specialist
- Truthful CTA only — no "Free 11+ Assessment" if that's not a real product

**Free:**
- H2 (campaign lead) varies across RSAs in the same campaign
- Description copy specific to the intent

**Anchor:**
- The actual keyword cluster you're bidding on
- The competitor SERP for those keywords (Atom Learning UK, Bhanzu US, Cluey AU — describe, never name)
- The LP this routes to — read its hero before writing the RSA

---

## Variation axes — running multiple RSAs in one ad group

Google recommends 3 RSAs per ad group. Each RSA differs in H2 (Position 2 lead). Per [[feedback_rsa_balanced_moats_distinct_lead]]:

**Differentiate H2 across RSAs in the same ad group:**
1. **RSA-A** H2 lead: longitudinal coach
2. **RSA-B** H2 lead: school-maths + exam coverage
3. **RSA-C** H2 lead: method depth (the why)

Every RSA still carries all 6 moats across unpinned headlines + descriptions. The H2 difference is the test variable; the moat balance is the constant.

Surface-level word swaps across the unpinned 6 are pattern lock, not variation. If 3 RSAs share 5 of 6 unpinned headlines, you've made copy-paste variants.

---

## Per-market overrides

### India

| Field | India RSA |
|---|---|
| Math word | "maths" (despite website using "math" — brand lock wins for ads) |
| Currency in copy | Avoid stating ₹ in headline (saves chars). If used, "₹800/Class" only in description. |
| Grade label | "Class" or "Grade" interchangeable. "Class 5" / "Grade 5" both land. |
| Exam-prep keywords | Olympiad · IMO · IOMC · Board prep (but K-8 limits this) |
| Competitor SERP context | Bidding against BYJU'S · Vedantu · PW · Aakash · FIITJEE — describe by characteristic (group classes, app-only, drill-based) — never name |
| Channels | Search · Demand Gen · PMax |
| Banned in copy | "rote" · "tricks fade" · MathFit dimensions · invented offers · "Indian-trained" (per global no-Indian-framing) |
| Truthful CTA | "Free 1:1 Class" / "Book Free Trial" |
| Positioning rule | Pedigree + pedagogy. Value-justification ("worth ₹800") in descriptions. Platform fun as SUPPORTING claim, not lead. |

### US

| Field | US RSA |
|---|---|
| Math word | "math" |
| Currency in copy | "$" — but pricing rarely in RSA (drives to LP) |
| Grade label | "Grade" |
| Exam-prep keywords | SAT · AP · AMC · MATHCOUNTS · STAR (TX) · GT cohort · Algebra · Geometry · Pre-Calc · AP Calc |
| HS-only (Grades 8-12) CTA | "Free SAT Diagnostic" / "Free Strategy Call" per CD v1 §5. Otherwise "Free 1:1 Class". |
| Competitor SERP context | RSM · Kumon · Mathnasium · Outschool · Wyzant — describe (group, marketplace, centre-based) — never name |
| Channels | Search · Demand Gen (NOT PMax per Naina May 13) |
| Banned in copy | "Indian-trained" / "Indian tutors" / "Indian rigour" anywhere — global brand. Per-grade-band register: 6-12 uses Expertise (FUAR vocabulary), K-5 uses Warmth. |
| Sub-ICP keyword routing | Different ad groups for First-gen (Texas suburb keywords) vs Second-gen (Bay Area keywords) vs East Asian (Mandarin/Korean tutor keywords) |
| Sitelinks | Programs by grade · Reviews · Pricing · About |

### UK

| Field | UK RSA |
|---|---|
| Math word | "maths" |
| Currency in copy | "£" |
| Grade label | "Year" — NOT "Grade", NOT "Class" |
| Exam-prep keywords | 11+ · grammar school · KS2 SATs · 7+ · 8+ · 13+ · scholarship · CEM · GL Assessment |
| Banned exam-prep | GCSE · A-Level (out of K-8 cap). Don't bid on these keywords. |
| Competitor SERP context | Atom Learning · MyTutor · Bonas MacFarlane · Kumon UK · Explore Learning · Third Space Learning — describe (self-serve adaptive, marketplace, specialist exam-only, centre-group, school-procurement) — never name |
| Channels | Search · Demand Gen |
| Banned in copy | "Indian-trained" anywhere · "11+ specialist" / "exam specialist" framing · AmE spelling |
| BrE spelling lock | Personalised · centre · colour · recognise · programme |
| Truthful CTA | "Free 1:1 Class" — NOT "Free 11+ Assessment" if no such named product |
| Positioning rule | School maths + 11+ in one plan. Headlines must include contrast variants: "Not Just An 11+ Tutor" / "Year 3 To GCSE. 11+ Included." / "Still There After The 11+." |
| Naina catch May 12 | RSA distinctness lives in H2 lead; full moat balance lives across unpinned 6 + descriptions. |

### AU

| Field | AU RSA |
|---|---|
| Math word | "maths" |
| Currency in copy | "A$" |
| Grade label | "Year" |
| Exam-prep keywords | NAPLAN (in season only — Nov-Feb prep window) · OC Test · Selective Schools · Scholarship · ACER · Edutest |
| Banned exam-prep | NCEA (NZ) · PSLE (SG) — not packaged products. Don't bid. |
| NAPLAN seasonality lock | NAPLAN-anchored RSA copy only Nov-Feb (prep window). Pause NAPLAN copy Mar-Oct. Per [[feedback_session_may12_meta_failures]] (May 12 catch). |
| Competitor SERP context | Kumon · Cluey Learning · Bhanzu — describe (group, rotating-tutor, speed-math) — never name |
| Channels | Search · Demand Gen |
| Banned in copy | "Indian-trained" anywhere · AmE spelling · "Selective specialist" / "NAPLAN specialist" framing |
| State-specific routing | NSW (OC + Selective) · VIC (Scholarship + Selective + VCE prep edge) · WA (GATE) — different ad groups for state-specific intent |
| Positioning rule | School maths + exam in one plan, same as UK 11+ logic. |

### MEA

| Field | MEA RSA |
|---|---|
| Math word | "maths" |
| Currency in copy | "AED" or "د.إ" — rarely in headline |
| Grade label | "Year" (international schools) — confirm per audience cell |
| Exam-prep keywords | IB · IBDP · Cambridge · IGCSE (single entry) · KHDA-related searches |
| Competitor SERP context | MyTutor · Cluey-style international online · Bhanzu · BYJU'S · Vedantu — describe — never name |
| Channels | Search · Demand Gen |
| Banned in copy | South Asian cultural framing anywhere · "Indian-trained" · "Indian rigour" · vernacular phrases |
| Audience cell | International expat register only. Single voice canon. |
| Positioning rule | Curriculum-fit + one coach + maths foundation. NOT outcome-led (verified MEA outcome bank too thin). |

---

## CPTD gates — what to ship-test against

Before drafting any RSA:

1. **Search keyword intent map** — what queries triggers this ad? Are they brand-defence (cuemath + market), exam-intent (11+ tutor uk), topic-intent (algebra tutor), or pain-intent (maths anxiety help)?
2. **Quality Score baseline** — what's the current Q Score for this ad group? Below 6 = LP message-match problem.
3. **CTR benchmark** — Google Search ad CTR average is 4-5%. Brand defence should be >10%. BOFU intent capture 3-6%.
4. **CPC ceiling per cell** — pull from Godfather. Cell-weighted CPC × form-rate × trial-rate × TD-rate = CPTD.
5. **Final URL match** — the LP must echo the H2 lead within 5 seconds of scroll. If it doesn't, you have two bugs: bad LP OR wrong RSA routing.

---

## Failure modes — the recurring ones

1. **Pinning everything.** Kills the rotation engine. Pin H1 (brand) only. Sometimes pin H2 if running RSA variants. Never pin descriptions.
2. **Fabricated CTAs.** "Free 11+ Assessment" if no such product exists. "Free SAT Strategy Session" if not a real offer. Only truthful CTAs.
3. **MathFit dimensions in headline copy.** "MathFit Clarity For Year 5" reads as jargon. Frameworks live in brand assets, NOT in search ads — per [[feedback_rsa_parent_language_only]].
4. **Copywriter clichés in 30 chars.** "Cue, Don't Tell" / "Tricks Fade." Brand atoms are closes, not openers. And they don't survive translation to RSA where the parent is in active-query mode.
5. **Naming competitors.** "Better Than Kumon" / "Beats Atom Learning." Never. Describe by characteristic.
6. **Negative comparison headlines.** "Don't Pay For Group Classes" — borderline brand bashing. Frame positive.
7. **All 3 RSAs in an ad group sharing 5 of 6 unpinned headlines.** That's copy-paste variation, not real testing.
8. **Missing moats across the ad group.** If no headline or description mentions outcome credibility, that moat is missing. Audit before launch.
9. **Out-of-season exam-prep copy.** NAPLAN in May. 11+ in March. AMC in June. Seasonally-indexed.
10. **Generic Final URL.** Sending exam-intent traffic to the homepage. Q Score drops, conversion drops.
11. **Cross-market borrowing.** "Year 5 Maths Tutor" on US ad group (should be "Grade 5"). "11+ Tutor" on AU. Don't.
12. **Bleached words in headlines.** "World-class maths tutoring" / "Premium tutors." Per post-May-13 audit — these stay bleached.
13. **Forgetting BrE/AmE spelling per market.** "Personalised" on UK, "Personalized" on US. Spelling matters for native-speaker trust signal.
14. **GCSE / A-Level keywords in UK ad groups.** Out of K-8 cap. Don't bid.

---

## Coherence checks (mandatory)

Every RSA exists in a campaign → ad group → keyword cluster → LP funnel.

```
Campaign ID: [e.g. UK-11plus-Y5Y6-prep]
Ad group: [e.g. uk-11plus-grammar-school-search]
Keyword cluster: [list 5-10 target queries]
Match types: [broad / phrase / exact]
Funnel stage: [MOFU brand defence / BOFU intent capture]

Final URL: [LP URL]
Does LP hero confirm the H2 lead within 5 seconds of scroll? [Y/N]
Vocabulary lock (words consistent across RSA + LP + email):
- 

Other RSAs in this ad group:
- RSA-A H2 lead:
- RSA-B H2 lead:
- RSA-C H2 lead:
(Each must differ in H2; all 3 must carry full 6-moat balance across unpinned + descriptions)

Pinning strategy:
- H1 pinned: [yes/no — pin for brand consistency]
- H2 pinned: [yes/no — pin only if running variant H2 tests]
- Descriptions: never pinned

Sitelinks (4-6): [list]
Callouts (4-10): [list]
Structured snippets: [list]
```

---

## Output checklist before ship

- [ ] H1 = brand-recognition variant (pinned)
- [ ] H2 = campaign-specific lead (varies across RSAs in ad group)
- [ ] Unpinned 6+ headlines cover all 6 moats (school maths + exam · continuity · method · outcome · tutor quality · brand)
- [ ] 4 descriptions, each carrying 1-2 moats + truthful CTA
- [ ] Char counts verified — 30/headline, 90/description (spaces count)
- [ ] CTA = "Free 1:1 Class" / "Book Free Trial" / "Free 1:1 Class" (truthful only — no fabricated offer)
- [ ] HS-only US RSAs: "Free SAT Diagnostic" / "Free Strategy Call" per CD v1 §5
- [ ] Per-market spelling (BrE vs AmE)
- [ ] Per-market grade label (Year / Grade / Class)
- [ ] Per-market currency posture
- [ ] No competitor names
- [ ] No MathFit framework dimensions
- [ ] No fabricated offers / countdowns / urgency
- [ ] No copywriter clichés as headline ("tricks fade" / "cue don't tell")
- [ ] No bleached-vocab headlines (world-class · best · leading · #1 · industry-leading · premier)
- [ ] No "Indian-trained" / "Indian rigour" / "Indian-method" framing anywhere
- [ ] Seasonal validity check (NAPLAN only Nov-Feb · 11+ only Jul-Oct · AMC only Sep-Nov)
- [ ] Final URL matches the H2 promise
- [ ] LP hero echoes the H2 within 5 seconds (verified by reading the LP)
- [ ] Coherence block filled
- [ ] CPTD benchmarks checked

---

## Canonical references — read before drafting

- The actual search keyword cluster (from Google Ads or planner)
- The LP this RSA routes to (read its hero before writing the RSA — coherence-first)
- `~/Documents/CM Brain /godfather/05-reference/market-operational-models.md` — per-market truth
- `~/Documents/CM Brain /godfather/05-reference/cuemath-creative-direction-v1.md` — §5 CTA logic, §7 always/never
- Godfather dashboard — cell-weighted CPC, Q Score, CTR by ad group
- [[feedback_rsa_parent_language_only]] — banned in search ads
- [[feedback_rsa_balanced_moats_distinct_lead]] — H2 distinctness, full moat coverage
- [[feedback_school_maths_plus_exam_positioning]] — never exam-only specialist

---

## Related

- [[lp.md]] — coherence pair: every RSA must route to an LP that confirms its promise
- [[meta-static.md]] — different surface, same audience; moat balance carries across both
- [[google-demand-gen.md]] — sister surface, less typed-intent
- [[coherence-protocol.md]] — ad ↔ LP ↔ nurture bridge
- [[brand-manager.md]] — pre-ship gate
- [[creative-visualizer.md]] — N/A for RSA (text-only) but sitelinks/extensions may need brief

---

*Version 1 · 2026-05-13 · drafted post-format-decision-sweep with Naina · revise as failure modes surface*
