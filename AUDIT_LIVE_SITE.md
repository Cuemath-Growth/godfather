# Godfather Live Site Audit — March 29 2026
## https://godfather-cuemath.netlify.app

Three-pass audit: CMO, Data Analyst, Product Designer.

---

## VERDICT: Powerful engine, raw UI. Grades:

| Dimension | Grade | Why |
|-----------|-------|-----|
| First-time experience | D | No data on load, no guided setup, 5+ manual steps before first insight |
| Decision speed | C | Verdicts exist on some pages but buried under data dumps |
| Data integrity | B- | Sanitizer works, numbers trace correctly, but format filter has CRM gap |
| Terminology | C- | Glossary exists (floating ? button) but abbreviations unexplained inline |
| Consistency | C | 3 different button styles, section cards inconsistent, urgency not visual |
| Intelligence vs Data | 1.8/3 | Create tab = smart. Performance tab = pure spreadsheet. Rest = mixed. |

---

## TIER 1: Fix Today (Blocks everything)

### 1. Auto-load data on first visit
**Problem:** Live site opens empty. User must go to Settings → Save → Refresh.
**Root cause:** Boot sequence doesn't auto-fetch if localStorage is empty.
**Status:** FIXED this session — `refreshData()` now runs on every boot, Supabase re-renders on load.
**Verify:** Hard refresh live site, confirm data appears within 5 seconds.

### 2. Data freshness badge in global header
**Problem:** No indication if data is real, stale, or loading. "Last refreshed: 2h ago" only shows briefly on Dashboard.
**Fix:** Persistent badge in top-right header bar: "Synced 3m ago" (green) / "Stale: 2d ago" (red). Visible on ALL pages.

### 3. Remove example/placeholder cards from empty state
**Problem:** "e.g. Static_NRI_V3 — ₹42K spent" looks like real data. Breaks trust.
**Fix:** Replace with step-by-step onboarding: "Step 1: Sheets connected ✓ Step 2: Data loading... Step 3: Ready"

---

## TIER 2: Fix This Week (Intelligence quality)

### 4. Performance page: summary insight above the data
**Problem:** Top 5 / Bottom 5 tables are pure spreadsheets. No "so what?"
**Fix:** Above the tables, add: "Your top 3 creatives drive 60% of trials. Bottom 5 cost 3x more per trial — pause them to save ₹X."
**Status:** Verdict banner added this session but needs to be more specific with ad names.

### 5. Every metric abbreviation gets an inline tooltip
**Problem:** CPTD, TQL, CPQL, NRI, QL→TD% — none explained where they appear.
**Fix:** Wrap every metric label in `<span title="Cost Per Trial Done — Spend ÷ completed trials">CPTD</span>`. The METRIC_TOOLTIPS object exists — wire it to ALL pages, not just Performance KPIs.

### 6. Creators page: "Scale this creator" recommendation
**Problem:** Leaderboard shows numbers but no "Scale @mathwithmaya — 12K views, 8 enrols → allocate ₹50K."
**Fix:** Top 3 Scale creators get an action card with specific budget recommendation.
**Status:** Verdict summary added this session but needs dollar amounts.

### 7. Visual urgency hierarchy
**Problem:** "Pause Now" (urgent) looks same as "Market Health" (informational).
**Fix:** Red background + icon for PAUSE. Green for SCALE. Amber for WATCH. Gray for informational. Consistent across all pages.

---

## TIER 3: Fix This Month (Product polish)

### 8. Guided onboarding for first-time users
**Problem:** New team member doesn't know Settings → Tagger → Insights → Dashboard flow.
**Fix:** First-visit wizard: "Welcome to Godfather. Let's set up in 3 steps: 1) Connect sheets 2) Tag creatives 3) See insights." Progress bar persists until complete.

### 9. Workflow loop: Tagger → Insights dependency
**Problem:** Insights says "Tag your creatives first" but Tagger says "Use Dashboard Data." Circular.
**Fix:** Auto-tag on data load if Claude key is available. If not, show Tagger with clear CTA.

### 10. Consistent button/card system
**Problem:** 3 different button styles, cards with/without borders, inconsistent padding.
**Fix:** Design system: Primary (purple gradient), Secondary (outlined), Danger (red), Success (green). Apply everywhere.

### 11. Demo mode
**Problem:** Can't explore without real data.
**Fix:** "See demo" button loads sample dataset (50 creatives with realistic performance). User can explore all features before connecting real data.

---

## WHAT'S ACTUALLY GOOD (don't break these)

- **Create tab (Forge):** Best intelligence — winning formula + brand validation + copy output
- **Insights "What's Working" tab:** Monday Playbook is genuine intelligence
- **Tag Combos on Tagger:** "Use More" / "Avoid" with example ads — actionable
- **Dashboard Pause Now / Make More:** Action buttons that copy to clipboard — real workflow
- **Metric glossary (floating ? button):** Comprehensive definitions, just needs more visibility
- **Data sanitizer:** Single source of truth, applied everywhere — clean architecture

---

## NUMBERS TO VERIFY (next session with data loaded)

1. Dashboard CPTD matches Performance CPTD for same geo/date
2. US spend on Godfather matches Pulse (cuemathpulse.netlify.app)
3. Creator TDs on Creators tab match Tagger table for same ad
4. Changing geo filter changes ALL numbers on ALL pages
5. Format filter on Performance shows "—" for CRM metrics (not wrong numbers)
