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

### ✅ RESOLVED — QL Count Column
- QL column header: `qls` (column M, position 13)
- Value: 0 or 1 per lead
- Every row where utm_medium='meta' has qls=1 (8800 meta leads = 8800 QLs)
- So for Meta leads, QL count = row count (every Meta lead is a QL)

### ✅ RESOLVED — Revenue / net_booking Column
- net_booking column header: `net_booking` (column V, position 22)
- Revenue column header: `Revenue` (column AV, position 47)
- **net_booking unit: CRORES** (e.g., 0.019403 = ₹1.94L = ₹194,000)
- **Revenue unit: LAKHS** (e.g., 1.9403 = ₹1.94L = ₹194,000)
- **Revenue = net_booking × 100** (confirmed from data)
- Average revenue per enrolled student: ~₹60,000
- Total revenue (663 paid meta students): ~₹3.98Cr
- **Use `Revenue` column directly (in lakhs) × 100000 to get INR value**
- Or use `net_booking` column × 10000000 (crores to rupees)

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

| Market           | TQL Definition                                                     | Source Column               |
| ---------------- | ------------------------------------------------------------------ | --------------------------- |
| US               | NRI QLs only                                                       | ethnicity contains 'nri'    |
| India            | IB + IGCSE board leads only                                        | board = 'IB' OR 'IGCSE'     |
| MEA              | IB + IGCSE + Cambridge + American school board leads only. No CBSE | board = 'IB' OR 'IGCSE'     |
| APAC (AUS/NZ/SG) | Total QL count                                                     | No filter — all QLs qualify |
| UK               | Total QL count                                                     | No filter — all QLs qualify |

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

## SECTION 9 — Revenue & ROAS (FULLY VERIFIED from Excel)
Units verified against US_MTD tab totals:
- `net_booking` (leads col V): **CRORES** → × 10,000,000 for INR
- `Revenue` (leads col AU): **LAKHS** → × 100,000 for INR
- `Revenue (L)` in MTD tabs: **LAKHS** → × 100,000 for INR
- `ABV (K)` in MTD tabs: **RUPEES** (K is just a label, not thousands)
- `CAC (K)` in MTD tabs: **RUPEES** (Spend ÷ Enrolled)
- `ROAS`: ratio (Revenue INR ÷ Spend INR)

Verified: US MTD Spend ₹19.5L, Enrolled 16, Revenue 12.1L → ABV ₹75,808 ✓, CAC ₹1.22L ✓, ROAS 0.62 ✓

Code: `parseNumber(r['Revenue']) * 100000` for INR, or `parseNumber(r['net_booking']) * 10000000`

## SECTION 9b — Perf Tracker Spreadsheet Structure (VERIFIED from Excel)
Source: `1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs`
37 tabs total. Key tabs for Godfather:

| Tab | GID | Rows | Purpose | Used by |
|---|---|---|---|---|
| `leads` | 2057861499 | 13,753 | CRM leads (all channels) | CRM merge, portfolio totals |
| `cost` | 827992753 | 16,197 | Daily spend by campaign | Perf Tracker Daily (spend validation) |
| `US_MTD` | ? | 1,213 | US month-to-date performance | Reference only (team's view) |
| `ME_MTD` | ? | 1,014 | MEA month-to-date | Reference only |
| `APAC_MTD` | ? | 1,097 | APAC month-to-date | Reference only |
| `UK_MTD` | ? | 986 | UK month-to-date | Reference only |
| `summary` | 1622533630 | 32 | Monthly summary by geo | Regional cards |
| `mappingV2` | ? | 5,176 | Campaign name → category mapping | Could use for campaign classification |
| `USL_Adcontent_Data` | ? | 5,216 | US lead → ad content mapping | Better CRM matching? |

### `cost` tab columns (confirmed):
`month, day, region, country_segment, landing_type, campaign_name, medium, amount_spent, impressions, link_clicks, whatsapp category, Campaign Category, Final Campaign Category, Campaign Check`

### `cost` tab meta spend by geo (all-time):
- US: ₹503.0L
- APAC: ₹206.0L
- ME: ₹103.5L
- India: ₹58.3L
- UK: ₹19.3L
- **Total: ₹8.90Cr** (matches dashboard)
- Date range: 2025-11-01 to 2026-03-26

## SECTION 10 — Items Confirmed Correct (No Change Needed)
- utm_medium at column G → where G='meta' filter is correct ✓
- mx_utm_adcontent at column J → code is correct ✓
- paid at column U → paid/enrolled flag confirmed ✓
- Spend = INR across all markets ✓
- CRM merge match rate of 70–80% is expected, not a bug ✓
- TQL < QL for India/MEA is correct — board filter is live ✓
- All monetary values in ₹ — never USD, never AUD ✓

## OPEN ITEMS — Must resolve before full build
| # | Item | Blocker for | Status |
|---|---|---|---|
| OI-1 | QL count column name + letter | All CRM portfolio totals | ✅ RESOLVED: `qls` col 13, value 0/1 |
| OI-2 | net_booking column name + letter | Revenue, ROAS, CAC | ✅ RESOLVED: `net_booking` col 22 (crores), `Revenue` col 47 (lakhs) |
| OI-3 | Revenue unit | Revenue multiplier logic | ✅ RESOLVED: net_booking=crores, Revenue=lakhs, Revenue=net_booking×100 |
| OI-4 | Oracle WoW pipeline | WoW accuracy | 🔶 CONFIRMED: still on getOracleMetrics. Must migrate to tagger data. |
| OI-5 | LENS_MIN_CPTD market floors | India creative-layer TD count | 🔶 NOT YET IMPLEMENTED: US ₹5K, India ₹1.5K, AUS ₹5K, MEA ₹3K |
| OI-6 | TQL for India/MEA uses board filter | India/MEA CPTQL | 🔶 NOT YET IMPLEMENTED: code uses QL, should use IB+IGCSE only |
| OI-7 | APAC sub-country parsing | Geo accuracy | 🔶 NOT YET IMPLEMENTED |
| OI-8 | Revenue in code uses wrong multiplier | ROAS display | 🔶 NOT YET IMPLEMENTED |

## GROUND TRUTH FROM CSV (2026-03-28)
Source: `Perf Tracker - International - leads.csv` (complete CRM export)

| Market | Meta QLs | TQL | TDs | Paid | TQL Definition |
|---|---|---|---|---|---|
| US | 4,338 | 2,373 (NRI) | — | — | ethnicity = 'NRI' |
| APAC | 2,221 | 2,221 (all) | — | — | all QLs qualify |
| ME | 1,557 | 345 (IB+IGCSE) | — | — | board(ME) = IB or IGCSE |
| UK | 260 | 260 (all) | — | — | all QLs qualify |
| India | 154 | 11 (IB+IGCSE) | — | — | board(ME) = IB or IGCSE |
| Canada | 263 | — | — | — | (follows US rules?) |
| **Total** | **8,800** | — | **2,160** | **667** | |

Column G = utm_medium ✅ confirmed.
Board column = `board (ME)` (col 52). India: 7 IB + 4 IGCSE = 11 TQL out of 154 QL.
Ethnicity values for US: 2373 NRI, 1036 Non NRI, 710 Asian(Others), etc.
