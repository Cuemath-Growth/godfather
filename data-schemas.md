# Godfather Data Schemas

## Sheet 1: Regional Performance Tracker
**Source:** https://docs.google.com/spreadsheets/d/1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs/
**GID:** 1622533630

**Structure:** Monthly time periods (paired as actual/target), rows by geo
**Geos:** US, APAC, ME, UK
**Metrics:** Spend, NRI QL, CPNRI, CPQL, Revenue, ROAS

---

## Sheet 2: Meta Ads Creative Performance
**Source:** https://docs.google.com/spreadsheets/d/11q8zU3mRa1RzD8WSjanRVAzXBXXoiFsZNXo_R4OwbKk/
**GID:** 1805066969

**Columns (27):**
| Column | Type | Description |
|--------|------|-------------|
| Campaign name | Text | Campaign identifier |
| Ad set name | Text | Ad set identifier |
| Ad name | Text | Ad identifier |
| Creative type | Text | "Video" or "Static" |
| Creative name | Text | Creative identifier |
| QL | Integer | Qualified Leads |
| NRI | Integer | NRI conversions |
| TS | Integer | Trial Signups |
| TD | Integer | Trial Demos |
| Paid | Integer | Paid conversions |
| Spent | Integer | Dollar spend |
| CPQL | Decimal | Cost Per Qualified Lead |
| CPNRI | Decimal | Cost Per NRI |
| QL-TS% | Percentage | QL to Trial Signup rate |
| TS-TD% | Percentage | Trial Signup to Trial Demo rate |
| QL-TD% | Percentage | QL to Trial Demo rate |
| T-P% | Percentage | Trial to Paid rate |
| CPTD | Decimal | Cost Per Trial Demo |
| CAC | Integer | Customer Acquisition Cost |

**Scale:** ~687 total QLs, ~$8.35M total spend across campaigns

## Funnel Order
Lead → Qualified Lead (CPQL) → NRI Filter (CPNRI) → Trial Signup → Trial Done (CPTD) → Paid (CAC)
