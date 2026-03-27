Priority: This document overrides any conflicting definition in the vault.
Scope: Data logic, column mappings, metric definitions, pipeline architecture.
Last updated: 2026-03-28

How to use this file
Claude Code: Read this BEFORE reading any agent spec or reference doc. Where this conflicts with vault docs, THIS WINS. Items marked ⚠️ MUST VERIFY require a manual check before building — do not assume or guess.

## SECTION 1 — Currency
Confirmed: ALL spend data is INR (₹) across all markets and all sheets.

- Meta Ads Manager billing currency for all Cuemath accounts = INR
- The Spent column in the Meta Ads sheet (11q8zU3mRa1RzD8WSjanRVAzXBXXoiFsZNXo_R4OwbKk, gid=1805066969) = INR
- The Perf Tracker Daily amount_spent column = INR
- US, India, AUS, MEA — all in INR. No exceptions.

Override: funnel-definitions.md shows US thresholds with $ signs (e.g., "CPQL < $10,000"). Those are display errors. The values are in INR. Render all thresholds with ₹ in the UI.

## SECTION 2 — CRM Column Mapping (Confirmed)
Source: gid=2057861499 (Leads tab)
Filter: where G='meta' → confirmed correct. Column G = utm_medium.

| Column Letter | Actual Header | Code Should Use | Status |
|---|---|---|---|
| G | utm_medium | utm_medium (col G) | ✓ Correct |
| J | mx_utm_adcontent | mx_utm_adcontent | ✓ Correct |
| L | landing_type | — | ❌ README wrong — QL column is elsewhere |
| U | paid | paid | ✓ Correct (enrollment flag 0/1) |

### ⚠️ MUST VERIFY — QL Count Column
The README states ql_count is at column L. Column L is actually landing_type.
Action required: Open the CRM Leads tab, find the column that contains 0 or 1 indicating whether a lead qualified. Record the exact header name and column letter here before building any CRM portfolio total logic.

Placeholder (replace after verification):
- QL column header: UNKNOWN
- QL column letter: UNKNOWN

### ⚠️ MUST VERIFY — Revenue / net_booking Column
The README states net_booking is at column U. Column U is actually paid.
Action required: Open the CRM Leads tab, find the column containing revenue value for enrolled students (will be a numeric value in thousands or lakh range). Record exact header and column letter.

Placeholder (replace after verification):
- Revenue column header: UNKNOWN
- Revenue column letter: UNKNOWN
- Revenue unit: UNKNOWN (paise / rupees / lakhs — determines whether ×100 multiplier applies)

Risk if unresolved: Revenue and ROAS will be wrong. Do not display revenue or ROAS metrics in any tab until this is verified.

### Confirmed CRM columns (cross-referenced as reliable):
```
lead_created_date     → Date of lead creation (use for QL date filtering)
trial_done_date       → Date of trial (use for TD date filtering)
paid_date             → Date of enrollment (use for Paid date filtering)
country_bucket        → Country filter
ethnicity             → NRI detection (contains 'nri' → NRI lead)
board                 → Board (IB / IGCSE / CBSE etc.) — used for India/MEA TQL
trial_scheduled       → Trial scheduled flag (0/1)
trial_done            → Trial done flag (0/1)
paid                  → Enrolled flag (0/1) [confirmed at col U]
mx_utm_campaign       → Campaign name for CRM→Meta matching
mx_utm_adcontent      → Ad name for CRM→Meta matching [confirmed at col J]
adset                 → Ad set name
```

## SECTION 3 — TQL Definitions (Authoritative)
This overrides ALL previous TQL definitions in the vault.

| Market | TQL Definition | Source Column |
|---|---|---|
| US | NRI QLs only | ethnicity contains 'nri' |
| India | IB + IGCSE board leads only | board = 'IB' OR 'IGCSE' |
| MEA | IB + IGCSE board leads only | board = 'IB' OR 'IGCSE' |
| APAC (AUS/NZ/SG) | Total QL count | No filter — all QLs qualify |
| UK | Total QL count | No filter — all QLs qualify |

Business logic: Leads from other boards (CBSE etc.) in India/MEA are unqualified. The board filter is live. TQL < QL is expected and correct for India/MEA — do not treat this as a data error.

CPTQL formula is the same everywhere: Spend / TQL — but TQL has different inputs per market as above.

Override: funnel-definitions.md says "All other markets = QL count" — this is outdated. India and MEA now use the board filter. data-schemas.md echoes the old definition — ignore it for TQL.

## SECTION 4 — Data Pipeline Architecture (Confirmed)
Two layers. Both are intentional. The gap between them must be visible in the UI — never hidden.

### Layer 1: Tagger Data (Creative-level)
- Source: Meta API pull OR CSV upload OR Meta Ads GSheet (gid=1805066969)
- Enriched by: CRM merge → adds TD, NRI, TS, Paid per ad (~70–80% match rate)
- Enriched by: Claude tagger → adds hook, format, benefit tags
- Stored: localStorage (gf_taggerData) + Supabase backup
- Feeds: Sentinel, Lens:Tag, Lens:Intel, Influencer tab, Oracle actions, Library
- Match rate: ~70–80%. 20–30% of CRM leads cannot be matched to a specific ad.

### Layer 2: CRM Direct (Portfolio-level)
- Source: CRM Leads sheet (gid=2057861499), filter where G='meta'
- Fetched: Fresh every session (not cached)
- Feeds: Oracle KPI cards (total TDs, TQL, Paid), Sentinel KPI cards
- Coverage: 100% of Meta leads — no matching gaps

### Perf Tracker Daily (Validation only)
- Source: gid=827992753
- Feeds: Oracle WoW comparison, Oracle date picker auto-range, spend validation in health panel
- NOT a primary data source for any metric except spend validation

### The gap — must be shown in UI
- Portfolio layer (CRM direct) will always show more TDs than creative layer (tagger data)
- This is expected — the difference is the ~20–30% of leads that couldn't be matched to an ad
- UI must show: "Portfolio: X TDs | Creative: Y TDs | Match rate: Z%"
- Never collapse these into one number without labelling the source

## SECTION 5 — LENS_MIN_CPTD Threshold Fix
Current code: Sanitizes any creative where CPTD < ₹5,000 as a false CRM match.
Problem: India green threshold for CPTD is ₹3,000. Legitimate India conversions are being zeroed out.

Fix: Make the sanitization threshold market-aware:
| Market | Sanity floor (CPTD below this = likely false match) |
|---|---|
| US | ₹5,000 |
| India | ₹1,500 |
| AUS | ₹5,000 |
| MEA | ₹3,000 |

Apply the floor ONLY within the relevant market's tagger data. Never apply the US floor to India data.

## SECTION 6 — APAC Sub-Country Parsing
APAC is not a single market. Parse campaign name prefixes to identify sub-countries:

| Campaign name prefix | Maps to |
|---|---|
| ANZ_ | Australia |
| ANZ-NZ_ | New Zealand |
| ANZ-SG_ or SNG_ | Singapore |
| No matching prefix | APAC (Others) |

This parsing must happen at data ingestion — before any geo filter is applied. Sentinel, Lens, and Oracle all need sub-country data, not just "APAC."

Override: data-schemas.md maps the ROW account directly to APAC without sub-country parsing. The parsing above is correct — implement it.

## SECTION 7 — Performance Thresholds (All ₹)
All thresholds are in INR. Replace any $ signs in the UI with ₹.

### US Market (Meta)
| Metric | Green | Amber | Red |
|---|---|---|---|
| CPQL | < ₹10,000 | ₹10k–₹15k | > ₹15,000 |
| CPTQL | < ₹15,000 | ₹15k–₹20k | > ₹20,000 |
| CPTD | < ₹35,000 | ₹35k–₹50k | > ₹50,000 |
| QL→TD% | > 50% | 30%–50% | < 30% |

### India Market (Meta)
| Metric | Green | Amber | Red |
|---|---|---|---|
| CPQL | < ₹500 | ₹500–₹800 | > ₹800 |
| CPTQL | < ₹800 | ₹800–₹1,200 | > ₹1,200 |
| CPTD | < ₹3,000 | ₹3k–₹5k | > ₹5,000 |

### Australia Market (Meta)
| Metric | Green | Amber | Red |
|---|---|---|---|
| CPQL | < ₹10,000 | ₹10k–₹15k | > ₹15,000 |
| CPTQL | < ₹10,000 | ₹10k–₹15k | > ₹15,000 |
| CPTD | < ₹30,000 | ₹30k–₹45k | > ₹45,000 |
| QL→TD% | > 35% | 25%–35% | < 25% |

### MEA Market (Meta)
| Metric | Green | Amber | Red |
|---|---|---|---|
| CPQL | < ₹8,000 | ₹8k–₹10k | > ₹10,000 |
| CPTQL | < ₹8,000 | ₹8k–₹10k | > ₹10,000 |
| CPTD | < ₹25,000 | ₹25k–₹35k | > ₹35,000 |
| QL→TD% | > 35% | 25%–35% | < 25% |

## SECTION 8 — Oracle WoW Pipeline
Current state: Oracle WoW comparison reads from Perf Tracker Daily (old pipeline).
Correct state: Oracle WoW should read from tagger data filtered to current week vs previous week — same source as Sentinel.
Action: Replace getOracleMetrics() calls in WoW with tagger data filtered by date range.

## SECTION 9 — Revenue & ROAS
Do not display revenue or ROAS until the following is resolved:
1. The net_booking column location in the CRM sheet is unknown (see Section 2)
2. The unit of net_booking is unknown — could be paise, rupees, or lakhs
3. The README specifies revenue = sum of net_booking × 100 but the ×100 multiplier is undocumented

Once the column is identified: verify unit, document formula, then ship.

## SECTION 10 — Items Confirmed Correct (No Change Needed)
- utm_medium at column G → where G='meta' filter is correct ✓
- mx_utm_adcontent at column J → code is correct ✓
- paid at column U → paid/enrolled flag confirmed ✓
- Spend = INR across all markets ✓
- CRM merge match rate of 70–80% is expected, not a bug ✓
- TQL < QL for India/MEA is correct — board filter is live ✓
- All monetary values in ₹ — never USD, never AUD ✓

## OPEN ITEMS — Must resolve before full build
| # | Item | Blocker for |
|---|---|---|
| OI-1 | QL count column name + letter in CRM Leads tab | All CRM portfolio totals |
| OI-2 | net_booking column name + letter in CRM Leads tab | Revenue, ROAS, CAC |
| OI-3 | Revenue unit (paise / rupees / lakhs) | Revenue multiplier logic |
| OI-4 | Verify Oracle WoW is on tagger data or still on old pipeline | WoW accuracy |
| OI-5 | Confirm LENS_MIN_CPTD market-specific floors are implemented | India creative-layer TD count |
