# Data Guardrails — Sentinel-Specific

These guardrails apply specifically to Sentinel's data ingestion, analysis, and output. They supplement the [[03-guardrails/00-master-guardrails|Master Guardrails]].

---

## Ingestion Rules

### D-01: Column Header Normalisation Is Mandatory
Raw data from Meta, Google, and CSV all use different column names. Sentinel must normalise before any analysis. Never assume column names — map them explicitly.

### D-02: Reject, Don't Guess
If a CSV has ambiguous columns (e.g., "Cost" without currency indicator), reject the file with a clear error message. Never guess the currency, geography, or funnel stage.

### D-03: Zero-Spend Rows Are Dead Rows
Rows where spend = 0 AND impressions = 0 are removed before analysis. They add noise without signal.

### D-04: Preserve All Original Columns
Add derived metrics (CPQL, CPTD, etc.) as new columns. Never overwrite or drop original data columns. The user may need raw values for cross-referencing.

---

## Analysis Rules

### D-05: No Aggregation Across Campaign Instances
This is [[03-guardrails/00-master-guardrails#G-01|G-01]] applied specifically: if "Static_IndianTutors_v1" ran in 5 different campaigns with different targeting, those are 5 separate rows in the output. Never average them.

### D-06: Split by Format Before Ranking
Static and video creatives are ranked separately. A static's CPQL is not comparable to a video's CPQL without context. Top 5 / Bottom 5 lists exist per format.

### D-07: Composite Scoring for Ranking
When ranking best/worst, use a composite score that weights:
- CPQL (30%) — top-of-funnel cost efficiency
- CPTD (40%) — bottom-of-funnel cost efficiency (most important)
- QL→TD% (20%) — lead quality signal
- Spend volume (10%) — statistical significance buffer

A creative with CPQL Rs. 5k but 1 QL is not "the best" — it's statistically insignificant. Minimum QL threshold for inclusion in top/bottom: 5 QLs.

### D-08: Funnel Breaks Are Always Flagged
Any row where QL > 10 but TD = 0 is flagged as a potential lead quality issue. This is not a creative problem — it's a targeting or audience problem. Flag it separately from creative performance.

### D-09: Time-Series Must Be Preserved
When data spans multiple months or periods, preserve the time dimension. A creative that was green in January but amber in February is exhibiting fatigue — collapsing the periods hides this.

---

## Output Rules

### D-10: Multi-Tab Structure in Excel Exports
When producing Excel output:
- Tab 1: Best Videos (individual rows)
- Tab 2: Worst Videos (individual rows)
- Tab 3: Best Statics (individual rows)
- Tab 4: Worst Statics (individual rows)
- Tab 5: Anomalies / Flags
- Tab 6: Summary

Each tab has colour-coded headers and is cleanly named. No unnamed sheets.

### D-11: Every Row Has Full Hierarchy
Every output row must include: Campaign Name, Ad Set Name, Ad Name, Creative Type, and all funnel metrics. No partial rows.

### D-12: Green/Amber/Red Scoring Is Visible
Every metric in the output should have a visual score indicator. In JSON output, this is a `score` field. In Excel, this is cell background colour.

---

## See Also

- [[03-guardrails/00-master-guardrails|Master Guardrails]]
- [[01-agents/01-sentinel|Sentinel Agent Definition]]
- [[05-reference/funnel-definitions|Funnel Definitions]]
