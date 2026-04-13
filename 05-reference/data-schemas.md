# Godfather Data Schemas
Updated: 2026-03-28

## Currency
ALL spend data is in **INR (₹)** across all sheets and all markets (US, India, AUS, MEA, UK).
The Meta Ads Manager reports in INR for all Cuemath ad accounts.

## Funnel Order
Lead → Qualified Lead (QL) → NRI Filter → Trial Signup (TS) → Trial Done (TD) → Paid/Enrolled

**TQL (True Qualified Lead):** US market = NRI count only. All other markets = QL count. This is because most US QLs are non-NRI and don't convert.

---

## Data Architecture (Two Layers)

**Portfolio layer** (totals — Oracle KPI cards):
- Spend: from tagger data (ad-level, most granular)
- TD/TQL/Paid: from CRM direct (counts 100% of Meta leads, no matching gaps)
- CPTD = tagger spend ÷ CRM TDs

**Creative layer** (breakdown — Sentinel, Lens, Influencer):
- All metrics from tagger data (Meta API + CRM merge)
- CRM merge matches ~70-80% of leads to specific ads
- Unmatched leads exist in portfolio layer but not creative layer

---

## Sheet 1: Regional Performance Tracker (Monthly)
**Source:** `1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs`
**GID:** 1622533630
**Structure:** Monthly time periods (paired as actual/target), rows by geo
**Geos:** US, APAC, ME, UK
**Metrics:** Spend, NRI QL, CPNRI, CPQL, Revenue, ROAS
**Usage:** Regional cards on Oracle dashboard. Validation only.

---

## Sheet 2: Perf Tracker Daily
**Source:** `1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs`
**GID:** 827992753
**NOT in original schema — discovered in code at line 3660**
**Structure:** Daily rows with medium, country_segment, region, spend, lead metrics
**Key columns:** day, medium, country_segment, region, spend
**Filter:** `medium = 'meta'` (code filters in JS after fetch)
**Usage:** Oracle date picker auto-sets range from this data. Spend validation against tagger data.
**Status:** NEEDS VERIFICATION — column names assumed, not confirmed against actual sheet.

---

## Sheet 3: CRM Leads
**Source:** `1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs`
**GID:** 2057861499
**Server-side filter:** `select * where G='meta'` (column G = utm_medium, NEEDS VERIFICATION)
**Key columns (from reference export gid=1527899395):**
| Column | Usage |
|--------|-------|
| lead_created_date | Date filtering for QLs |
| trial_done_date | Date filtering for TDs |
| paid_date | Date filtering for Paid |
| prospectid | Deduplication key |
| country_bucket | Geo filtering (US, India, AUS, etc.) |
| region | Geo fallback |
| ethnicity | NRI detection (contains 'nri' = NRI lead) |
| qls | QL count (0 or 1) |
| trials_done | TD count (0 or 1) |
| paid | Paid count (0 or 1) |
| net_booking / Revenue | Revenue for ROAS |
| mx_utm_campaign | Campaign name for CRM→Meta matching |
| mx_utm_adcontent | Ad content for CRM→Meta matching |

**CRM merge (mergeCRMWithMeta):**
- Direct match: 0.65 token overlap between ad_content and ad name
- Campaign fallback: 0.50 token overlap, proportional split by spend
- Deduplication: by prospectid (added 2026-03-28)
- Sanity checks: CPTD < ₹5K = false match, TD > QL on low-QL ads = inflated

---

## Sheet 4: Meta Ads Creative Performance
**Source:** `11q8zU3mRa1RzD8WSjanRVAzXBXXoiFsZNXo_R4OwbKk`
**GID:** 1805066969
**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Campaign name | Text | Campaign identifier (naming convention below) |
| Ad set name | Text | Ad set identifier |
| Ad name | Text | Ad identifier (creator name embedded for influencer ads) |
| Creative type | Text | "Video" or "Static" |
| QL | Integer | Qualified Leads |
| NRI | Integer | NRI conversions (from CRM merge) |
| TS | Integer | Trial Signups (from CRM merge) |
| TD | Integer | Trial Demos (from CRM merge) |
| Paid | Integer | Paid conversions (from CRM merge) |
| Spent | Integer | INR spend (NOT USD — schema was wrong) |
| CPQL, CPNRI, CPTD, CAC | Decimal | Derived cost metrics |
| QL-TS%, TS-TD%, QL-TD%, T-P% | Percentage | Funnel conversion rates |

**Scale:** ~2237 ads, ~₹8.9Cr total spend (as of 2026-03-28)

---

## Sheet 5: Costs Tracker (DEPRECATED)
**Source:** `1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs`
**GIDs:** US=1269911854, India=2111876089, ROW=825481270, MEA=330777251
**Status:** REMOVED as data source (2026-03-28 session). Manual date filters on the Google Sheet meant numbers changed depending on whoever last set the filter. All tabs now use Perf Tracker Daily + CRM.

---

## Sheet 6: Influencer Organic Performance
**Source:** `1laJcSF7qcHiaKgze0032poaT7QBSNGk99k0ZJXTFZ-Q`
**GID:** 645685654
**Structure:** Row 1 = summary (skip), Row 2 = headers, Row 3+ = data
**Columns (by position):**
| Position | Column |
|----------|--------|
| 0 | Influencer Name |
| 1 | Platform |
| 2 | Ethnicity |
| 3 | Spend |
| 4 | UTM Link |
| 5 | Date |
| 6 | Live Link |
| 7 | Followers |
| 8 | Likes |
| 9 | UTM Campaign |
| 10 | Views |
| 11 | Comments |
| 12 | Shares |
| 13 | UTM Clicks |
| 14 | Engagement Rate |
| 15 | Enrolments |
| 16 | Paid |
| 17 | Share Rate |

---

## Sheet 7: Creator Roster (Master Influencer List)
**Source:** `1mhntjIuXl1DQnKd3SzlJczsNlqsAd1wWoZ_4hYmMif0`
**GID:** 1892749954 (creator/collaboration tab)
**Other GID:** 896704584 (reference links tab)
**Key columns:** Name, Handle/Profile URL, Status, Ethnicity
**Statuses:** Published, Dropped, Approved for Posting, Script Finalized & Sent, etc.
**Count:** ~87 creators total, ~60 active/published
**Usage:** Metadata enrichment for influencer ads (handle, ethnicity). NOT used for identification — campaign name gate does that.

---

## Sheet 8: Creative Library
**Source:** `1PCIBvtS5xoNUECaaU7ZQJhf6ST96jzlfSvXPX3pOk0o`
**Tabs:**
| GID | Type |
|-----|------|
| 0 | Video |
| 927168945 | Static |
| 58845688 | Testimonial |

---

## Meta API Accounts
| Account ID | Name | Market |
|-----------|------|--------|
| act_925205080936963 | Cuemath - Intel - ROW | ROW (maps to APAC) |
| act_5215842511824318 | Cuemath - US & Canada | US |
| act_888586384639855 | Cuemath-Demand-India | India |

**API Fields:** campaign_name, adset_name, ad_name, spend, impressions, clicks, actions, cost_per_action_type
**Thumbnail fetch:** Separate call to `/ads?fields=name,creative{thumbnail_url,image_url}`
**QL extraction priority:** lead → offsite_conversion.fb_pixel_lead → onsite_conversion.lead_grouped → offsite_conversion.custom.lead → complete_registration → offsite_conversion.fb_pixel_complete_registration

---

## Campaign Naming Convention

**US campaigns:**
`{GEO}_FB_Leads_Conv_{TARGETING}_{AUDIENCE}_{AGE}_{FORMAT}_{LP}_{OBJECTIVE}_{DATE}`
Example: `USA_FB_Leads_Conv_Int_Influencer_Advantage_ShortForm_LP_Signup_060126`

**Influencer identification:**
- Campaign name contains "Influencer" or "Influ" → US influencer campaign
- India: campaign name does NOT contain "Influencer" — uses F-INFLU format tag from tagger
- Ad name also checked for "influencer" or "postboost" keywords

**Creator name in ad name:**
Position: last segment(s) before date suffix (`_DDMMYY`)
Structural token: `_Video_` typically precedes creator name
Examples:
- `..._Video_Priyanshul_060126` → Priyanshul
- `..._Video_Gujarati_Payal_Jethwa_090126` → Gujarati_Payal_Jethwa
- `...Signup-Inhouse-edited-video-Rituja_140126` → Inhouse-edited-video-Rituja

---

## Influencer Ground Truth (from reference sheets, 2026-01-05 to 2026-03-26)

**US paid (45 ad rows):** ₹20.6L spend, 228 QL, 49 TD, 10 Paid
**India paid (19 creators):** ₹33.6L spend, 264 QL, 57 TD, 8 Paid
**Total:** ₹54.2L spend

**US creators confirmed:** Priyanshul, Priyanshul-2, Priyanshul-IG, Keerthi, Ona, Jharna-Gupta, Swetha, Telugu_Swetha, Aveera, Heena, Sarita, Ana, Damla, Damla_Inhouse, Neha-Dhanuka, Gujarati_Mital, Gujarati_Payal_Jethwa, Kaira_Indian_Influencer, Kameshwari, Jia, Pallavi-Agarwal, edited-video-Rituja, edited-video-Ona, Inhouse-Edit-Ana

---

## Sheet 9: PLA Campaign Data (Supplementary CRM + Cost)
**Source:** `1lGAv3K_RFEwcKthjzPiy4x3zlOA010lH_73f46lJ5A8`
**Added:** 2026-04-08

### pla_dump tab (gid=452403394)
**Structure:** Lead-level CRM data for PLA campaigns, ~716 active rows (50K grid but mostly empty)
**Filter:** `Ethnicity_Check === '1'` or `created_on` non-empty
**Key columns:**
| Column | Maps to | Notes |
|--------|---------|-------|
| created_on | lead_created_date | |
| utm_source | (derives medium) | dc_fb_m=meta, dc_sem_m=google |
| utm_medium | (actually ad set name) | NOT the real medium — Cuemath UTM quirk |
| utm_campaign | mx_utm_campaign | Hyphens normalized to underscores |
| utm_content | mx_utm_adcontent | Ad-level attribution (81% filled) |
| ip_region | country_bucket | US-CANADA→US, IND-SUB→India, INDIA-MIDDLE-EAST→MEA, APAC-AUS-NZ→AUS, EUROPE-UK→UK |
| prospectid | prospectid | Dedup key |
| qualified_bucket | qls | Non-empty + not UNQUALIFIED-* = QL |
| trial_done | trials_done | '1' or '0' |
| paid_on | paid_date | Date |
| payments | paid | >0 = paid |
| Auto_ethnicity | ethnicity | "NRI / Non Native English Speaker" = NRI (exact match with isNRIEthnicity) |

### cost tab (gid=33117864)
**Structure:** Daily spend rows, 1,038 rows
**Key columns:** month, day, region, country_segment, landing_type, campaign_name, medium, amount_spent, impressions, link_clicks
**Mediums:** meta (819), google (219) — only meta rows pass Godfather filter
**Landing types:** PLA (892), Eval (146)
**Date range:** 2025-12-04 to 2026-04-06
**Dedup:** By normalized campaign_name + day against existing costData

### Integration
- Fetched via `fetchPLAData(apiKey)` after `fetchSheetData()` at boot
- Appends to global `leadsData[]` and `costData[]` with deduplication
- All downstream functions work unchanged

---

## NEEDS VERIFICATION (Tomorrow)
1. Perf Tracker Daily (gid=827992753) — actual column names and structure
2. CRM column G = utm_medium assumption
3. getCRMPortfolioTotals() column name mapping against actual CRM sheet
4. Whether Oracle KPI numbers match manual Perf Tracker sheet read
5. Whether "Spent" in Meta Ads sheet is truly INR (dashboard shows ₹, user confirmed, but schema said "Dollar spend")
