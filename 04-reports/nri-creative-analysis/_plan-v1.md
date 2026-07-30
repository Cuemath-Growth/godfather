# NRI Creative Performance Analysis — Plan v1

**Owner:** Godfather
**Drafted:** 2026-05-05
**Status:** Pending agent review (Sentinel · Curator · Forge · Scout) → revise to v2 → Naina approves → execute
**Output destination:** `04-reports/nri-creative-analysis/findings.md` + companion CSVs

---

## 0 · The question, restated

> Across every measurable creative variable — hook, palette, length, badge, CTA, talent type, format, on-screen text density, end-card type, social proof variant — which ones move CPTD below ₹35K for the NRI segment, with statistical confidence, audience held constant where possible?

This is research, not a dashboard query. The output is a ranked list of variables (and variable combinations) we should build more of, plus the 8–12 ads to fork next.

---

## 1 · Scope (locked with Naina, 2026-05-05)

| Decision | Value |
|---|---|
| **NRI scope** | C — both NRI-served (audience-level) AND NRI-converted (ethnicity-tagged TDs), reported side by side |
| **CPTD ceiling** | ₹35K is the bar to be under. We hunt for the *floor* inside it (best cohort runs ~₹8K). |
| **Variable comparison window** | 2025-11-01 → 2026-03-31, ≥14d cohort filter per ad |
| **Headline reading** | MTD May + last-30 rolling, with cohort-maturity caveat called out |
| **Markets** | US-NRI · India-NRI · ROW-NRI (separate columns, no cross-market verdicts — markets-are-silos rule) |
| **NRI ethnicity labels in scope** | `NRI` + `NRI / Non Native English Speaker` — both treated as NRI |
| **Hard exclusions** | Kiran + Rohini ads (parent objection) · ads with CPTD < ₹5K (false-match per CRM merge protocol) |

### Why MTD alone won't work

Naina asked "why not MTD." Answer: trials take 2–4 weeks to complete. May 1–5 spend is ~full; May TDs barely populated. CPTD MTD is mathematically guaranteed to look inflated regardless of creative quality. We use MTD only as a portfolio-level "where are we now" reading, never to compare creative variables.

### Why "way above ₹35K" is probably a measurement artifact

Mature NRI CPTD by market (Mar 1–23, 2026, last fully matured window in Supabase):

| Market | NRI cohort | Ads | Spend | TDs | CPTD |
|---|---|---|---|---|---|
| US | NRI | 262 | ₹2.11Cr | 1,254 | ₹16,822 |
| US | NRI / NNES | 25 | ₹20.3L | 149 | ₹13,628 |
| ROW | NRI | 37 | ₹15.7L | 191 | ₹8,192 |
| ROW | NRI / NNES | 205 | ₹1.30Cr | 635 | ₹20,474 |
| India | NRI / NNES | 46 | ₹14.4L | 128 | ₹11,230 |
| India | NRI | 32 | ₹10.2L | 66 | ₹15,499 |

All under ₹35K. If Pulse / CRM-direct is showing >₹35K, it's mixing NRI + Non-NRI (Non-NRI converts at ~1/6th the rate) or it's MTD. The analysis output will reconcile this explicitly.

---

## 2 · Variables we're testing

### Tier 1 — measurable now from `creative_tags_v3` (no prep needed)

| Variable | Source | Cells |
|---|---|---|
| Hook frame | hook_frame | 10 |
| Master frame | master_frame | 7 |
| Close type / CTA | close_type | 5 (incl. Trust-Badge!) |
| Specificity | specificity | 4 (Named-tutor / Named-child / Named-both / Anonymous) |
| Pain target | pain_target | 10 |
| Production cue | production_cue | 6 (UGC-raw / UGC-polished / Studio / AI-Gen / Static-Graphic / Animated) |
| Language | language | 7 |
| Format | meta_ad_data.creative_type | Video / Static |
| Talent type | derived: creator roster ∪ ad-name pattern ∪ production_cue | Influencer / In-house / Parent-testimonial / Studio |

### Tier 2 — adding before run (the "4 lifts" Naina greenlit)

| Variable | Method | Estimated cost |
|---|---|---|
| **Colour palette** (top-3 dominant hex per ad) | Vision pass over 2,186 thumbs in Storage. Anthropic vision call, batched. | ~$5 + ~2 hrs script |
| **Video length buckets** | Meta API field on video creatives. Bucketed: 0–6s · 6–15s · 15–30s · 30–60s · 60s+ | ~30 min, no API cost |
| **Badge presence + variant** | Regex on existing OCR/transcript in `content_summary`. Buckets: "Top 1%" · "1-in-200" · "Top 0.5%" · "Hand-picked" · "Trustpilot ★★★★★" · "X parents trust" · "No badge" | ~1 hr + manual sample-of-30 verification |
| **OST density + social proof patterns** | Char-count from OCR ÷ frame count (density). Plus regex for star-rating overlays, parent-count claims, named-school badges. | ~1 hr |

**Total prep:** ~6 hrs build + ~$10 API. Saves the lift the next time we re-run quarterly.

### Tier 3 — explicitly NOT in v1

- **Badge placement / size / colour as visual** — would need vision-on-frame, not just OCR. Skip until v1 shows badge variable matters; then drill in.
- **End-card visual variant (dark fletch vs light, logo position)** — skip; close_type is a reasonable proxy.
- **Audio / voice-over tone** — skip; transcript content is captured but tonal analysis is separate research.

---

## 3 · Methodology

### 3.1 Data joins

```
creative_tags_v3            (2,804 ads, all tagged)
  ⇣ join on ad_name
tagged_creatives             (creative-layer rollup; spend + TDs + ethnicity)
  ⇣ join on ad_name
content_summary              (OCR/transcript for badge + OST density)
  ⇣ join on ad_name
[NEW] palette_extract        (top-3 hex per ad, built in prep)
[NEW] duration_bucket        (built from Meta API in prep)
```

Verification before analysis: row-count match between v3 and tagged_creatives, % of ads with badge OCR, palette extraction success rate. If <90% join coverage on any tier, surface gap to Naina before running.

### 3.2 Statistical bar (a "cell" = a bucket of ads sharing one variable value)

A cell is reportable as a winner only if:

- ≥ 5 ads in the cell
- ≥ ₹50,000 spend in the cell
- ≥ 3 NRI TDs in the cell (Track B) **OR** ≥ 5 total TDs (Track A)
- Cohort age ≥ 14 days per ad
- Excludes Kiran + Rohini
- Excludes ads with raw CPTD < ₹5K (false-match guard per CRM merge protocol)

Cells that fail the bar are reported as "thin sample — directional only," not as winners.

### 3.3 Two metrics per cell, not one

| Metric | What it shows | Trap it dodges |
|---|---|---|
| **Average CPTD** | Each ad weighted equally | Big-spend ads can't dominate |
| **Spend-weighted CPTD** | Each rupee weighted equally | Low-spend cherry picks can't dominate |

When the two diverge by >20%, that's a flag: the cell isn't a clean signal — one ad is doing the work.

### 3.4 NRI-served (Track A) vs NRI-converted (Track B)

| Track | Definition | What it answers |
|---|---|---|
| **A — NRI-served** | All ads inside campaigns/adsets targeting NRI audiences (US Influencer, US NRI Advantage, India NRI, ROW NRI segments). Measured on overall TDs. | "What creative wins on the NRI media buy?" |
| **B — NRI-converted** | All ads with ≥3 NRI-flagged TDs (CRM ethnicity ∈ {NRI, NRI/NNES}). Measured on NRI-only TDs. | "What creative converts NRI parents specifically?" |

A variable is a **strong winner** only if it clears the bar in BOTH tracks within the same market. Variables that win in only one track get reported as "audience-bias winner" (A only) or "creative-pull winner" (B only).

### 3.5 Audience-constant comparison where possible

The cleanest comparison is two creatives in the same campaign + adset on the same days. We'll surface those directly when they exist (e.g., A/B variant pairs). Where they don't, we fall back to market-segmented cell comparison.

---

## 4 · Output format

Three artefacts, one folder:

### 4.1 `findings.md` — the read

- **Page 1 — verdict.** Three actions in Signal + Why + Action format. No more.
- **Page 2 — variable rank table.** Every variable from Tier 1 + Tier 2, ranked by lift vs NRI baseline within each market.
- **Page 3 — interaction map.** Top 5 variable combinations that compound (e.g., Cultural hook × Named-tutor × Free-Class × UGC-polished). Includes "audience constant" note where comparison is clean.
- **Page 4 — the shortlist.** 8–12 ads that win on multiple variables AND clear ₹35K. These are the templates Forge forks next.
- **Page 5 — what we couldn't measure.** Honest list of gaps for v2.

### 4.2 `nri-variable-table.csv`

One row per variable × cell × market × track. Columns: variable, cell_value, market, track, ads, spend, tds, avg_cptd, weighted_cptd, lift_vs_baseline, sample_passes_bar, best_ad, worst_ad.

### 4.3 `nri-shortlist.csv`

8–12 fork candidates. Columns: ad_name, market, track, hook, master_frame, close, specificity, production_cue, language, badge, video_length, palette_top3, cptd, tds, why_shortlisted.

---

## 5 · Risks + how I'm handling each

| Risk | Mitigation |
|---|---|
| **Per-ad NRI-TD counts too thin to compare (median 1–3)** | Aggregate at variable-cell level with stat bar. Track B explicitly accepts thinner samples but flags directionality. |
| **CRM merge gaps (~70-80% match rate)** | Track A measures on tagger-matched only; portfolio reading at top of doc reconciles to CRM-direct. |
| **Pulse / CRM headline doesn't match findings number** | Doc opens with reconciliation: matched vs portfolio, mature vs MTD. No buried numbers. |
| **Variables are correlated (Cultural hook ⊃ Vernacular language ⊃ Indian creator)** | Report main-effects + the 5 interactions explicitly. Don't claim independence we don't have. |
| **Statistical bar too tight → empty findings** | If a market has <8 winning cells across all variables, drop spend bar to ₹30K and re-run with explicit footnote. Better honest-thin than fake-thick. |
| **"Way above ₹35K" turns out to be CPNRI not CPTD** | Report both metrics in headline reading. Naina sees the source of confusion in one glance. |
| **tagged_creatives is stale (Mar 23 cap)** | Re-pull live data via Meta API + current Sheet read at execution time, not from stale Supabase rollup. Ground truth = live CRM Sheet + Meta API. |
| **Palette extraction noisy on mixed thumbs** | Run on first frame of videos + the static itself. Manual spot-check 20 ads before trusting. |
| **Badge OCR misses overlay variants the OCR engine can't read** | Vision-on-frame fallback for the 50 highest-spend ads with no OCR badge match. Targeted, not exhaustive. |

---

## 6 · Order of operations

1. **Plan review by 4 agents** (parallel, ~30 min each) — Sentinel, Curator, Forge, Scout
2. **Plan v2 to Naina** — incorporate feedback, surface conflicts, get final go
3. **Prep — Tier 2 lifts** (parallel, ~6 hrs total)
   - Palette extraction (Anthropic vision over 2,186 thumbs)
   - Video duration bucketing (Meta API pull)
   - Badge OCR pass + manual sample verification
   - OST density + social proof regex pass
4. **Live data pull** — fresh CRM Sheet + Meta API (not stale Supabase rollup) at run time
5. **Track A run** — NRI-served audience, all variables, all markets
6. **Track B run** — NRI-converted ethnicity, all variables, all markets
7. **Interaction map** — top combinations across both tracks
8. **Shortlist** — 8–12 fork candidates with full variable fingerprint each
9. **`findings.md` + 2 CSVs** to `04-reports/nri-creative-analysis/`
10. **Verdict page review with Naina** — three actions, sign-off, hand to Forge for fork briefs

---

## 7 · What we'll explicitly NOT do

- Cross-market budget recommendations (silos rule)
- Recommendations on Kiran or Rohini ads (parent objection)
- Causation claims on colour psychology — we report correlation, A/B tests would prove cause
- Naive ranking by raw CPTD alone — false-match guard at <₹5K
- Recommend a creative variant that wins one cell but fails the statistical bar
- Use bleached language ("personalized," "trusted," "world-class") in any output copy

---

## 8 · Quarterly re-run hook

The four Tier 2 prep jobs (palette, duration, badge, OST density) will be written as standing pipeline scripts and added to `04-reports/_tagger_v2/auto_pipeline/`. Next time we re-run NRI analysis (or build the Non-NRI sister analysis), we get the variables for free — no re-prep.

---

## 9 · Open questions for the agent reviewers

| Reviewer | Question I want answered |
|---|---|
| **Sentinel** | Is the Track A definition (campaign-name-based NRI targeting) too loose? Should we use ethnicity-weighted spend allocation instead? |
| **Sentinel** | Statistical bar — is ≥3 NRI TDs actually enough for Track B, or should I lift to ≥5? |
| **Curator** | Where do the 4 prep scripts live? `04-reports/_tagger_v2/auto_pipeline/` is the obvious choice but I want a sanity check before I commit the path. |
| **Forge** | What variables am I missing that you'd want to know before forking? FUAR signals? SACI checklist items? |
| **Forge** | Badge variant taxonomy — am I capturing the variants you actually deploy, or am I missing some (e.g., "Manan + named tutor credentials" stack)? |
| **Scout** | Anything in the next 3–6 weeks that makes this analysis premature or scoped wrong? Mother's Day NRI angle is in the Brain — does that change anything? |
