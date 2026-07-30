---
name: Cuemath Forbidden Patterns Catalog
description: Single source of truth for what's banned in Cuemath copy. Read BEFORE any creative generation (RSAs, Meta ads, scripts, LP copy). Source list referenced by [[brand-validator]]. Six categories: positioning bans, stat bans, voice bans, invented terms, cliché phrases, structural bans. Apply the starting-point test before drafting.
metadata:
  type: skill
  layer: voice-guardrail
  status: v1-draft
---

# Cuemath Forbidden Patterns Catalog

A catalog of *named* failure patterns. Each pattern has: ❌ banned form · ✅ replacement · **Why** · **Where caught**.

This is the source of truth for what's off-brand. [[brand-validator]] scores against it. Forge production skills read it before drafting. When a new failure mode gets caught in-session, append it here — don't fragment it across new memory files.

**Loading order:** Read this file BEFORE production skills, AFTER thinking-first and strategy. It overrides any conflicting suggestion from a voice canon or format manual.

---

## 0. THE BRAND BIBLE — and what wins when docs disagree

### The brand bible is a website, not a file in this folder

# https://cuemath-brand-book.netlify.app/

**Read it live. There is no local copy, no digest, and no versioned snapshot of it — by design.** A second brand document always drifts from the first, and then nobody knows which one is true. Positioning, voice, tagline tiers, colour, typography, photography, casting, attire, vocabulary, the brand beats, the six USPs, and the trust numbers all live there and only there.

If you cannot reach the site, say so and stop. Do not reconstruct brand rules from memory, from an old ad, or from any file in this folder.

### Precedence ladder

| Rank | Authority | Wins on |
|---|---|---|
| 1 | **The brand bible** (link above) | Voice, tone, taglines, visual identity, colour, photography, casting, attire, vocabulary, brand beats, USPs |
| 2 | **This file** | What is banned. The bible describes the brand; this file records what has actually failed in market. A bible suggestion never unbans a forbidden pattern |
| 3 | **Market verified-facts tables** (e.g. `us-google-rsa-verified-facts`) | Every number, price, percentage, date, credential in **paid** copy |
| 4 | [[cuemath-creative-direction-v1]] | Execution not covered above — register sort, coach-visibility floor, per-market creative rules |

| 5 | [[brand-voice]] | **Demoted, not retired.** Per-market language only — spelling, grade vocabulary, exam references, currency, internal product names, personas, copy atoms. Never brand law |
| 5 | `03-guardrails/*` | **Kept.** Data integrity (G-01/02/07), structural quality (G-09–G-19), character limits, script lengths, image dimensions — none of which this file covers |

**Deleted 2026-07-30 — these files no longer exist:** `brand-guidelines.md` · `brand-guidelines-uploadable.md` · `icp-guide.md`. Everything unique in them was migrated first: copy atoms and the transformation narrative into [[brand-voice]] · conversion and enrollment figures into [[funnel-definitions]] · the audience model into §8 below. A surviving reference to any of them is rot — fix it.

**The rule that survives every conflict:** a number that is not in a verified-facts table does not ship in paid copy, no matter which document printed it.

---

## How to use this file

**Pre-write check (run before any draft):**

1. **Starting-point test** — Does this line imply the child is currently underperforming? If yes → reframe as enrichment.
2. **Voice picker** — Which of the 8 voices am I in? (Mentor · Method · Maths · Myth-bust · Artifact · Time/cadence · Direct-address · Statistical.) Default-reach is parent-narrating-one-kid — that's the failure mode. Pick consciously.
3. **Fact verifier** — Every number, price, percentage, date, credential present in copy must exist in [[us-google-rsa-verified-facts]] or the equivalent market reference. If you typed it from memory, it's invented.
4. **Banned-phrase scan** — Search the draft against Section 5 below. Any hit = rewrite.

If you can't complete steps 1–3 in <60 seconds, you don't have enough grounding yet. Stop and gather.

---

## 1. POSITIONING BANS (category-level)

These violate the brand category. Hard fails — never ship.

### 1.1 Ethnicity-led tutor framing — HARD BAN

❌ `Indian Tutors` · `Indian Experts` · `Indian-Trained Math Coaches` · `India's Best Tutor` · `Indian rigour` · `Indian-pedagogy`

✅ `Built by IIT & Stanford alumni` (curriculum lineage, defensible) · `Certified math tutors` · `Top 1:1 math tutors`

**Why:** (a) violates global brand pivot — Cuemath markets the program, not tutor ethnicity (marketplace logic the playbook moats against). (b) Triggers Google Ads personalized-advertising policy on national origin. (c) Cultural credibility lives in curriculum lineage, not tutor ID.

**Where caught:** US RSA audit May 19, AUS statics May 12. Confirmed HARD BAN. See [[us-google-rsa-verified-facts]].

### 1.2 Remediation framing — banned in enrichment category

❌ `From C to A+` · `From Failing to Passing` · `Fix Math Gaps` · `Struggling in Math?` · `Behind in Math?` · `Hate Math? We'll Make You Love It` · `Boost Grades by 95%`

✅ `Excel in School with Cuemath` · `Master School Math` · `Build Strong Math Foundations` · `Deepen Math Understanding` · `Get Ahead in Math` · `Cuemath Makes Math Click`

**Why:** Only **2.2%** of US/NRI audience describes their child as "struggling." 96%+ are enrichment. Remedial framing repels the real ICP, attracts the price-sensitive shortcut-seeker (anti-ICP), and cheapens the premium frame. Even if a remedial line converts in spite of the frame (brand-keyword traffic), it erodes positioning long-term.

**Exception:** Tier-2 testimonial/case-study content CAN show a struggling → confident transformation — because it's the *parent's voice*, not Cuemath's self-framing.

**Where caught:** US brand RSA May 19, lifted from an old top-performer (10.33% conv rate). See [[enrichment-not-remediation-us]].

### 1.3 Named-tutor framing — banned in performance copy

❌ `Coach Karthik` · `Reena Ma'am` · `Tutor Priya helped my daughter` · any bare proper name in ad copy

✅ `Cuemath coach` · `your child's coach` · `the same coach, every class` · `coaches who specialise in your child's thinking`

**Why:** Bare names = tutor-marketplace framing (Wyzant/Vedantu logic). The playbook moats against this — Cuemath sells *the program with a consistent coach*, not *this specific person*. Individual names appear ONLY on LP tutor-profile cards, never in ads or scripts.

**Where caught:** May 6 NRI Creative Analysis. See [[cuemath_coach_not_named_tutor]].

### 1.4 "Top 1%" / hire-rate stats — moderate use, tutor-selection contexts only

❌ As default trust badge: `Top 1% tutors` standalone in a headline · stacking `Top 1%` with other selectivity claims in the same ad · `1-in-200 hire rate` as a pure-stat hook · `Picked from the top 1%` as ad-headline rhythm

✅ When the ad's job is to *explain tutor selection*: `Top 1% of math tutors — chosen for how they explain, not just what they know` · `Coaches from the top 1%, screened on teaching skill` · always paired with a mechanism or *what-this-means-for-your-kid* line

**When OK:** Tutor-selection / hire-bar contexts where the ad's POV is "here's how Cuemath finds and trains its coaches." Used as a substance claim with mechanism behind it.

**When NOT OK:** As a generic premium-signal headline (parent doesn't know what 1% of what), as shorthand for "we're selective," or stacked with parent/student-scale stats in the same line.

**Why:** Hire-rate stats don't sell anxious parents *as a default trust badge* — they're inward-facing pride numbers. But they DO carry weight when the ad's whole job is explaining the coach pipeline. Line between "moderate use in context" and "default-reach trust badge" = does the rest of the ad explain what 1% means for the kid.

**Where caught:** Performance audit, repeated catches. Naina's clarification May 19: not a ban, a context rule. See [[us-google-rsa-verified-facts]].

### 1.5 Casting, attire, and imagery bans

Per the brand bible's photography and coach-persona rules. These are the visual equivalent of §1.1 — the same positioning logic applied to what a parent sees before reading a word.

❌ **Attire:** saris · kurtas · suits · any Indian-wear on a coach on camera
❌ **Composition:** coach and child in the same physical room — breaks the split-screen online signature
❌ **Register:** staged smiles · thumbs-up · stock-photo energy · institutional or classroom backdrops · cartoon characters or infantilising illustration · luxury-brand distancing · dashboard-as-hero
❌ **Colour:** pure black · pure white · cool greys · red accents of any kind (fear signal)
❌ **Synthetic humans:** AI-generated faces, adult or child. The bible names "the AI look" — uncanny lighting, over-smooth skin, plastic surfaces — as a failure mode

✅ Smart casuals, global professional, solid warm neutrals or a gold accent · split-screen or screen-in-frame when coach and child both appear · warm directional morning window light, lived-in room, *the moment before understanding* · real released talent, children's faces permitted · casting mix and grade-tier gender rules per the bible

**Why:** wardrobe and composition are positioning signals read faster than copy. `Indian Tutors` was hard-banned in §1.1 as language; a sari on a thumbnail says the same thing without a word. Both cost the same global-brand positioning.

**Where caught:** brand-bible adoption, 2026-07-30. Applied first on the YouTube thumbnail rebuild — see [[06-channels/youtube/02-thumbnail-system]].

---

## 2. STAT / FACT BANS

Any number, price, percentage, date, or credential in copy must trace to a verified source. If you typed it from memory, it's invented.

### 2.1 Fabricated stats

❌ Any number not in the verified-facts table (e.g. `Improve Math Grades by 50%`, `Boost Grades by 95%`, `30,000 applicants`, `97% parent satisfaction`)

✅ Verified-only: `200,000+ students` · `400,000 parents` · `4.9★ rated` · `From $20/class` · `20% off annual plans` (US). Each market has its own verified table. Check before typing.

**Why:** One fabricated stat invalidates every real one. Parents are stat-skeptical; the moment they sense invention, the whole credential stack collapses.

**Where caught:** May 19 US RSA ($16 vs $20), May 7 LP-16 (30K applicants invalid).

### 2.2 Invented offers and CTAs

❌ `Free Audit` · `Free Assessment` · `Free Diagnostic` · `Upto 30% Off` (when actual is 20%) · `Limited-time` (when there's no actual deadline)

✅ `Book a Free 1-on-1 Class` (US locked CTA) · `20% Off Annual Plans` (the actual US offer) · market-specific verified CTA from the reference table

**Why:** Invented offers are legally and operationally unbacked — sales team can't honour them. Also: Google/Meta have approval flags for unverifiable claims.

### 2.3 Context-shifted facts

❌ Lifting a phrase from a past ad without checking the original context (e.g. `30-Day Math Kangaroo Prep` was *program length*, not a *countdown* — using it for a 30-day countdown ad fabricates urgency that didn't exist).

✅ Verify dates and event windows against [[seasonal-calendar]] Verified Exact Dates table BEFORE using time-bound copy. Past Cuemath ad names are not valid sources.

**Where caught:** May 6 NRI session. See [[verify-event-dates-before-writing]].

### 2.4 Brand-bible numbers are not automatically cleared for paid

The bible carries trust numbers that have never been through a verified-facts table: **97.2%** parent-reported improvement · **2,500+** competition wins · **<1%** refund rate · **4,000** tutors · **80+** countries.

✅ Usable on **organic brand surfaces** — channel copy, films, playlist descriptions, About pages.
❌ Blocked in **paid** copy until Naina confirms the source and they enter the market table.

Separately: **`#1 Tutoring service`** — the bible's Trustpilot line — must stay out of Google Ads text assets regardless of brand approval. Google disapproves unsubstantiated `#1` / `Best` superlatives at review. That is platform policy, not a brand call, and it is distinct from the §1.4 `Top 1%` positioning rule.

**Why:** the bible is the authority on *what the brand is*, not on what has been legally and operationally cleared for a paid auction. Those are different gates. §3 of the precedence ladder holds.

---

## 3. VOICE BANS (frame violations)

### 3.1 Parent-narrating-one-kid — voice-frame match, NOT a universal ban

This is a frame-match rule, not a ban. Single-kid pronouns are natural and required in some surfaces, wrong in others. Match to who's speaking.

**Use single-kid pronouns ("she / he / her / his / Year 5 NAPLAN") when the VO is *the parent's voice*:**

- UGC content (parent on-camera or scripted as themselves)
- Testimonial scripts (parent voicing real transformation)
- Influencer / creator scripts (creator narrating their own kid's story)
- Statics built around a specific parent quote

✅ `She used to freeze at word problems. Now she asks her own questions.` — natural in UGC / testimonial / parent-voice static.

**Use categorical voice ("your child / kids / your Year 6 / the kind of kid who…") when the VO is *Cuemath's voice*:**

- Brand-voice VO (Cuemath as speaker, mentor observation, method-speaking)
- We-voice ads (we-build, we-believe, we-pair)
- Most statics where the writer's POV is Cuemath, not a specific parent
- **US Google RSA copy — market-specific rule forbids she/he entirely regardless of frame** (see [[rsa-us-writing-rules]])

✅ `Your child can solve word problems by reasoning, not guessing.` — categorical Cuemath voice.

**Failure mode:** Reaching for single-kid pronouns when the voice frame is Cuemath, not parent. That's when "she/he" breaks — Cuemath sounds like it's pretending to be one specific parent. In UGC / testimonial / influencer, single-kid is the entire point.

**Pre-write check:** State out loud whose voice this is. If Cuemath → categorical. If parent → single-kid natural. If unclear, the asset has a frame problem deeper than pronoun choice.

**Where caught:** May 12 AUS statics (was Cuemath voice, used single-kid → wrong). Calibrated May 19 by Naina: not a universal ban, a frame match. See [[rsa-us-writing-rules]], [[feedback_session_may12_meta_failures]].

### 3.2 Brand-atom / close-card lines in headline slot (slot mismatch)

The failure mode is *slot*, not language. A line that works as a close-card or brand atom gets hoisted to the headline, where it dies because the reader hasn't invested enough attention yet to receive it. Keep the line — move the slot.

❌ Headline slot using lines built to close:

- `If she can explain why, she'll never forget how.` — outcome line; works at close, presumes earned attention at open
- `Math is a way of thinking.` — definition / outcome statement; same slot mismatch
- `Same Cuemath Coach. Every Single Class.` — literal close-card hoisted to headline
- `Tricks fade. Understanding compounds.` — *dual issue*: wrong slot AND headline-unfriendly phrasing (see note below)

✅ Slot map:

- **Headline** = PAIN (the worry that lives in the parent's head) or HOOK (the specific scroll-stop situation)
- **Subline** = MECHANISM (what Cuemath does, in mentor voice)
- **Close card** = BRAND ATOM (the lasting line that lands after the click is earned)

Test before placing: would a parent scanning a SERP / feed *pause* on this line because it speaks to their worry? If no, it's a close, not a headline.

**Note on "Tricks fade. Understanding compounds.":** Two problems stacked. (1) Slot — brand-atom statement, belongs at close. (2) Phrasing — "understanding compounds" is technical/abstract, not layman parent speech. Test: would a parent at school pickup say "my kid's understanding is compounding"? No. Even at close, this line needs a layman rewrite.

**Where caught:** May 12 session multiple times. Re-categorised May 19 (Naina): the issue is slot mismatch, not philosophy. See [[feedback_session_may12_meta_failures]].

### 3.3 Framework language in parent VO

❌ Parent voice-over using framework terms: `She has fluency, understanding, and reasoning now` · `MathFit Application that lifts grades` · `FUAR-based learning`

✅ Outcome language instead: `she samajh ke solve karti hai` · `she actually gets it now` · `he can show his work`. MathFit™ as a brand term IS OK; the dimensions (Fluency, Understanding, Application, Reasoning) are not.

**Scope widened 2026-07-30 — now all external copy, not just VO.** The bible classes `productive struggle`, `cuing not telling`, `FUAR`, `interleaving`, and `retrieval practice` as internal-only language. They no longer get a pass in on-screen text or end cards either. Frameworks are how we brief, not how we speak — to anyone, anywhere a parent can read it.

Translate rather than name: *"cuing, not telling"* → **"the coach asks the next question."** *"Productive struggle"* → **"she works it out herself."**

**Why:** Parents don't speak in frameworks. A parent reading "fluency" breaks the same spell as a parent saying it.

**Where caught:** May 12 video scripts (VO). Widened to all external copy at brand-bible adoption, 2026-07-30. See [[frameworks-not-in-vo]].

### 3.4 "Teacher" parent-facing

❌ `Math teacher` · `your child's teacher` · `Cuemath teachers`

✅ `Tutor` (performance surfaces — Google Ads, brand keywords, Meta) · `Coach` (brand surfaces — films, OOH). Never "teacher" parent-facing.

**Why:** "Teacher" implies classroom/school context — wrong category. Tutor matches parent search behaviour and Quality Score on Google. Coach is the brand frame. Pick by surface, not by feel.

**Where caught:** Cross-surface decision May 12. See [[tutor-coach-word-decision]], [[tutor_coach_surface_not_keyword]].

---

## 4. INVENTED TERMS (compound-noun manufacturing)

### 4.1 MathFit compound inventions — banned

❌ `MathFit thinking` · `MathFit concept depth` · `MathFit confidence-building` · `MathFit Minds` · `MathFit Application that lifts` · any free-form noun glued to MathFit

✅ Only the canonical three dimensions: **MathFit™ Application** · **MathFit™ Clarity** · **MathFit™ Confidence**. Or MathFit™ as standalone brand term: `Making your child MathFit™` · `the MathFit method`.

**Why:** MathFit is a trademarked brand atom with a defined dimension set. Free-compound inventions dilute the IP and break framework discipline. Also: MathFit is optional in lead-gen (team ships without it in 4-of-4 PTs); don't force it in.

**Where caught:** May 12 AUS session, repeated.

### 4.2 "Cuemath Pedagogy" and similar invented brand terms

❌ `Cuemath Pedagogy` · `The Cuemath Method (the)` · `Cuemath Way`

✅ `MathFit method` · `Cuemath's MathFit™ approach` · `the Cuemath program`

**Why:** "Pedagogy" is internal jargon ([[us-google-rsa-verified-facts]] banned list). Invented capitalised brand terms read like venture-capital-pitch language, not parent speech.

### 4.3 "Cue Don't Tell" / "rote" / internal vocabulary

❌ `Cue Don't Tell pedagogy` · `non-rote learning` · `we don't do rote`

✅ Translate to parent-observable behaviour: `your child explains the why` · `understanding before answers` · `no memorisation tricks`

**Why:** "Cue Don't Tell" is an internal training-doc term. Parents don't know it, don't search it, and reading it makes them feel outside the in-group.

---

## 5. CLICHÉ PHRASES (the named shame list)

Specific phrases caught in past sessions. Each one fails the *sister test* (would I say this to my sister?).

| ❌ Banned phrase | Why it fails | ✅ Replacement direction |
|---|---|---|
| `the tutor your child will keep` | agency flip — implies kids dump tutors, wrong pain | `same coach, every class` |
| `MathFit Minds` | invented compound noun | omit or use `kids who think in math` |
| `Cuemath Pedagogy` | invented brand term | `MathFit method` |
| `Picked from the top 1%` | ad-headline rhythm, not parent speech | `certified math tutors` |
| `Builds a plan` | generic SaaS verb | name what gets built — `a learning plan for your child's gaps` |
| `Tricks fade. Understanding compounds.` | works as close-card, FAILS as headline | move to close |
| `If she can explain why, she'll never forget how.` | same — brand atom in wrong slot | move to close |
| `Unlock your child's potential` | generic edtech | name the specific outcome |
| `Bright future` | empty futurist | name the concrete near-term win |
| `Love for learning` | LinkedIn voice | translate to observable behaviour |
| `Capable, strong, confident` | adjective stacking | pick ONE specific outcome |
| `Math is easy` / `Make math easy` | violates brand: *"make math meaningful, not easy"* | `make math click` / `make math make sense` |
| `Easy math` | same | drop "easy" |
| `Speed tricks` / `shortcuts` / `quick results` | violates MathFit (depth, not speed) | `lasting math skills` |
| `Guaranteed marks` / `guaranteed grades` | unbackable, sets up disappointment | `consistent progress` / `real understanding` |
| `Amazing` / `incredible` / `powerful` | empty intensifiers | cut, or replace with specific |
| `Kiddish` | dismissive, off-tone | omit |
| `Classroom` / `center` / `centre` | wrong category (school/tuition-centre framing) | `1-on-1 online` / `at home` / `program` |
| `Crush math` | bible bans outright, no exception | `make math click` |
| `Remedial` / `catch-up` | category violation — see §1.2 | `get ahead` / `build foundations` |
| `Speed math` / `quick fix` | violates MathFit (depth, not speed) | `lasting understanding` |
| `Master math` / `ace the test` **unpaired** | only ever ships paired with pedagogy | `master math by understanding why` |
| `Gamified` / `holistic` / `AI-powered learning journey` | generic edtech, bleached | name the actual mechanism |
| `AI-powered` as the positioning | AI is a tool, not the product | `AI calculates. Humans must think.` |
| `Genius` / `prodigy` / `gifted only` | excludes the buyer — breaks bible Pillar 1 | `every child` framing |
| `Limited time` / `only 3 seats left` | manufactured urgency; red-accent fear signal | the actual offer, or nothing |
| `Fun` outside K–2 | bible restricts to junior; never HS | `interesting` / drop it |

---

## 6. STRUCTURAL BANS

### 6.1 "X — not Y" parallel structures

❌ `Coaches, not teachers.` · `Understanding, not memorising.` · `Real math, not tricks.` (when used as the dominant structural device)

✅ Lead with the positive frame. Use opposition only when the contrast is operationally meaningful and the reader genuinely held the wrong belief.

**Why:** The parallel construct became a verbal tic across May copy. Reader fatigue + brand book bans negative comparisons that border on competitor/school-bashing.

### 6.2 Soft negative comparisons

❌ `Unlike school, where teachers can't focus on every kid…` · `Coaching centres make your child a number…` · `Most tutors give up. Cuemath coaches…`

✅ State the Cuemath positive without putting anyone down: `1-on-1 means your child's coach knows where they actually are` · `the same coach, every class, building on what they learned last week`

**Why:** Borderline tutor/school-bashing — brand book explicit. Also: parents pay for school. Don't insult their existing system; position Cuemath as the layer on top.

### 6.3 Three-word PT opener defaulting to "Cuemath's 1:1 online…"

❌ Every primary text starting with the brand or feature: `Cuemath's 1:1 online tutors…` · `Cuemath helps kids…` · `Our math program…`

✅ Open from the parent's situation: `Looking for…` · `Unlike weekend coaching…` · `From tears over fractions to…` · `This New Year…` · `When your Year 6 says "I just don't get it"…`

**Why:** Brand-first opener wastes the 3-word visibility window. Parent-situation opener earns the scroll-stop.

### 6.4 Missing the May 10 close card — brand films only

❌ **Brand film** shipped without the close card: *"Same Cuemath Coach. Every Single Class. Making Your Child MathFit™."*

✅ Verbatim line, end-frame placement, on every brand film.

**Scope:** Brand films only. NOT statics, NOT Meta performance ads, NOT Google RSAs, NOT UGC / influencer scripts, NOT LP copy. Brand-film end-frame is the slot.

**Why:** This is the brand atom for film-format storytelling — the line that lands the philosophy after the parent has watched 30-60 seconds of substance. In any other format the slot doesn't exist or the line would compete with the CTA / outcome message.

**Where caught:** May 12 tutor-on-camera Q&A reel calibration. Scope clarified May 20: brand films only, not universal. See [[feedback_tutor_on_camera_qa_calibration]].

### 6.5 Number dumps in one ad

❌ `400,000 parents trust 200,000+ students at 4.9★ rated Cuemath` (stacking three stats in one line)

✅ One stat per ad. Pick the most resonant for the slot: parent-scale for brand search, student-scale for descriptions, rating for trust headlines.

**Why:** Stat-stacking reads desperate and dilutes each number. One headline per ad uses a stat; the rest carry outcome, mechanism, or CTA.

**Where caught:** May 19 US RSA writing rules. See [[rsa-us-writing-rules]].

---

## 7. BRAND-BIBLE RECONCILIATION

Where the bible collided with what this Brain already believed, and how each collision was settled on 2026-07-30. Two still need Naina.

| # | Collision | Settled as |
|---|---|---|
| A | Bible trust numbers absent from any verified-facts table | Organic-only, blocked in paid. **⚠️ NEEDS NAINA** — see §2.4 |
| B | Bible permits children's faces; Forge banned images of identifiable children | Scope split. Real released talent may show faces; **AI-generated children stay banned.** Forge rule 19 rescoped |
| C | Two different frameworks both called "three beats" — bible's Goal/Mechanism/MathFit vs NRI's situation→shift→proof | Renamed. Bible's are **Brand Beats (B1/B2/B3)**; NRI's are **Narrative Beats.** Never write "three-beat" unqualified |
| D | Forge required naming "Cue, don't tell"; bible classes it internal-only | Reference the behaviour, never the term. Forge rule 18 rewritten · §3.3 widened |
| E | Navy `#1A1A2E` + yellow `#F5A623` | **Retired.** Palette now lives only in the bible. Propagated into Forge. `index.html` still carries the old values — moot, the dashboard is being removed |
| F | Coach and child in the same physical room | **New rule, adopted.** Split-screen is the online signature. §1.5 |
| G | Coach attire and casting mix | **New rules, adopted.** §1.5. Same logic as the §1.1 hard ban, applied to wardrobe |
| H | Bible ships `Top 1% global tutors` as USP 1; §1.4 restricts it | **No change.** The bible attaches proof and mechanism, which is exactly what §1.4 requires. The bare-badge ban stands |
| I | Coach vs tutor on YouTube | Proposed: `tutor` in titles and search metadata (lexical match), `coach` on screen and in thumbnail/playlist copy. **⚠️ NEEDS NAINA** |
| J | `brand-guidelines.md` · `brand-voice.md` · `brand-guidelines-uploadable.md` · `03-guardrails/*` | **Retired.** Anything unique extracted here first. Do not read them |

---

## 8. AUDIENCE MODEL — the bible's, and how the old segment names translate

`05-reference/icp-guide.md` was retired 2026-07-30. **Audience strategy comes from the brand bible and nowhere else.**

### The model

**Pillars:** NRI Profile A (first-gen · 35–50 · Texas-heavy · anxiety = *protection*, "will my child fall behind?" · trust via community endorsement) · NRI Profile B (second-gen / 1.5-gen · 28–42 · Bay Area-heavy · anxiety = *advancement*, "will my child get ahead?" · trust via peer testimonial + product evidence) · Asian-American (Chinese competition-oriented · Korean hagwon-familiar · Filipino STEM-career · Vietnamese community-validated · Japanese quality-over-speed).

**Stated parent goals (US trial cohort):** grade improvement **25.8%** · acceleration / gifted track **21.1%** · conceptual understanding **17.3%** · competition prep **10.4%** · SAT / AP **3.4%**. This is the **B1 Goal** beat — pick one, make it specific.

**Geography registers:** Bay Area & Seattle & NC → global, evidence-first, AI-world · Texas & Atlanta → same-coach, community testimonials · NJ/NY → MathFit + 1:1 contrast, Tier-1 framing · Chicago → acceleration for 6–10, switcher angle for K–5.

### Translation from the retired segments

Ten files still name the old personas. They resolve like this:

| Retired persona | Now |
|---|---|
| Foundation Rebuilder (28.6%) | **Conceptual understanding** goal (17.3%) |
| Confidence Builder (18.2%) | Dissolves into **conceptual understanding** / **grade improvement** |
| Personalization Seeker (12.0%) | **Not an audience.** 1:1 personalisation is a mechanism — Brand Beat B2 |
| Accelerator (2.3%) | **Acceleration / gifted track** (21.1%) + **competition prep** (10.4%) |
| — | **Grade improvement (25.8%)** — the largest single goal, which the old model had no segment for at all |

Two things worth noting. The old "primary" segment maps to a 17.3% goal while the actual largest goal went unnamed — the psychographic model was mis-weighted. And **Accelerator's "serve but do NOT target" rule is superseded**: the bible treats acceleration as the second-largest goal, with competition prep a named track. Do not carry the old avoidance rule forward.

The 4:3:2:1 content mix goes with the old model. Weight by stated goal instead.

### One carve-out from the bible — ⚠️ CONFIRM WITH NAINA

The bible's Texas section permits **`"Indian rigor" (Lane 1)`**. **This file still bans it** (§1.1) and that ban holds until Naina says otherwise, on two grounds the bible cannot override: Google Ads' personalised-advertising policy on national origin is platform law, and Naina hard-confirmed the ban on May 19–20 after it was caught in market. Rank 2 beating rank 1 is the documented exception, not a precedent — see §0.

---

## 9. WHEN YOU CATCH A NEW FAILURE

When Naina catches something not on this list:

1. **Append it here** in the right section — don't write a new `feedback_*.md` memory file.
2. **Update the wikilink references** in [[brand-validator]] if the new ban affects validation logic.
3. **Update [[MEMORY]]** only with a one-line pointer to this file, not the ban itself.

This file is the single home for forbidden-pattern catalog. Memory files point here. Brand-validator scores against here. Production skills read here before drafting.

---

## Related

[[brand-validator]] · [[us-google-rsa-verified-facts]] · [[rsa-us-writing-rules]] · [[enrichment-not-remediation-us]] · [[tutor_coach_surface_not_keyword]] · [[cuemath_coach_not_named_tutor]] · [[frameworks-not-in-vo]] · [[verify-event-dates-before-writing]] · [[reference_creative_direction_doc]]
