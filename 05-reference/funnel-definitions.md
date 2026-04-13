# Funnel Definitions — Cuemath

## The Full Funnel (from live US Performance Tracker)

```
Impression → Click → QL (Sign-up) → Email → NRI (Valid Lead) → Trial Scheduled → Trial Done → Enrolled (Paid)
```

With quality gates at each stage:

```
QL stage:  Invalids filtered out, Auto Slots tracked
NRI stage: NRI Invalids filtered, Unique Parents deduplicated
TD stage:  TS→TD% (show-up rate) measured
Paid stage: T2P% (trial-to-paid), Revenue, ROAS, CAC measured
```

| Stage | Abbreviation | Definition | Who Owns It |
|---|---|---|---|
| **Impression** | Imp | Ad shown to user | Performance Marketing |
| **Click** | Click | User clicks ad | Performance Marketing |
| **Qualified Lead** | QL | User signs up / creates account | Performance Marketing |
| **Email** | Email | QL with valid email captured | Performance Marketing |
| **Invalids** | Inv | Leads flagged as invalid (spam, duplicate, etc.) | Performance Marketing |
| **Auto Slots** | Auto Slots | Automated slot bookings from QL | Performance Marketing |
| **NRI (Valid Lead)** | NRI | Non-Resident Indian — validated lead enters nurture pipeline | Marketing + Sales |
| **NRI Invalids** | NRI Inv | Invalid leads filtered at NRI stage | Sales |
| **Unique Parents** | UP | Deduplicated parent count | Sales |
| **Trial Scheduled** | TS | Free trial class booked | Sales |
| **Trial Done** | TD | Free trial class attended | Sales + Product |
| **Enrolled** | Enrolled / Paid | First payment — enrolled student | Sales |

> **Note:** The tracker does NOT include an "MRI" (Marketing Ready Interest) stage in the current US funnel. The vault previously referenced MRI — this has been corrected. If MRI is added to the tracker in future, update this doc.

---

## Key Ratios

| Ratio | Formula | What It Tells You |
|---|---|---|
| **CPI** | Spend / Impressions | Cost efficiency of reach |
| **CPC** | Spend / Clicks | Ad creative quality / relevance |
| **CPQL** | Spend / QL | Top-of-funnel efficiency |
| **Invalid %** | Invalids / QL | Lead quality at signup — high = targeting issue |
| **Auto Slot %** | Auto Slots / QL | Automated booking rate |
| **QL-NRI%** | NRI / QL | Lead validity — are QLs real, contactable parents? |
| **CPNRI** | Spend / NRI | Mid-funnel cost per valid lead |
| **NRI Invalid %** | NRI Inv / NRI | Lead quality at nurture stage |
| **QL-TS%** | TS / QL | Scheduling intent |
| **TS-TD%** | TD / TS | Show-up rate (booked → attended) |
| **QL-TD%** | TD / QL | **Most important lead quality signal** — full funnel |
| **CPTD** | Spend / TD | **Most important cost metric** — cost per trial attended |
| **T2P%** | Enrolled / TD | Sales conversion |
| **QL-P%** | Enrolled / QL | Full funnel conversion rate |
| **ROAS** | Revenue / Spend | Return on ad spend |
| **CAC** | Spend / Enrolled | Customer acquisition cost |

---

## Performance Thresholds by Geography

### US Market (from live tracker benchmarks — Feb 2026)
| Metric | Green (Good) | Amber (Okay) | Red (Bad) |
|---|---|---|---|
| CPQL | < $10,000 | $10k–$15k | > $15,000 |
| CPNRI | < $15,000 | $15k–$25k | > $25,000 |
| CPTD | < $50,000 | $50k–$75k | > $75,000 |
| QL→TD% | > 25% | 15%–25% | < 15% |
| QL→NRI% | > 50% | 30%–50% | < 30% |
| TS→TD% | > 75% | 60%–75% | < 60% |
| T2P% | > 30% | 20%–30% | < 20% |
| ROAS | > 1.0 | 0.5–1.0 | < 0.5 |
| Invalid % | < 5% | 5%–10% | > 10% |

> **Reference points from Feb tracker totals:** CPQL ~$9,884 | CPNRI ~$16,739 | QL-TD% ~27% | TS-TD% ~80% | T2P% ~33% | ROAS ~0.9

### India Market
| Metric | Green (Good) | Amber (Okay) | Red (Bad) |
|---|---|---|---|
| CPQL | < ₹500 | ₹500–₹800 | > ₹800 |
| CPNRI | < ₹800 | ₹800–₹1,200 | > ₹1,200 |
| CPTD | < ₹3,000 | ₹3k–₹5k | > ₹5,000 |

### Australia Market
| Metric | Green (Good) | Amber (Okay) | Red (Bad) |
|---|---|---|---|
| CPQL | < ₹10,000 | ₹10k–₹15k | > ₹15,000 |
| CPTD | < ₹30,000 | ₹30k–₹45k | > ₹45,000 |
| QL→TD% | > 35% | 25%–35% | < 25% |

### MEA Market
| Metric | Green (Good) | Amber (Okay) | Red (Bad) |
|---|---|---|---|
| CPQL | < ₹8,000 | ₹8k–₹10k | > ₹10,000 |
| CPTD | < ₹25,000 | ₹25k–₹35k | > ₹35,000 |
| QL→TD% | > 35% | 25%–35% | < 25% |

---

## Tracker Dimensions (Filter Structure)

The performance tracker allows slicing data by:

| Dimension | US Values |
|---|---|
| **Ethnicity** | NRI, Non NRI, Asian (Chinese, Korean, Vietnamese, Japanese, Others), African-American, Hispanic, Others |
| **Grade** | KG, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 |
| **Platform** | Google (Brand, Generic, PMax, DG, Competitor, etc.), Meta (PayU, LAL, Advantage+, Expats, Telugu, Remarketing, etc.) |
| **Date Range** | From / To date filters |
