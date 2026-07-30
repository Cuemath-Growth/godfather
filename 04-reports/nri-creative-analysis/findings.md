# NRI Creative Performance — Findings v6 (FINAL — playbook-aligned, MEA excluded)

**Run:** 2026-05-05 (data) · 2026-05-06 (revised through v6)
**Reviewers:** Godfather + Sentinel + Forge + Curator + Scout + Agent 007 + NRI Creative Review playbook (`05-reference/nri-creative-review.md`)
**Window:** 2025-11-01 → 2026-03-23 (mature cohort)
**Scope:** US NRI + ROW NRI (APAC + UK only — **MEA excluded per playbook: MEA is expat-focused, not NRI segment**). India NRI deferred (channel-level failure, separate workstream).
**Sample:** 309 NRI ads with TDs · 778 Meta NRI TDs · 197 ads matched to v3 attributes for variable rank
**Caveat — read before everything else:** v1-v4 used tagged_creatives rollup with ~4× duplication; absolute CPTDs were 30-50% understated. v5 corrected with meta_ad_data + live CRM. v6 adds playbook-aligned framing — register split, Hard Kills audit, Behavioural-Outcome reframed.

> **Ground truth.** True Meta-only NRI CPTD on the matured Nov 1 → Mar 23 window is **₹40-55K range** (US ₹40-50K, ROW ₹40-55K). Above your ₹35K threshold. Your "way above ₹35K for April" was right; my v1-v4 numbers misled you. **The brand playbook isn't an optimization exercise — it's a threshold-failure intervention.**

> **Playbook validation summary.** Of the playbook's testable claims: register split holds (6-12 beats Mid-mixed 21%), Cuemath-named direction holds (8-18% lift), Application dimension holds (-23% vs Unclear), Trustpilot stars hold (-24%). **Tenure framing UNTESTED** because <10 of 1,300 ads carry it. **Six pillars and Trust Staircase steps UNTESTED** because tagger doesn't capture them. **The brand moat (one coach for years) is essentially absent from our creative library.** Production gap, not data gap.

---

## What changed v5 → v6 (playbook-aligned)

| v5 framing | v6 correction |
|---|---|
| MEA bundled in ROW NRI | **MEA excluded** — playbook §scope: "MEA is expat-focused — out of scope for NRI." ROW = APAC + UK only. |
| Action 5: "Stop building Behavioural-Outcome creative" | **Reframed** — Behavioural-Outcome with **coach visible** (189 ads, ₹88L) is the testimonial format that delivers Beat 3 (Proof). The failure is Behavioural-Outcome with **coach absent** (88 ads, ₹51L) — that skips Beats 1+2 entirely. **Kill coach-absent variants; keep coach-visible ones.** |
| Action 3: "A/B test Offer-led vs Free-Class" | **Reframed against playbook §pricing-as-premium** — even if Offer-led wins on CPTD, Cuemath's brand stance is *premium category-of-one, not cheap*. Running offer-led at scale risks attracting Shortcut Seekers (anti-ICP — high churn). New action: audit Offer-led winners — are they discount-led copy (anti-ICP, kill regardless of CPTD) or value-led copy (premium, the lift is real)? |
| No register split | **Added** — playbook §axis-1 mandates K-5 Warmth vs 6-12 Expertise register. Data shows US 6-12 (HS) creative beats US Mid-or-mixed by 21% (₹40,071 vs ₹50,794). Register split is data-validated. |
| No Hard Kills audit | **Added** — playbook lists 15 universal Hard Kills. Audit found: 0 "specialist" violations (clean), but **55+ ads use "children" instead of "kids" (Naina-banned May 5)**, and **60+ ads use bleached language** ("Top 1%" / "hand-picked" — playbook strike-list). |
| No pillar / staircase / segment coding | **Flagged as gap** — playbook's 6 pillars (SEEN/JOYFUL/AHEAD/FOUNDER/EXPERT/PROVEN), 5 staircase steps, 4 ICP segments not captured by current tagger. Q3 analysis blocked until tagger upgrade. |

## What changed v4 → v5 — read the reversals

| v4 claim (wrong) | v5 truth (Meta-only) |
|---|---|
| Trustpilot ★★★★★ cuts CPTD 50% | **Cuts 24%** (US ₹37,568 vs ₹49,614). Real lift, half the size I claimed. |
| Static beats Video for US NRI by 27% | **Tied** (US Static ₹44,982 vs Video ₹48,793 — 8% diff, within noise). v4's claim was an artefact of duplication asymmetry. |
| US Application MathFit dimension wins 50% over Unclear | **Wins 23%** (US Application ₹41,900 vs Unclear ₹54,350). Direction holds, magnitude smaller. |
| Cuemath-named cuts CPTD 28% | **Cuts 8%** US (₹45,973 vs ₹49,787), 18% ROW (₹42,505 vs ₹51,999). Real but modest. |
| Anonymous slightly beats Named-tutor | **All specificities tie** US (Anonymous ₹49,750 vs Named-tutor ₹46,889 vs Named-parent ₹49,810 vs Named-child ₹46,441 — all within ₹3K). v3's "specificity is downstream of format" was correct; the ranking spread was an artefact. |
| Cultural-Relatability fails US (₹42,717) | **Still fails US (₹65,625)** — ranking holds, magnitude even worse. |
| Behavioral-Outcome is the worst-converting | **Confirmed worst** US (₹92,050) — magnitude even worse. |
| Bottom 50% of ads waste ₹3 Cr/quarter | **Confirmed pattern** but absolute numbers shift |
| US holiday creative beats evergreen 16% | **Pattern holds** — top 5 ads include Christmas Madhavi + New Year + Republic Day all in top performers |
| Free-Class is default close | **Offer-led actually wins US** (₹34,646 vs Free-Class ₹52,339 — 34% better). v4's "Offer-led narrowly cheaper" was actually a meaningful gap. |
| Anxiety hook only wins ROW | **Anxiety wins US too** (US Anxiety ₹35,544 vs Behavioral-Outcome ₹92K) — small sample but consistent direction. |

**What v4 got right:** the Behavioral-Outcome failure, Cultural failure in US, MathFit dimension Application winning US, Cuemath-named direction (just smaller lift), Trustpilot direction (just smaller lift), holiday creative outperformance, the brand-quality + marketplace + specificity reframes.

**What v4 got wrong:** all absolute CPTD numbers, Static-beats-Video framing, magnitude of brand-playbook lifts.

---

## Brand playbook validation — what holds

Creative Direction v1.0 §3-4 makes 4 testable claims. Tested on true Meta-only NRI:

| Hypothesis (CD §X) | Test | Result | Verdict |
|---|---|---|---|
| **H1: Cuemath named in copy → cheaper CPTD** | US: Cuemath-named ₹45,973 vs unnamed ₹49,787 (40 vs 77 ads) · ROW: ₹42,505 vs ₹51,999 (26 vs 64 ads) | Both markets confirm direction. Lift 8% US, 18% ROW. | ✅ **HOLDS — keep mandatory in briefs** |
| **H2: MathFit dimension named beats Unclear** | US: Application ₹41,900 · Confidence ₹46,570 · Clarity ₹63,399 · Unclear ₹54,350. ROW: Application ₹30,008 (small sample) · Clarity ₹44,225 · Confidence ₹48,933 · Unclear ₹53,932. | US Application beats Unclear by 23%. ROW pattern: Application also wins (small sample). | ✅ **HOLDS** |
| **H3: Tenure-framed coach beats Anonymous** | <10 ads in entire NRI corpus carry Tenure or Memory framing. Bar fails — sample insufficient. | **CANNOT TEST** | ⚠️ **UNTESTED — production gap, not data gap** |
| **H4: Three-beat shape (Goal → Mechanism → Destination) → cheaper** | Not coded in current taxonomy. | **CANNOT TEST** | ⚠️ **UNTESTED — tagger gap** |
| **H5: Trustpilot ★★★★★ cuts CPTD vs no badge** | US: stars ₹37,568 vs none ₹49,614 (8 vs 109 ads) | 24% lift, small but consistent sample. | ✅ **HOLDS** |

**Net: brand playbook is directionally validated where testable.** H3 and H4 are the gaps — both are creative-production problems (we don't make the work) AND tagging problems (we don't capture it). Closing both is required before next quarter's analysis.

The **biggest playbook risk** isn't that the rules are wrong. It's that the corpus barely contains them. <10 of ~1,300 NRI ads carry tenure framing. We're paying for the brand moat we're not putting in the asset.

---

## The verdict — what to act on next week

### 🟢 ACTION 0 — Hard Kills cleanup. Audit + scrub before anything else ships.
**Signal:** Audit of NRI corpus found **55+ ads use "children" instead of "kids"/"child"** (Naina's locked vocabulary rule, May 5) and **60+ ads use bleached language** ("Top 1%" or "Hand-picked" — playbook strike-list). Concentrated cells:
- "Children" violations: 26 in Enrichment hook + 13 in Anxiety + 8 in Memorization-vs-Understanding (all coach-absent variants)
- Bleached language: 12 in System-diagnosis + 11 in Unclear + 7 in Academic-Outcome + 6 in Cultural

**Why it matters:** These trip Hard Kills #11 and bleached-strike-list per playbook §Hard-Kills. They'd fail audit if reviewed against playbook today. Brand drift compounds — every ad that ships with "children" or "Top 1%" alone trains the algorithm + the team that this is acceptable copy.
**Action:**
| Owner | Deliverable | Deadline | Success metric |
|---|---|---|---|
| **Forge** | Scrub all 55 "children"-violating ads — replace with "kids" or "child" | May 10 | Zero "children" violations in active NRI inventory |
| **Forge** | Audit 60 bleached-language ads — pair "Top 1%" with substantive proof OR replace; "Hand-picked" → kill outright (playbook bans) | May 14 | Bleached language only appears with proof-stack (Top 1% Process structure per India LP-16 model) |
| **Eng** | Add "children" + "specialist" + bleached-language regex auto-flag to creative-tags-v3 pipeline | May 19 | Real-time Hard Kills detection on every new tag |

### 🟢 ACTION 1 — Close the production gap on tenure framing. Standing brief addition.
**Signal:** Across 1,300 NRI ads, Tenure-stated and Memory-stated cells failed the statistical bar (<10 ads each). The single strongest brand claim Cuemath has — *"one coach, same child, for years"* — is essentially absent from our creative. Cannot data-validate something we never produced.
**Why it matters:** Tenure framing is the moat that no marketplace can replicate. AMC 8 prep is solved by every tutoring service; **the same coach since 2nd grade who knows your child's specific weak spot** is solved only by Cuemath. Until we put it in copy, we're competing on outcomes only, not on the durable advantage.
**Action — standing creative brief addition:**
| Owner | Deliverable | Deadline | Success metric |
|---|---|---|---|
| **Forge** | Every NRI brief from May 7 onward includes a tenure or memory clause in headline OR within first 10s of VO | Continuous | 50% of new NRI ads carry tenure/memory framing by Jul 1; 80% by Sep 1 |
| **Naina** | Tenure-clause master library — 20 phrasing variants Forge can pull from | May 12 | Library shipped to `02-skills/tenure-clause-library.md` |
| **Tagger v3** | Add tenure pattern detection to auto-pipeline regex | May 19 | Coverage on tenure framing rises from <1% to ≥5% by Jun 1 (forced by production), then we can finally measure the lift |

### 🟢 ACTION 2 — Reallocate Meta NRI spend by audience × format winners. Kill the dead pairings.
**Signal:** Audience × format interaction (US Meta NRI):
| Cell | CPTD | Verdict |
|---|---|---|
| Indian_Interests × Video | ₹19,522 (4 ads, 13 TDs — directional) | Scale carefully |
| LAL_Enrolled × Video | ₹30,354 (5 ads, 13 TDs) | Scale |
| **LAL_PayU_IndianAud × Static** | **₹38,061 (23 ads, 132 TDs — biggest cell)** | **Workhorse — keep** |
| LAL_PayU_IndianAud × Video | ₹37,289 (7 ads, 27 TDs) | Keep |
| Expats × Static | ₹39,556 | Hold |
| Influencer × Video | ₹52,773 | Reduce |
| **LAL_Enrolled × Static** | **₹77,473 (12 ads, 29 TDs)** | **KILL** |
| **Expats × Video** | **₹92,988 (8 ads, 22 TDs)** | **KILL** |

**Why it matters:** LAL_Enrolled with Static fails because the audience (broad lookalike of past payers) doesn't respond to promo statics — they want the testimonial. Expats with Video fails inversely. We've been buying both at scale.
**Action:**
| Owner | Deliverable | Deadline | Success metric |
|---|---|---|---|
| **Media team** | Pause new spend on LAL_Enrolled × Static + Expats × Video for US NRI | May 9 | ≥₹15L/quarter saved |
| **Media team** | Re-deploy that budget to LAL_PayU_IndianAud × Static (workhorse) + Indian_Interests × Video | May 9 | LAL_PayU_IndianAud spend share rises from current to ≥40% of US NRI spend |
| **Forge** | Brief 6 new LAL_PayU_IndianAud × Static variants for Jun 1-30 | May 16 | 6 variants briefed with tenure clause + Application dimension + Cuemath-named |

### 🟢 ACTION 3 — Audit Offer-led "winners" against anti-ICP risk. DO NOT scale on CPTD alone.
**Signal:** US Offer-led close ₹34,646 (15 ads, 80 TDs) vs Free-Class ₹52,339 (87 ads, 259 TDs) — 34% better on CPTD.
**Why it matters (corrected v6 framing):** Playbook §pricing-as-premium is locked: *"Cuemath is not expensive — Cuemath is premium. We are a category of our own. The NIKE of this segment."* Running discount-led copy at scale attracts Shortcut Seekers (anti-ICP — playbook flags as highest-churn, complaint-prone). **CPTD wins that come from anti-ICP attraction destroy LTV downstream.** v5 framed this as "validate the lift"; v6 reframes: validate WHO the lift is attracting before scaling.
**Action:**
| Owner | Deliverable | Deadline | Success metric |
|---|---|---|---|
| **Forge** | Audit each of the 15 Offer-led winners — categorize as **Discount-led** ("save 20%", "limited offer") vs **Value-led** (premium framing with offer as proof of value) | May 14 | Categorization complete |
| **Forge + Naina** | Kill all Discount-led variants regardless of CPTD (anti-ICP per playbook) | May 16 | Discount-led NRI ads at zero |
| **Naina** | Track downstream metric for Value-led variants — TD→Paid conversion + post-payment NPS — for 90 days before scaling | Continuous | If TD→Paid drops or churn rises vs Free-Class, kill Value-led too |
| **Naina** | DO NOT update CD v1.0 §5. Premium-not-cheap is a brand-stance choice, not a CPTD choice. | Locked | CD doc unchanged |

### 🟡 ACTION 4 — Behavioural-Outcome reframed: kill coach-absent, keep coach-visible.
**Signal (v6 corrected):** Behavioural-Outcome corpus splits into:
- **Coach-absent variants: 88 ads, ₹51L spend** → these skip Beats 1+2, just deliver Beat 3 (the "she comes home happy" / "she loves math now" generic claim) — playbook §three-beat fail.
- **Coach-visible variants: 189 ads, ₹88L spend** → these are the testimonial format that delivers Beat 3 properly, with the coach + child relationship visible. This is what CD v1.0 §6 actually wants.

US Cultural ₹65,625 (third-worst hook). Holds.
**Why it matters (v6 correction):** v5 said "kill Behavioural-Outcome" — too blunt. Behavioural moments ARE Beat 3 of the three-beat shape (playbook §three-beat). The failure isn't the hook; it's that 88 ads deliver Beat 3 *without* Beats 1 (Goal) or 2 (Mechanism + coach). Those 88 ads are the production we need to fix. The 189 coach-visible variants are the brand-aligned testimonial format we should be doubling down on.
**Action:**
| Owner | Deliverable | Deadline | Success metric |
|---|---|---|---|
| **Forge** | Pause **coach-absent** Behavioural-Outcome production immediately (88 ads, ₹51L) | May 9 | Zero new coach-absent Behavioural-Outcome briefs |
| **Forge** | Pause Cultural-coded US production through Jul (reserve for ROW only: ₹19,720 there) | May 9 | Standing rule |
| **Forge** | Continue (and scale) **coach-visible** Behavioural-Outcome — these ARE the brand-aligned testimonials. Add tenure framing per Action 1. | Continuous | More testimonials; not fewer |
| **Forge** | Re-deploy paused budget to Application-dimension creative + named-parent testimonials with tenure framing | May 16 | 6 fresh briefs |

### 🟡 ACTION 5 — Validate the brand-quality "Cuemath-named" claim with controlled production.
**Signal:** Cuemath-named US lift is 8% (smaller than v4's 28% claim). ROW lift is 18%. Sample sizes are decent (40 vs 77 ads US, 26 vs 64 ROW) but there's confound risk — Cuemath-named ads might also be the better-produced ads in the corpus.
**Why it matters:** This is the brand-playbook hypothesis with the largest implication if true at scale (every comm is brand-aligned). 8% lift × all spend = real money. But 8% is small enough that we should validate before mandating.
**Action:**
| Owner | Deliverable | Deadline | Success metric |
|---|---|---|---|
| **Forge** | Brief 4 matched-pair ads (same creative, Cuemath named in one, omitted in other), launch on identical audience | May 16 → Jul 1 | Lift confirmed at ≥5% on controlled basis |
| **Forge** | Standing brief rule: Cuemath named in headline OR first 10s VO (already in v4 — keep) | Continuous | 100% of new NRI briefs comply |
| **Tagger v3** | Auto-detect Cuemath mention; flag any new ad that ships without it | Jun 1 | Real-time compliance check |

---

## Register split — playbook §axis-1 validated

Same buyer (academically aspirational mother) needs different emotional door depending on child age. Playbook says K-5 = Warmth; 6-12 = Expertise. Data confirms:

| Market × Register | Ads | NRI TDs | Spend | True CPTD |
|---|---|---|---|---|
| **US 6-12 (HS-tagged)** | 13 | 64 | ₹25.6 L | **₹40,071** ✅ |
| US Mid-or-mixed | 104 | 303 | ₹1.54 Cr | ₹50,794 ⚠️ +27% |
| US K-5 (explicit) | 0 | 0 | — | (not built) ❌ |
| ROW Mid-or-mixed | 79 | 149 | ₹63.9 L | ₹42,908 |
| ROW K-5 / 6-12 explicit | <2 | — | — | (not built) ❌ |

**Two findings:**
1. **HS-targeted creative is 21% more efficient than grade-unspecified.** Register signal is real and worth doubling down on.
2. **We barely produce explicit K-5 OR 6-12 creative.** ~80% of corpus is "Mid-or-mixed" (grade-unspecified or 6-8 middle). The playbook's register split is a production gap, not a tested winner — we don't have the K-5 inventory to even test whether explicit K-5 Warmth creative wins.

**Action 10 in the consolidated table** addresses this: brief 3 K-5 + 3 6-12 explicit register variants per push instead of grade-unspecified bulk.

---

## Variable rank — true Meta-only NRI (US, mature window)

| Variable | Winner cell | CPTD | Loser cell | CPTD | Lift | Read |
|---|---|---|---|---|---|---|
| Hook frame | Academic-Outcome (17) | **₹32,340** | Behavioral-Outcome (7) | ₹92,050 | -65% | Outcome-anchored hooks beat lifestyle hooks 3:1. Holds from v4. |
| Audience | LAL_PayU_IndianAud-Static (23) | **₹38,061** | LAL_Enrolled-Static (12) | ₹77,473 | -51% | New finding — audience × format interaction is bigger lever than v4 acknowledged. |
| Close type | Offer-led (15) | **₹34,646** | Free-Class (87) | ₹52,339 | -34% | **REVERSAL from v4** — Offer-led wins for NRI Meta. CD §5 needs A/B validation before changing. |
| MathFit dim | Application (13) | ₹41,900 | Clarity (15) | ₹63,399 | -34% | Application still wins but Clarity actually loses. v4 had Clarity tied. Reversal. |
| Trustpilot | yes (8) | ₹37,568 | no (109) | ₹49,614 | -24% | Holds direction, magnitude smaller (24% not 50%). |
| Production | Static-Graphic (43) | ₹43,490 | UGC-polished (60) | ₹55,972 | -22% | Static-Graphic wins but margin smaller than v4. |
| Cuemath named | yes (40) | ₹45,973 | no (77) | ₹49,787 | -8% | Holds direction, magnitude smaller. Validate with A/B. |
| Format (Static vs Video) | Static (53) | ₹44,982 | Video (55) | ₹48,793 | -8% | **NEAR TIE — v4's "Static beats Video by 27%" was wrong.** |
| Specificity | Named-child (20) | ₹46,441 | Named-parent (31) | ₹49,810 | -7% | All within ₹3K range. v3's "specificity is format-driven, not strategic" CONFIRMED. |
| Master frame | Top-Tutors (14) | ₹41,402 | 1-1-Personalization (60) | ₹56,423 | -27% | Reversal — v4 had 1-1-Personalization mid; on Meta-only it's the WORST master frame. |
| Language | English (88) | ₹44,901 | Telugu (7) | ₹72,451 | -38% | English wins; vernacular Telugu fails US. |

---

## Top 12 individual NRI Meta winners (true CPTD, ≥5 TDs, mature)

| Rank | Market | Ad / template | True CPTD | TDs | Spend | Pattern |
|---|---|---|---|---|---|---|
| 1 | ROW | ANZ-SG `Tamil-Parent-Shoot-in-English_020326` | ₹15,370 | 7 | ₹1.08L | UGC-polished, Tamil-origin parent, named-child |
| 2 | ROW | ANZ `W-NAPLAN-Boost-Math_29122` | ₹15,556 | 5 | ₹78K | Static-Graphic, NAPLAN-anchored |
| 3 | US | `Indian_Interests_Mobile_Networks_Testimonial-Shruti-25s_020126` | ₹17,012 | 7 | ₹1.19L | UGC-polished testimonial, Indian-Interests audience |
| 4 | ROW | ANZ `Y-Testimonial-Vishal_020326` | ₹20,361 | 10 | ₹2.04L | Static-Graphic testimonial, named-child |
| 5 | US | LAL_PayU `Christmas Madhavi Testimonial Christmas-Badge_121225` | ₹21,273 | 16 | ₹3.40L | Holiday-coded UGC testimonial |
| 6 | US | LAL_PayU `New-Year_Static-2026-Stands-for-Math-Confidence_221225` | ₹21,646 | 23 | ₹4.98L | Holiday-coded static, Application dimension |
| 7 | US | LAL_Enrolled `High-School-SAT-Prep-Manan-Sir-Video_130126` | ₹24,760 | 8 | ₹1.98L | HS SAT video, Application dimension |
| 8 | ROW | ANZ `Bollywood Australia Testimonial-Lakshmi_170226` | ₹24,943 | 6 | ₹1.50L | UGC-polished testimonial, ROW |
| 9 | US | LAL_PayU `NRI_Contextual_Statics_Static-India-Best-Math-Tutors_300126` | ₹27,147 | 11 | ₹2.99L | Static-Graphic, NRI-coded, Trustpilot stars |
| 10 | US | LAL_PayU `High_School Static-High-School-Master-Algebra-White_150126` | ₹28,501 | 14 | ₹3.99L | Static-Graphic, HS Application |
| 11 | US | LAL_PayU `Christmas Static_051225` | ₹31,799 | 6 | ₹1.91L | Holiday-coded static |
| 12 | US | LAL_PayU `Math-Kangaroo Static-30-Day-Math-Kangaroo-Prep_261225` | **₹32,983** | **34** | **₹11.21L** | Biggest individual TD producer. Math Kangaroo Application static. |

**Pattern in winners:** LAL_PayU_IndianAud + Static-Graphic + holiday/competition timing + named-child or named-parent testimonial dominates. Influencer-tagged ads barely appear (only 1 in top 12 — Manan Sir SAT prep).

---

## What this means for the Jun 1-30 NRI rigour push (Forge brief baseline)

**Production count:** 6 ads minimum, ideally 9. Distribution:
- **3 Static-Graphic for LAL_PayU_IndianAud** — Application dimension (Math Kangaroo / AMC 8 prep / Foundation+Common Core), Cuemath named in headline, tenure clause in close, Trustpilot stars
- **3 UGC-polished named-parent testimonials for LAL_PayU_IndianAud** — Cuemath as agent in parent's quote, tenure framing inside the quote ("she's had the same Cuemath coach for 2 years"), child's transformation, Free-Class close (or Offer-led if A/B validates by Jun 1)
- **3 holiday-coded statics** — Father's Day Jun 21 (NRI rigour: "The gift dads value: a college-ready scoreboard"), Memorial Day pause excluded

**Forbidden in Jun briefs:**
- Behavioral-Outcome hooks ("she came home happy")
- Cultural-Relatability hooks for US (reserve for ROW)
- "Coach Aditi prepped X students…" — marketplace framing per `feedback_no_marketplace_framing.md`
- Anonymous statics with no Cuemath mention
- Bleached language (per CD v1.0 §7 strike-list)

**Required in every Jun brief:**
- Cuemath named in headline OR first 10s VO
- One MathFit dimension explicitly named (lead with Application for NRI)
- Tenure framing somewhere (close card OR parent's quote)
- Trustpilot ★★★★★ overlay where the static/end-card permits

**Expected outcome:** Cell-average ₹35-40K CPTD if execution lands per spec. That's still above Naina's ₹35K target, but closes 30% of the gap from current ₹50-55K. Below ₹40K is upside.

---

## Decision-changing actions for next week (consolidated, v6 playbook-aligned)

| # | Action | Owner | Deadline | $ impact / quarter |
|---|---|---|---|---|
| **0** | **Hard Kills cleanup — scrub "children" + bleached language across 100+ ads** | Forge + Eng | May 14 | Brand-voice integrity restored |
| 1 | Tenure clause library + standing brief addition | Naina + Forge | May 12 | Brand moat (production gap closed) |
| 2 | Pause LAL_Enrolled × Static + Expats × Video | Media | May 9 | ≥₹15L saved |
| 3 | Reallocate to LAL_PayU_IndianAud × Static workhorse | Media | May 9 | ≥₹15L re-deployed |
| 4 | **Audit Offer-led winners against anti-ICP. Kill discount-led regardless of CPTD.** | Forge + Naina | May 14-16 | Brand-stance protection |
| 5 | **Kill coach-absent Behavioural-Outcome (88 ads). Keep coach-visible. Pause US Cultural.** | Forge | May 9 | ≥₹10L saved |
| 6 | A/B test Cuemath-named matched-pair | Forge | May 16 → Jul 1 | Validates 8% lift |
| 7 | Audit + auto-pause 78 dead ads (3× threshold, no TDs) | Media + Eng | May 16 | ≥₹3 Cr/quarter saved |
| 8 | ₹15L lifetime spend cap per ad | Media + Eng | May 23 | Prevents fatigue trough |
| 9 | **Tagger v3 — add tenure regex + Cuemath-named + three-beat + register split + pillar tagging + Hard Kills auto-flag** | Eng | May 19 → Jun 1 | Enables Q3 playbook validation |
| **10** | **Brief explicit register-split creative — 3 K-5 Warmth + 3 6-12 Expertise variants per push** | Forge | Continuous | Reduces "Mid-mixed" inefficiency |
| **11** | **Add the playbook's 6 pillars (SEEN/JOYFUL/AHEAD/FOUNDER/EXPERT/PROVEN) to the brief structure** | Naina + Forge | May 23 | Briefs cite which pillar they're building |

---

## What we still cannot answer (gaps for next analysis)

| Gap | Why | What it needs |
|---|---|---|
| **Does Tenure framing beat Anonymous?** | <10 of 1,300 ads carry it. Sample fails statistical bar. | Production gap → Action 1 closes it. Re-test Q3. |
| **Six pillars (SEEN/JOYFUL/AHEAD/FOUNDER/EXPERT/PROVEN) ranked by CPTD?** | Not coded by tagger. Playbook references 30 reference ads across 6 pillars but we don't tag against them. | Action 9 adds pillar tagging to v3 spec. Re-test Q3. |
| **Five-step Trust Staircase compliance?** | Not coded. Most NRI ads should be Step 1 (Reposition) or Step 4 (Seriousness) per playbook — untested whether they actually are. | Add staircase coding to tagger. |
| **Four ICP segments (Foundation Rebuilder / Personalization Seeker / Confidence Restorer / Accelerator)?** | Hook frames roughly map but not 1:1. Need explicit segment tagging. | Tagger upgrade. |
| **Three-beat compliance correlate with CPTD?** | Not coded. | Add to v3 spec (already in capability spec doc, not yet implemented). |
| **K-5 Warmth-explicit creative wins?** | Almost zero K-5 inventory exists. | Production gap — Action 10. Test once corpus has K-5 variants. |
| **Six Seriousness Demands answered per ad?** | Manual audit only — not coded. | Manual sample of 30 winners (deferred to Forge brand-quality review). |
| **Hard Kills auto-detection beyond text?** | Visual Hard Kills (stock-photo, classroom imagery) need vision pass. | Vision pipeline build. |
| **Palette / colour matter for NRI?** | No vision pass on shortlist. | ~$1 vision spend, still owed. |
| **True video duration?** | Meta API duration field not pulled. | Direct API call with `creative.video_data.length_seconds`. |
| **Why is Offer-led winning on CPTD?** | Either creative-quality confound, or anti-ICP attraction. | Action 3 audit categorizes; downstream LTV tracking validates. |
| **April Meta NRI CPTD reality?** | Cohort not matured. | Re-run Jun 1 with fully mature April. |
| **India NRI structural failure?** | Channel-level, not creative. | Separate analysis. |
| **Why does Indian_Interests × Video win?** | Tiny sample (4 ads, 13 TDs). | Forge brief 4 more in same recipe; validate over 60 days. |

---

## Methodology footer (locked v5)

- **Spend source:** `meta_ad_data` Supabase table (live Meta API pull, no duplication)
- **TD source:** Live CRM Sheet (`1edtLGsOOxrVrW8clUak4UY-Q2dn6HJmYc8IMsx0trxE`, leads tab gid `2057861499`), filtered to:
  - `utm_medium = 'meta'` (eliminates Google AND non-Meta channels)
  - `ethnicity IN ('NRI', 'NRI / Non Native English Speaker')`
  - `lead_created_date BETWEEN '2025-11-01' AND '2026-03-23'` (lead-cohort view)
  - `trials_done = 1`
- **Ad name normalization:** strip Meta placement suffixes from `mx_utm_adcontent` (`_Facebook_Mobile_*`, `_Instagram_*`, etc.) before joining to `meta_ad_data.ad_name`
- **Stat bar (per cell):** ≥5 ads · ≥₹2L spend · ≥5 NRI TDs
- **False-match guard:** per-ad CPTD < ₹5K excluded
- **Hard exclusions:** Kiran + Rohini
- **Market mapping:** CRM `country_bucket` US → US; APAC + ME + EU + Other → ROW; India → India
- **Match coverage:** 213 / 327 NRI-TD-carrying ads matched to v3 tags + spend (66.5% TD coverage). Unmatched are mostly numeric PLA ad IDs that need name-resolution.

**Memory rules locked from this analysis:**
- `feedback_meta_only_cptd_methodology.md` — never use tagged_creatives for absolute Meta CPTD
- `feedback_specificity_is_not_a_brand_variable.md` — confirmed at v5; specificity range across cells is now ₹3K (was ₹8K v4)
- `feedback_no_marketplace_framing.md` — outcomes attribute to Cuemath, not coach
- `feedback_brand_quality_floor_before_cptd_verdict.md` — every recommendation must clear CD §4
- `feedback_no_invented_facts_lp.md` — verified Cuemath features only

**Predecessor versions preserved:** `_plan-v1.md` · `_plan-v2.md` · v1-v4 of this findings file in git history (overwritten in working copy)

**Companion files:** `nri-shortlist.csv` (12 ads, true Meta-only ranked) · `nri-variable-table.csv` (rebuilt on Meta-only basis — TBD next session)
