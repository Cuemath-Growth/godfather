# Assumptions To Verify — Full List
Every assumption made in code that hasn't been manually confirmed against actual data.

## CRITICAL (will cause wrong numbers if wrong)

### A1. CRM column G = utm_medium
**Code:** `select * where G='meta'` (line 2985)
**Assumption:** Column G in the CRM sheet is `utm_medium`
**Risk:** If column order changed or G is a different field, CRM returns zero rows → all TD/NRI/Paid data missing
**How to verify:** Open CRM sheet, check what column G is

### A2. CRM column names match code expectations
**Code references:** `lead_created_date`, `trial_done_date`, `paid_date`, `qls`, `trials_done`, `paid`, `prospectid`, `country_bucket`, `ethnicity`, `mx_utm_adcontent`, `mx_utm_campaign`, `net_booking`
**Assumption:** These exact column headers exist in the CRM sheet
**Risk:** If any column was renamed, that metric is silently zero
**How to verify:** Open CRM sheet, check headers against list above

### A3. Perf Tracker Daily column names
**Code references:** `day`, `medium`, `country_segment`, `region`, `amount_spent`, `impressions`, `link_clicks`
**Assumption:** These exact column headers exist in gid=827992753
**Risk:** If columns are named differently, Oracle KPI spend is zero/wrong
**How to verify:** Open Perf Tracker sheet, tab gid=827992753, check headers

### A4. Spend is INR across all sheets
**Assumption:** Meta Ads sheet "Spent" column is INR. Perf Tracker "amount_spent" is INR.
**Evidence for:** Dashboard shows ₹8.9Cr, user confirmed INR is correct
**Evidence against:** Original data-schemas.md said "Dollar spend"
**How to verify:** Check one known ad's spend in Meta Ads Manager (which shows both USD and INR)

### A5. getCRMPortfolioTotals() field mapping
**Code I wrote blind:** Filters by `qls`, `trials_done`, `paid`, `lead_created_date`, `trial_done_date`, `paid_date`, `country_bucket`, `ethnicity`
**Assumption:** These match the CRM sheet exactly (verified against ONE reference export, not the main sheet)
**Risk:** If the main CRM sheet has different column names than the reference export, all portfolio totals are wrong
**How to verify:** Run `state._crmLeads[0]` in console, check actual field names

### A6. Oracle WoW still uses getOracleMetrics (old pipeline)
**Code:** Lines 4230-4231 call getOracleMetrics for this-week and last-week
**Assumption:** This is intentionally kept on old pipeline
**Reality:** Creates inconsistency — WoW numbers come from Perf Tracker, everything else from tagger
**How to verify:** Decide: should WoW use tagger data too? Or is Perf Tracker more accurate for weekly spend?

---

## HIGH (will cause confusion or wrong comparisons)

### A7. Sentinel thresholds are appropriate
**Values:** US CPQL green < ₹10K, amber < ₹15K. US CPTD green < ₹35K, amber < ₹50K.
**Assumption:** These match current portfolio performance
**Reality:** Portfolio CPTD is ₹41.8K — right at the amber threshold. If portfolio shifted, thresholds need recalibrating.
**How to verify:** Compare thresholds against actual portfolio averages per geo

### A8. Thumbnail matching is case-sensitive
**Code:** `allAds.find(a => a['Ad name'] === ad.name)` (line 2863)
**Assumption:** Meta insights and /ads endpoints return identical casing for ad names
**Risk:** If casing differs, zero thumbnails match (which is what happened)
**How to verify:** Log `ad.name` from /ads and `a['Ad name']` from insights for the same ad

### A9. 1411 vs 2237 creative count discrepancy
**Oracle shows 1411, tagger shows 2237**
**Assumption:** Date filtering explains the difference
**Reality:** getDashboardFilteredData keeps records with no _date field (returns true). So 826 creatives must be outside the date range.
**How to verify:** Run `state.taggerData.filter(c => !c['_date']).length` in console — if this is ~826, date filtering explains it. If not, something else is filtering.

### A10. extractMarket returns consistent values for ROW account
**Code:** `_market === 'ROW'` → falls through to name-based detection → returns 'APAC'
**Assumption:** All ROW ads get detected as 'APAC' via name parsing
**Risk:** If ad name has no geo token, returns 'Unknown'. These get dropped in most geo filters.
**How to verify:** Run `state.taggerData.filter(c => extractMarket(c) === 'Unknown').length` in console

### A11. CRM merge match rate is adequate
**Code:** Direct match at 0.65 threshold, campaign fallback at 0.50
**Assumption:** These thresholds produce ~70-80% match rate
**Reality:** Health panel should show this. If match rate < 60%, creative-layer TDs are unreliable.
**How to verify:** Check health panel match rate after refresh

### A12. TQL formula (US = NRI, others = QL) applied everywhere
**Code:** Oracle, Sentinel, Lens all compute TQL. Influencer now does too (added tonight).
**Assumption:** This is the correct business definition
**Risk:** If the business changed the TQL definition, all tabs show wrong TQL
**How to verify:** Confirm with marketing team: "Is TQL = NRI for US still correct?"

---

## MEDIUM (edge cases that might cause occasional wrong data)

### A13. Date suffix in ad names is always _DDMMYY (6 digits)
**Code:** `adName.replace(/[-_]\d{6}$/, '')`
**Risk:** If some ads use _DDMMYYYY (8 digits) or no date suffix, creator extraction fails
**How to verify:** Run `state.taggerData.map(c => (c['Ad name']||'').match(/[-_]\d+$/)?.[0]).filter(Boolean).slice(0,20)` to see actual suffixes

### A14. India influencer ads always have F-INFLU format tag
**Code:** `_isInfluencerAd` checks campaign name OR F-INFLU tag OR ad name keywords
**Assumption:** India influencer campaigns, which don't say "Influencer" in campaign name, are tagged F-INFLU by the tagger
**Risk:** If the AI tagger didn't tag them as F-INFLU, India influencer data is missing
**How to verify:** Filter tagger data to India market, check how many have F-INFLU tag vs how many have "Influencer" in campaign name

### A15. Creator roster column positions
**Code:** Parses by key names: `row['Name']`, `row['Handle']`, `row['Status']`, `row['Ethnicity']`
**Assumption:** CSV headers in roster sheet match these names
**Risk:** If headers are different (e.g., "Instagram Handle" vs "Handle"), metadata enrichment fails silently
**How to verify:** Run `state._creatorRoster?.[0]` in console, check field names

### A16. Library GIDs are correct
**Values:** gid=0 → Video, gid=927168945 → Static, gid=58845688 → Testimonial
**History:** Was swapped once (CHANGELOG March 27), corrected
**Risk:** If swapped again, all Library cards show wrong format
**How to verify:** Open Library, check if a known video creative shows as "Video"

### A17. Dedup by last 20 chars of ad name
**Code:** Top5/Bottom5 dedup uses `name.slice(-20).toLowerCase()`
**Assumption:** Same creative across different ad sets has identical last 20 chars
**Risk:** If ad names differ by more than the suffix, duplicates appear
**How to verify:** Check Top 5 table for obvious duplicates

### A18. LENS_MIN_CPTD = ₹5K is the right floor
**Code:** CRM false matches sanitized when CPTD < ₹5K
**Assumption:** No real creative can achieve ₹5K CPTD
**Risk:** If India market has legitimately low CPTD (India thresholds show green < ₹3K), this sanitizes real data
**How to verify:** Check India creatives — are any legitimate TDs being zeroed out?

---

## LOW (cosmetic or unlikely to cause issues)

### A19. formatCurrency L/Cr formatting
**Code:** ≥₹1Cr → "₹X.YCr", ≥₹1L → "₹X.YL", ≥₹1K → "₹X.YK"
**Assumption:** Indian numbering system is appropriate for all users
**Risk:** Non-Indian team members might expect M/B formatting
**How to verify:** Ask team preference

### A20. Supabase sync as backup
**Assumption:** Supabase credentials are configured and working
**Risk:** If not, tagger data exists only in localStorage (lost if browser data cleared)
**How to verify:** Check Settings → Supabase fields populated

---

## VERIFICATION COMMANDS (run in browser console on localhost)

```javascript
// A1: Check CRM loaded
console.log('CRM rows:', state._crmLeads?.length, 'First row keys:', state._crmLeads?.[0] ? Object.keys(state._crmLeads[0]).join(', ') : 'EMPTY');

// A3: Check Perf Tracker loaded
console.log('Perf Tracker rows:', state._perfTrackerDaily?.length, 'First row keys:', state._perfTrackerDaily?.[0] ? Object.keys(state._perfTrackerDaily[0]).join(', ') : 'EMPTY');

// A5: Check getCRMPortfolioTotals field names
console.log('CRM sample:', JSON.stringify(state._crmLeads?.[0], null, 2));

// A9: Creative count discrepancy
console.log('No _date:', state.taggerData.filter(c => !c['_date']).length, 'Total:', state.taggerData.length);

// A10: Unknown market count
console.log('Unknown market:', state.taggerData.filter(c => extractMarket(c) === 'Unknown').length);

// A13: Date suffixes in ad names
console.log('Date suffixes:', [...new Set(state.taggerData.map(c => (c['Ad name']||'').match(/[-_]\d+$/)?.[0]).filter(Boolean))].slice(0,20));

// A14: India F-INFLU coverage
const india = state.taggerData.filter(c => extractMarket(c) === 'India');
console.log('India total:', india.length, 'F-INFLU:', india.filter(c => c.tags?.format === 'F-INFLU').length, 'Campaign has Influencer:', india.filter(c => (c['Campaign name']||'').toLowerCase().includes('influencer')).length);

// A15: Creator roster
console.log('Roster sample:', JSON.stringify(state._creatorRoster?.[0], null, 2));

// A18: India CPTD sanitization
const indiaTD = state.taggerData.filter(c => extractMarket(c) === 'India' && parseNumber(c['TD']||0) > 0);
console.log('India with TD:', indiaTD.length, 'Sanitized (CPTD<5K):', indiaTD.filter(c => parseNumber(c['Spent']||0)/parseNumber(c['TD']||1) < 5000).length);
```
