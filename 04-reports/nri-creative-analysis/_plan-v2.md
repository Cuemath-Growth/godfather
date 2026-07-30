# NRI Creative Performance Analysis — Plan v2 (FINAL)

**Owner:** Godfather
**Drafted:** 2026-05-05
**Status:** Naina-approved 2026-05-05 ("go" after consolidated agent review). Executing.
**Output destination:** `04-reports/nri-creative-analysis/`
**Predecessor:** `_plan-v1.md` (preserved for audit trail)

> **What changed v1 → v2:** Consolidates feedback from Sentinel (stats), Curator (structure), Forge (creative taxonomy), Scout (forward-look). 9 substantive changes, all Naina-greenlit.

---

## 0 · The question (unchanged)

Across every measurable creative variable, which ones move CPTD below the per-market ceiling for the NRI segment, with statistical confidence, audience held constant where possible? Output: ranked variables + interaction map + window-tagged shortlist of 8–12 ads to fork.

---

## 1 · Scope (locked v2)

| Decision | v1 | **v2** |
|---|---|---|
| Tracks | A: campaign-name NRI / B: ethnicity-tagged TDs | **A: ethnicity-weighted spend allocation** (per ad, attribute spend × NRI-share against NRI TDs — matches Pulse logic) / **B: ethnicity-tagged TDs**. Campaign-name version retained as sanity sidebar only. |
| CPTD ceiling | ₹35K unified | **Market-specific.** US-NRI <₹50K · India-NRI <₹3K · ROW-NRI <₹25K. Lift reported as "% improvement vs market median CPTD," not vs ₹35K absolute. ₹35K stays as portfolio ambition. |
| Variable-comparison window | 2025-11-01 → 2026-03-31, ≥14d cohort | 2025-11-01 → 2026-03-31, **≥21d cohort** (lead_created_date + 21d before TD attribution counted) |
| Headline reading | MTD May + 30d rolling | unchanged |
| Markets | US-NRI · India-NRI · ROW-NRI | US-NRI · India-NRI · **ROW split into ROW-NRI · ROW-NRI/NNES · ROW-combined** (rebundle if convergence <15% on CPTD) |
| Hard exclusions | Kiran + Rohini · CPTD <₹5K | unchanged + **single-ad-cell-share guardrail** (any ad ≥30% of cell spend gets called out) |

---

## 2 · Variables (locked v2)

### Tier 1 — from `creative_tags_v3` (no prep)

Hook frame · Master frame · Close type · Specificity · Pain target · Production cue · Language · Format · Talent type — 9 axes, all already tagged across 2,804 ads.

### Tier 2 — prep lifts (revised per Forge)

| Variable | Status | Method | Est. cost |
|---|---|---|---|
| **`mathfit_dimension`** ⭐ NEW | ADDED (Forge: most fork-relevant variable v1 missed) | Regex + rules pass on `content_summary` for Clarity / Application / Confidence keywords; manual verification on top-200 spend ads | 2 hrs |
| **`coach_tenure_signal`** ⭐ NEW | ADDED (Forge) | Regex pass: Name-only / Tenure-stated ("Year 2 with") / Memory-stated ("she remembers") | 1 hr |
| **`three_beat_compliance`** ⭐ NEW | ADDED (Forge) | Rules pass: detects Goal beat → Mechanism beat → Destination beat in transcript order | 2 hrs |
| **`outcome_anchor`** ⭐ NEW | ADDED (Forge) | Regex on AMC/SAT/grade-jump patterns. Type: score-jump / contest-rank / grade-jump / none | 1 hr |
| **Video length buckets** | KEPT | Meta API duration field, bucketed 0–6s · 6–15s · 15–30s · 30–60s · 60s+ | 30 min |
| **Badge presence + variant** | KEPT, EXPANDED | Regex on OCR/transcript. Variants: Top 1% · 1-in-200 · Top 0.5% · Hand-picked (flagged as bleached) · Trustpilot ★★★★★ · X parents trust · Manan/named-tutor stack · No badge | 1 hr |
| **OST density + social proof** | KEPT | Char-count from OCR ÷ frame count. Star-rating overlays, parent-count claims | 1 hr |
| **Mother's Day cohort flag** ⭐ NEW | ADDED (Scout) | Tag holiday-coded ads. Run variable comparison both with and without — catches urgency-buying winners | 30 min |
| **Palette extraction** | DEFERRED | Only on shortlisted 8–12 ads after they win on other variables. Cheapest middle ground. | $1 + 20 min |

**Total prep:** ~9 hrs build + ~$1 API. Down from 6 hrs in v1 because palette is deferred and dimension extraction is regex (not vision).

### Tier 3 — explicitly NOT in v2

Visual badge placement · End-card visual variant · Audio tone · SACI per-ad codification (manual sample of 30 winners only).

---

## 3 · Methodology (locked v2)

### 3.1 Joins

```
creative_tags_v3 (2,804 ads)
  ⇣ ad_name
LIVE meta_ad_data + CRM Sheet (re-pulled at run time, not stale Supabase rollup)
  ⇣ ad_name
content_summary (OCR + transcript)
  ⇣ ad_name
[NEW] tier-2 derived columns (dimension, tenure, three-beat, outcome-anchor, badge, duration, OST density)
```

### 3.2 Statistical bar (revised v2)

Cell = bucket of ads sharing one variable value. Reportable winner only if ALL true:
- ≥5 ads in cell
- ≥**₹2L** spend in cell (v1 was ₹50K — Sentinel's lift)
- **Track B: ≥5 NRI TDs AND ≥3 distinct ads contributing TDs** (v1 was ≥3 TDs flat)
- Track A: ≥5 total TDs
- Cohort age ≥21d per ad (v1 was 14d)
- Excludes Kiran + Rohini, CPTD <₹5K, ads with ≥30% cell-spend share (Sentinel's single-ad guard)

Cells failing the bar: reported as "directional only — not for budget moves."

### 3.3 Two metrics + match-rate diagnostic per cell

| Metric | What it shows |
|---|---|
| Average CPTD | Each ad equal weight |
| Spend-weighted CPTD | Each rupee equal weight |
| **CRM match-rate** ⭐ NEW (Sentinel) | % of cell ads with ≥0.65 token-overlap match. Cell-vs-cell comparison flagged if match-rates differ >15pts. |

### 3.4 MTD vs Cohort

Cohort view (lead_created_date) for variable comparison — confirmed Sentinel-correct.
MTD (trial_done_date) for headline reading sidebar only, with maturity caveat.

### 3.5 Brand-quality floor (Forge)

Before any winner hits the shortlist: manual SACI + three-beat check on top 30 candidates. Catches "Hand-picked" badge winners or offer-led closes that ship as brand debt. Adds ~1 hr at end.

---

## 4 · Output format (revised v2)

Same three artefacts, plus Scout's bridge section.

### 4.1 `findings.md`

- **Page 1 — verdict.** 3 actions, Signal + Why + Action.
- **Page 2 — variable rank table.** Per variable × cell × market × track. Lift vs **market median CPTD**.
- **Page 3 — interaction map.** Top 5 compounding combos.
- **Page 4 — window-tagged shortlist.** ⭐ NEW: every fork candidate labelled "for Jun 1–30 NRI rigour" / "for Jul AMC 8" / "evergreen." Plus fatigue-risk note (which winners are already running heavy in May — re-forking compounds fatigue).
- **Page 5 — Mother's Day cohort comparison.** ⭐ NEW: variable rankings with and without holiday-coded ads.
- **Page 6 — what we couldn't measure.** v3 gaps.

### 4.2 `nri-variable-table.csv` — same schema as v1

### 4.3 `nri-shortlist.csv` — adds `target_window` column

---

## 5 · Risks + mitigation (revised v2)

| Risk | Mitigation |
|---|---|
| Per-ad NRI TDs thin (median 1–3) | Sentinel's tighter bar (≥5 NRI TDs + ≥3 distinct ads) |
| CRM merge gaps (~70-80%) | Match-rate diagnostic per cell |
| ROW NRI/NNES is language-driven not ethnicity-driven | Three-way split (NRI · NRI/NNES · combined) before bundling |
| CPTD-only winners ship as brand debt | Manual SACI + three-beat check on top 30 |
| ₹35K is misleading per market | Market-median lift, not absolute ceiling |
| Findings arrive after May 1–15 push (already in-flight) | Output explicitly mapped to Jun 1–30 NRI rigour push and beyond |
| Mother's Day urgency winners don't replicate | Holiday cohort flag + with/without comparison |
| Stale tagged_creatives | Live re-pull from CRM Sheet + Meta API at run time |
| India NRI cohort is near-empty | Confirm sample size before splitting India column. If <5 ads pass bar, drop India from variable analysis (keep in headline) |

---

## 6 · Order of operations

1. ✅ Plan v2 written + approved
2. ✅ Curator structural fixes — `_plan-v1.md` renamed, `_plan-v2.md` is this file
3. **NEXT:** Capability spec doc → `02-skills/creative-variable-extraction.md`
4. **NEXT:** Refresh `05-reference/data-schemas.md` with creative_tags_v3 + content_summary
5. **NEXT:** MEMORY.md entry on kickoff
6. **PREP** (parallelisable):
   - 6a · Tier-2 regex passes (dimension · tenure · three-beat · outcome-anchor · badge · OST · holiday) ~7 hrs
   - 6b · Video duration via Meta API ~30 min
7. **DATA** · Live CRM Sheet re-pull + Meta API re-pull
8. **TRACK A RUN** · Ethnicity-weighted spend allocation across all variables, all markets
9. **TRACK B RUN** · NRI-converted ethnicity, all variables, all markets
10. **INTERACTION MAP** · Top combinations
11. **SHORTLIST** · 8–12 candidates, window-tagged, fatigue-risk noted
12. **BRAND QUALITY FLOOR** · Manual SACI + three-beat check on top 30 (~1 hr)
13. **PALETTE** · Vision pass on shortlisted 8–12 only (~$1, 20 min)
14. **DELIVERABLE** · `findings.md` + 2 CSVs to `04-reports/nri-creative-analysis/`
15. **REVIEW** · Verdict page with Naina, sign-off, hand to Forge for Jun briefs

---

## 7 · What we explicitly will NOT do (revised v2)

- Cross-market budget recommendations (silos rule)
- Recommendations on Kiran or Rohini ads
- Causation claims on colour psychology — correlation only
- Recommend a winning creative that fails the brand-quality floor
- Use bleached language ("personalized," "trusted," "world-class," "Hand-picked") in any output copy
- Run the analysis a second time without addressing the gaps in `02-skills/creative-variable-extraction.md` first

---

## 8 · Quarterly re-run hook (Curator-aligned)

The 7 Tier-2 prep jobs become standing pipeline scripts at `04-reports/_tagger_v2/auto_pipeline/`. Their capability specs live at `02-skills/creative-variable-extraction.md`. Schema doc (`05-reference/data-schemas.md`) gets the new derived columns appended. Next NRI re-run (Q3) needs no prep.

---

## 9 · Appendix — agent review snapshots (preserved for audit)

- **Sentinel:** Approve with changes. Ethnicity-weighted Track A; ≥5 NRI TDs + ≥3 distinct ads; 21d cohort; market-specific ceilings; ROW split; match-rate diagnostic; 30%-cell-share guardrail. All accepted.
- **Curator:** Plan rename done. Capability docs going to `02-skills/`. Schema doc refresh + MEMORY.md entry pending. All accepted.
- **Forge:** `mathfit_dimension`, `coach_tenure_signal`, `three_beat_compliance`, `outcome_anchor` added. Palette deferred to shortlist-only (Naina kept colour curiosity, Forge's strategic objection respected). Brand-quality floor accepted.
- **Scout:** Window-tagged shortlist, Mother's Day cohort flag, fatigue-risk note, India narratives surfaced as gap (no india-may-jul-2026.md exists — proceed without).
