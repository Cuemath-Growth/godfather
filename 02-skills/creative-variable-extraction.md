# Creative Variable Extraction — Capability Spec

**Owner:** Godfather + Sentinel
**Drafted:** 2026-05-05
**Use:** Spec for the standing pipeline jobs that derive Tier-2 creative variables on top of `creative_tags_v3`. Consumed by NRI/Non-NRI variable-rank analyses, Forge fork briefs, Lens scoring.
**Runtime:** Scripts at `04-reports/_tagger_v2/auto_pipeline/` (TBD — currently runs as inline SQL during analysis).

---

## Why this exists

`creative_tags_v3` (built Apr 30, 2026) captures 9 first-order variables: hook_frame, master_frame, close_type, specificity, pain_target, production_cue, language, evidence_hook, evidence_close, evidence_pain.

**What it doesn't capture:** the variables Forge needs to fork briefs that comply with Creative Direction v1.0:
- Which MathFit dimension does the ad name? (Clarity / Application / Confidence)
- Does the coach get visibility via Tenure / Memory / Name-only?
- Does the ad follow the Goal → Mechanism → Destination three-beat?
- Is there an outcome anchor (AMC rank, SAT delta, grade jump)?
- Specific badge variants beyond raw close_type
- Video duration · OST density · holiday-cohort tag

This spec defines the regex/rules pass that derives these from `evidence_*` text + `notes` (and Meta API for duration). One quarterly re-run keeps every analysis fresh.

---

## Derived variables

### 1. `mathfit_dimension`

**Values:** `Clarity` | `Application` | `Confidence` | `Unclear` | `Multiple-mixed`

**Rules** (apply in order on `evidence_hook` + `evidence_close` + `evidence_pain` concatenated):

| Match pattern | Dimension |
|---|---|
| "explain", "why", "understand", "concept", "common core", "rigour", "fundamentals", "depth" | Clarity |
| "AMC", "Math Kangaroo", "MATHCOUNTS", "olympiad", "honors", "advanced", "accelerat", "honors track", "placement", "honor roll" | Application |
| "SAT", "ACT", "AP exam", "competition", "confidence", "hesitant", "fear", "anxiety", "doesn't volunteer", "freezes" | Confidence |
| Two or more dimensions match | Multiple-mixed (flag — Creative Direction §3 violation: "name exactly ONE") |
| No match | Unclear |

**QA gate:** Manual verification on top-200 spend ads before trusting. Sentinel runs sample audit.

### 2. `coach_tenure_signal`

**Values:** `Tenure-stated` | `Memory-stated` | `Name-only` | `Anonymous`

| Pattern | Value |
|---|---|
| "Year [N]", "since [grade/year]", "[N] years with", "same coach", "long-term coach", "still her tutor" | Tenure-stated |
| "remembers", "knew she was stuck", "picked up where", "she said last week" | Memory-stated |
| Has a coach name (Aditi, Meghana, Karthik, etc.) but no tenure or memory framing | Name-only |
| No coach reference | Anonymous |

**Why granular:** per the "MathFit + dedicated long-term tutor in every comm" feedback rule, tenure framing is the strongest tutor proof. Named-only is the weakest tier that still satisfies §4.

### 3. `three_beat_compliance`

**Values:** `Compliant` | `Partial` | `Non-compliant`

A creative is **Compliant** if the transcript or static stack contains, in order:
- A **Goal beat** (parent goal in their language: grades, competition, foundation, etc.)
- A **Mechanism beat** (one MathFit dimension explained)
- A **Destination beat** (fletch close — "Building MathFit X. One coach. Class by class.")

**Detection:** order-aware regex on evidence_hook + evidence_close. Goal beat lives in evidence_hook; destination beat lives in evidence_close (must contain "MathFit" OR "free class" + coach reference).

`Partial`: 2 of 3 beats present. `Non-compliant`: 0 or 1.

### 4. `outcome_anchor`

**Values:** `score-jump` | `contest-rank` | `grade-jump` | `parent-count` | `none`

| Pattern | Type |
|---|---|
| "+[N] SAT", "[N] points", "score jumped", "1500+", "perfect score" | score-jump |
| "AMC Honor Roll", "AMC 8 winner", "Math Kangaroo top", "MATHCOUNTS", "olympiad qualifier" | contest-rank |
| "two grade levels", "[N] grades ahead", "advanced to honors", "skipped a grade" | grade-jump |
| "200,000+ Students", "[N]+ parents", "[N]K families" | parent-count |
| None | none |

### 5. `badge_variant`

**Values:** `top-1pct` | `1-in-200` | `top-0.5pct` | `hand-picked` ⚠️ | `trustpilot-stars` | `parent-count` | `manan-credentials` | `outcome-claim` | `none`

| Pattern | Variant |
|---|---|
| "top 1%", "1%" + "tutor"/"teacher" | top-1pct |
| "1 in 200", "1-in-200" | 1-in-200 |
| "top 0.5%", "top 0.1%" | top-0.5pct |
| "hand-picked", "handpicked" | hand-picked ⚠️ (BLEACHED — flag for kill in findings, not fork) |
| "★★★★★", "5 stars", "Trustpilot" | trustpilot-stars |
| "[N]K students", "[N]+ parents", "[N] families" | parent-count |
| "Manan Khurma" + tutor-credential mention | manan-credentials |
| score-jump or contest-rank claim used as badge | outcome-claim |
| No badge | none |

### 6. `video_length_bucket` (videos only)

**Values:** `0-6s` | `6-15s` | `15-30s` | `30-60s` | `60s+` | `static` (for static creatives)

**Source:** Meta API `creative.video_data.length_seconds` per ad. Pull at analysis time.

### 7. `ost_density`

**Continuous variable** (chars per second of video, or chars per static).

**Source:** char count of evidence_hook + evidence_close + evidence_pain ÷ video duration (or 1 for static).

**Reporting buckets:** Sparse (<5 chars/s) · Moderate (5–15) · Dense (15–30) · Crowded (>30).

### 8. `holiday_cohort_flag`

**Values:** `mothers-day` | `fathers-day` | `memorial-day` | `juneteenth` | `july-4th` | `none`

**Detection:** ad date_range overlaps holiday window (±7 days) AND evidence_hook contains holiday reference, OR ad-name contains holiday keyword. Flag is for cohort segmentation in analysis (run with/without).

---

## SQL pattern (inline, no new tables)

For the May 2026 NRI analysis, all 8 derivations run as `CASE WHEN ... ILIKE ...` expressions in a single `WITH derived AS (...)` CTE. No DDL, no migration, no schema change. Output joined to `tagged_creatives` for spend/TD/CPTD attribution.

When the quarterly re-run hook lands, these CASE expressions get migrated to:
- A materialised view `creative_tags_v3_enriched` OR
- New columns on `creative_tags_v3` populated by Python script in `04-reports/_tagger_v2/auto_pipeline/derive_tier2.py`

For now: inline. Documented here so the pattern survives.

---

## Quarterly re-run checklist

When re-running this analysis (quarterly cadence, or earlier if creative direction shifts):

1. Re-pull live CRM Sheet + Meta API (don't trust stale Supabase tagged_creatives)
2. Re-run Tier-2 SQL CTE (this doc's spec)
3. Refresh manual QA on top-200 ads for `mathfit_dimension` (drift check)
4. Update this spec if Creative Direction has revised the dimensions or fletch
5. Re-bind palette extraction to new shortlist (not full corpus)

---

## Known gaps (not yet derived)

- **SACI per-ad codification** — qualitative, requires human review. Manual sample of 30 winners only.
- **End-card visual variant** — would need vision pass on last frame. Defer.
- **Audio tone / VO emotion** — separate research stream.
- **Visual badge placement** — defer until v1 NRI analysis confirms badge variable matters.

---

## See also

- [`reference_creative_tags_v3.md`](~/.claude/projects/-Users-nainajethalia/memory/reference_creative_tags_v3.md) — base table
- [`cuemath-creative-direction-v1.md`](../05-reference/cuemath-creative-direction-v1.md) — source of dimension and three-beat truth
- [`tagging-rubric.md`](./tagging-rubric.md) — v3 base taxonomy
- [`_plan-v2.md`](../04-reports/nri-creative-analysis/_plan-v2.md) — first analysis consuming this spec
