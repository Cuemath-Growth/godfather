# LP Planning Inputs

This folder feeds **Scout** ([[01-agents/05-scout]]). Two inputs.

---

## 1. Calendar (Google Sheet export)

**Source:** https://docs.google.com/spreadsheets/d/1U5jHYA8CpVoqXVQ6P2o2YZEuVWmtY780Ew5hu9n5xt0/

**How to export, monthly:**
1. Open the sheet
2. For each market tab (US, India, AUS):
   - File → Download → **Comma-separated values (.csv)**
   - Rename the file to lowercase market: `us.csv`, `india.csv`, `aus.csv`
   - Save into `calendar/`
3. That's it. Scout reads them on next run.

**Columns Scout uses:** Month, Season, School Phase, Event/Occasion, Audience, Ad Angle/Hook, Platform Fit, Priority.

**Markets not in the sheet** (MEA, UK, ROW): Scout falls back to `05-reference/seasonal-calendar.md`. Update those sections directly when you have new info.

---

## 2. Monthly inputs (your free-form notes)

**Filename:** `inputs/[YYYY-MM].md` — one file per month. Example: `2026-05.md` for May 2026.

**What to capture each month:**
- **Channel launches** — planned, not live (e.g., YouTube Shorts mid-June India)
- **Narratives** — what story we're pushing this month per market
- **Overrides** — any "skip the calendar this time" calls (e.g., "skip Mother's Day, push summer-camp instead")
- **Creator/asset gaps** — e.g., "no MEA summer footage yet"
- **Anything else** — gut calls, competitor moves, internal news

Free-form. No template required. Scout reads it as plain context.

---

## 3. Decided narratives (locked-in for the next 3 months)

**Folder:** `narratives/`

Per-market narratives that have been decided and signed off — typically a 3-month window. These are the **highest-authority hook source**: when a narrative file says May 1–10 = Mother's Day with the creative idea *"this Mother's Day, gift your child math confidence,"* that is what the LP must echo.

**Current files (May–Jul 2026):**
- `narratives/us-may-jul-2026.md` — Elementary, Middle School, High School (week-level granularity)
- `narratives/anz-may-jul-2026.md` — AU narratives + archetype mapping
- `narratives/uk-eu-may-jul-2026.md` — UK narratives + archetype mapping (EU not yet detailed)

When the period closes (Jul 31), archive and create the next file (`[market]-aug-oct-2026.md`).

---

## 4. Market briefs (persistent per-market context)

**Folder:** `briefs/`

Per-market reference that carries parent voice, archetypes, and objection patterns. Not period-bound. Update when new research lands.

**Current files:**
- `briefs/me-perf-creative-brief-2026-04-15.md` — ME parent voice from 116 trials + 282 AC calls (Mar–Apr 2026). IB/Cambridge priority. Pricing in AED.
- `briefs/trial-mastery-archetypes.md` — AU + UK parent archetypes (5 each) + 7 common objections. Sourced from the Trial Mastery internal training module.

---

## 5. Media plan & channel mix

**Folder:** `media-plan/`

Tells Scout and the LP writer **where the money is, what's BAU, and what new platforms are being tested.** Distinct from calendar (which says *when* + *what to say*). The channel mix sets LP destination + voice — a TikTok LP looks different from a LinkedIn LP from a Meta performance LP from a brand-awareness LP.

**Current files:**
- `media-plan/README.md` — pointer to the live Sheet + update rhythm
- `media-plan/channel-mix-summary.md` — digest of BAU vs experimental channels per market, brand vs performance budgets, voice rules per channel

**Source Sheet:** https://docs.google.com/spreadsheets/d/1q_mScP2PfbP-cCMzcLyq1YyDkaNes2rFV4GvmWFc15g/

---

## Update rhythm

- **Calendar CSVs:** Re-export on the 1st of each month, OR whenever you change the sheet
- **Monthly notes:** Create a new file at the start of each month. Add to it as the month unfolds.
- **Decided narratives:** Created when a 3-month plan locks. Archive at period end.
- **Market briefs:** Update when new parent voice / call data lands.
- **Media plan:** Re-check the Sheet whenever Scout/Writer is asked about a market. Update `channel-mix-summary.md` when channel mix shifts (e.g., experiment graduates to BAU).
- **MEA / UK / ROW:** Update `05-reference/seasonal-calendar.md` directly when something changes

---

## What Scout will do with this

Scout runs weekly (or on demand). It pulls upcoming events from the calendar, layers your monthly notes on top, and outputs Context Cards for moments 3–6 weeks out — one per market per moment.

Each Context Card hands off to Forge, which uses [[02-skills/production-skills/landing-page-content|the LP content skill]] to write 3 variants (Safe / Stretch / Wild).
