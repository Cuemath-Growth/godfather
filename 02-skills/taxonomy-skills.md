# Taxonomy Skills — Tagging/Taxonomy + Meta API

> **Purpose:** Codify the 14-field creative taxonomy, AI tagging pipeline, and Meta API integration patterns. The single reference for anyone building tagging features or touching Meta data.
> **Created:** April 16, 2026 | **Source:** GODFATHER_TAXONOMY constant + tagger prompt auto-generation + Meta API patterns in index.html

---

## SHARED DATA BLOCKS

### GODFATHER_TAXONOMY — Complete Specification

**Source of truth:** `const GODFATHER_TAXONOMY` in index.html (search: `GODFATHER TAXONOMY`). This markdown copy is for human reference — the code constant is authoritative.

**14 fields total:** 13 AI-tagged + 1 parsed from campaign name.

#### Strategy Tags (what the ad SAYS)

| Field | Label | Type | Values |
|-------|-------|------|--------|
| `hook` | Hook | AI | Outcome First, Problem/Pain, Question, Social Proof, Fear/Urgency, Curiosity, Recommendation, Offer/Price, Authority, Feature-Driven |
| `pain_benefit` | Benefit | AI | Confidence, Grades & School, Tutor Quality, Personalization, Thinking vs Calculating, Fun & Engagement, Competition Prep, Foundation Building, Parent Peace of Mind |
| `emotional_tone` | Tone | AI (low weight) | Confident, Aspirational, Empathetic, Urgent, Warm, Playful, Authoritative, Inspirational |

#### Creative Tags (how it LOOKS/SOUNDS)

| Field | Label | Type | Values |
|-------|-------|------|--------|
| `content_format` | Format | AI | Testimonial, Talking Head, Product Demo, Tutorial, Comparison, Skit/Story, Graphic Explainer, Slideshow |
| `talent_type` | Talent | AI | Parent, Tutor, Child, Influencer, Voiceover Only, None |
| `talent_name` | Creator | AI (free text) | Any person name or "None" |
| `production_style` | Production | AI | UGC, Studio, Animated, AI Generated, Static Graphic, Screen Recording |
| `creative_type` | Type | AI | Static, Video |
| `language` | Language | AI | English, Hindi, Telugu, Tamil, Gujarati, Malayalam, Other |

#### Tactical Tags (what it OFFERS)

| Field | Label | Type | Values |
|-------|-------|------|--------|
| `offer_present` | Offer | AI | Yes, No |
| `cta_type` | CTA | AI | Book Free Trial, Learn More, Sign Up, Download App, Watch Video, Other |

#### Vision Tags (what's ON SCREEN — Segwise-level)

| Field | Label | Type | Values |
|-------|-------|------|--------|
| `headline_theme` | Headline | AI | Building Foundations, Expert Tutors, Personalized Learning, Math Competition, Promotional Offer, Student Outcomes, Social Proof, Fun & Engagement, Parent Peace of Mind, Other |
| `visual_style` | Visual | AI | Abstract/Geometric, Home/Study, Classroom, Photo Collage, Text-Heavy, Character/Illustration, Real Person, Whiteboard, Other |

#### Parsed Tag (from campaign name — NOT AI-tagged)

| Field | Label | Type | Values |
|-------|-------|------|--------|
| `campaign_audience` | Audience | Parsed | 30 values: `{Audience} ({Flow})` where Audience = Influencer/Vernacular/NRI/Chinese/K-2/K-8/High School/Creative Testing/Lookalike/HNI/Retargeting/Interest/Broad/Geo/General/Eval, Flow = BAU/PLA |

**Parser priority order:** Influencer > Vernacular > NRI > Chinese > K-2 > K-8 > High School > Creative Testing > Lookalike > HNI > Retargeting > Interest > Broad > Geo > General

### Confidence Levels

| Level | Source | Reliability | When Used |
|-------|--------|------------|-----------|
| `confirmed` | GPT-4o-mini saw creative image (base64) | High — visual analysis | Image URL available and fetchable |
| `inferred` | Ad name + primary text + headline only | Medium — text inference | Image URL missing or 403 (stale token) |
| `hypothesis` | Ad name pattern match only | Low — naming convention | No copy, no image — name-only context |

**Confidence stored in:** `tags.confidence` field on each creative. Used by `_confBadge` in UI to show vision icon vs text icon.

### Meta API Endpoints

| Endpoint | Purpose | Fields Requested | Frequency |
|----------|---------|-----------------|-----------|
| `/{account_id}/insights` | Daily spend, impressions, clicks, actions per ad | `campaign_name, adset_name, ad_name, ad_id, spend, impressions, clicks, actions, cost_per_action_type` with `time_increment=1` | Incremental sync (24h gate) |
| `/{account_id}/ads` | Creative assets (thumbnails, images) | `name, creative{thumbnail_url, image_url}` | On demand (Fetch Thumbnails button) |
| `/{ad_id}` | Single ad creative fetch (fallback) | `creative{thumbnail_url, image_url}` | When tagger needs image for specific ad |

**QL Extraction Priority Chain:**
```
lead → offsite_conversion.fb_pixel_lead → onsite_conversion.lead_grouped 
→ offsite_conversion.custom.lead → complete_registration 
→ offsite_conversion.fb_pixel_complete_registration
```
First non-zero value wins.

**Rate limits:** ~200 calls/hour/token. Batch 50 ads per insights call. Pagination cursor-based.

**Incremental sync:** `fetchMetaAdInsights` checks last sync timestamp. Skips if <24h ago unless `force=true`. Upserts into Supabase `meta_ad_data` in batches of 500.

### Account Registry

| Account ID | Name | Market | Expected Rows |
|-----------|------|--------|--------------|
| `act_925205080936963` | Cuemath - Intel - ROW | ROW → maps to APAC | ~8K |
| `act_5215842511824318` | Cuemath - US & Canada | US | ~18K |
| `act_888586384639855` | Cuemath-Demand-India | India | ~6K |

---

## SKILL 3: TAGGING / TAXONOMY

### Role

You are Lens — Cuemath's taxonomy guardian. You own the 14-field creative taxonomy specification, the AI tagging pipeline (GPT-4o-mini for vision, Haiku for generation), and the quality checks that ensure tag consistency.

When someone adds a new tag value, changes the taxonomy, or debugs a tagging issue, you are the authority.

### Output Format

#### Taxonomy Verification Report

**VERDICT:** [Taxonomy healthy / drift detected / quality degraded]

---

**SECTION 1: Field-by-Field Validation**
| Field | Total Tagged | Unknown Rate | New Values | Status |
|-------|-------------|-------------|-----------|--------|
| hook | [N] | [X]% | [list] | [G/A/R] |
| ... | | | | |

**SECTION 2: Cross-Field Consistency**
Per [[02-skills/segwise-intelligence-skills#Correlation-Rules|C-04 through C-11]]:
- C-04: Testimonial format → must have talent_name ≠ None
- C-05: UGC production → must have talent_type ∈ {Parent, Tutor, Child, Influencer}
- [check each rule]

**SECTION 3: campaign_audience Parser Coverage**
| Audience | Count | % of Total | Sample Campaign |
|----------|-------|-----------|----------------|
| ... | | | |
| General (fallback) | [N] | [X]% — should be <10% | |

**SECTION 4: Prompt Template Verification**
- Auto-generated from GODFATHER_TAXONOMY: [Y/N]
- All 13 AI fields present in prompt: [Y/N]
- Free-text fields handled correctly: [Y/N]

---

### Analysis Framework

#### Step 1: Check Unknown Rates
```js
// In browser console:
const tags = state.taggerData.filter(c => c.tags);
GODFATHER_TAXONOMY.aiFields.forEach(f => {
  const unknown = tags.filter(c => !c.tags[f] || c.tags[f] === 'Unknown').length;
  console.log(`${f}: ${unknown}/${tags.length} = ${(unknown/tags.length*100).toFixed(0)}% unknown`);
});
```
**Red flag:** Any field > 30% unknown → prompt not extracting correctly or images missing.

#### Step 2: Check for New Values
```js
GODFATHER_TAXONOMY.aiFields.forEach(f => {
  const allowed = new Set(GODFATHER_TAXONOMY.getValues(f));
  if (!allowed.size) return; // free text field
  const novel = new Set();
  tags.forEach(c => { const v = c.tags?.[f]; if (v && !allowed.has(v) && v !== 'Unknown') novel.add(v); });
  if (novel.size) console.log(`${f}: NEW values not in enum:`, [...novel]);
});
```
**Action:** New values → either add to GODFATHER_TAXONOMY.values or map them to existing values in the prompt.

#### Step 3: Verify Parser Coverage
```js
const audiences = {};
state.taggerData.forEach(c => {
  const aud = c.tags?.campaign_audience || 'Untagged';
  audiences[aud] = (audiences[aud] || 0) + 1;
});
console.table(Object.entries(audiences).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({audience: k, count: v, pct: (v/state.taggerData.length*100).toFixed(1)+'%'})));
```
**Red flag:** General (BAU) > 10% → campaigns not being parsed. Check for new naming patterns.

#### Step 4: Cross-Field Audit
Spot-check 5 random creatives: does `content_format: Testimonial` always have a `talent_name`? Does `production_style: UGC` always have a person in `talent_type`?

### Tagger Prompt — Auto-Generated

The prompt is built by `buildTaggerSystemPrompt()` (search: `function buildTaggerSystemPrompt`). It reads `GODFATHER_TAXONOMY.aiFields` and auto-generates the JSON schema.

**Output structure sent to Claude Haiku:**
```json
{
  "hook": "Outcome First | Problem/Pain | Question | ...",
  "pain_benefit": "Confidence | Grades & School | ...",
  "content_format": "Testimonial | Talking Head | ...",
  "talent_type": "Parent | Tutor | Child | ...",
  "talent_name": "Specific person name or None",
  ...
}
```

**Rules baked into prompt:**
1. `content_format` is narrative structure, NOT the hook (a testimonial can use any hook)
2. `hook` is the opening attention-grabber in the first line of copy
3. `talent_name` is free text
4. If image unavailable, use copy + ad name for best-effort inference

**Message construction** (`buildTaggerMessage`):
1. Image FIRST (base64 if available — vision model needs it upfront)
2. Copy SECOND (headline + primary text + description)
3. Ad name LAST (context only — "do not anchor on this")

### Known Tagging Failure Modes

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| All tags "Unknown" | Image fetch failed (403 from fbcdn.net) → model has no visual context | Run "Fetch Thumbnails" to refresh URLs, then re-tag |
| Testimonial classified as every hook | Model anchors on ad name containing "Testimonial" | Prompt says "content_format is NOT the hook" — but model sometimes ignores |
| talent_name = "None" on talking head videos | Model can't read name from image alone | Requires ad name or primary text to contain creator name |
| campaign_audience = "General" flood | New campaign naming pattern not in parser | Add keyword to `campaign_audience.parse()` priority list |
| emotional_tone unreliable | Too subjective — the same ad gets different tones across re-tags | `weight: 'low'` — never use as primary grouping dimension |

### When Reporting

Always reference GODFATHER_TAXONOMY by field name, not by label. The field name is the code key (`hook`, `pain_benefit`). The label is display-only (`Hook`, `Benefit`).

---

## SKILL 4: META API

### Role

You are the Meta API specialist for Godfather. You know which 3 accounts we use, which endpoints we hit, how pagination works, how thumbnails are fetched, and what the rate limits are.

Godfather is Meta-only. No Google, no TikTok, no Bing data flows through the dashboard.

### Output Format

#### API Health Check

**VERDICT:** [All accounts responding / partial failure / stale data]

---

**SECTION 1: Account Status**
| Account | Market | Last Sync | Rows | Status |
|---------|--------|-----------|------|--------|
| US & Canada | US | [date] | [N] | [G/A/R] |
| Intel - ROW | APAC | [date] | [N] | [G/A/R] |
| Demand - India | India | [date] | [N] | [G/A/R] |

**SECTION 2: Data Completeness**
- metaAdData rows: [N] (expect 30K+)
- Thumbnail coverage: [N]% of ads have image_url
- QL extraction: [N] ads with lead actions

**SECTION 3: Sync Freshness**
- Last incremental sync: [timestamp]
- Days since last sync: [N]
- Rows added in last sync: [N]

---

### Analysis Framework

#### Step 1: Check metaAdData Volume
```js
console.log('metaAdData:', metaAdData.length, 'rows');
// By account
const byAcct = {};
metaAdData.forEach(r => { byAcct[r._account || 'unknown'] = (byAcct[r._account || 'unknown'] || 0) + 1; });
console.table(byAcct);
```
**Red flag:** Any account with 0 rows → API token expired or account paused.

#### Step 2: Check Thumbnail Coverage
```js
const withThumb = metaAdData.filter(r => r.thumbnail_url || r.image_url).length;
console.log(`Thumbnails: ${withThumb}/${metaAdData.length} = ${(withThumb/metaAdData.length*100).toFixed(0)}%`);
```
**Red flag:** < 50% → run "Fetch Thumbnails" in Settings. fbcdn.net URLs expire.

#### Step 3: Verify _isLPCampaign Logic
The `_isLPCampaign` function determines which ads can have CRM data:
- Returns `true` for LP campaigns (signup, _lp_, _fop_, lpfop in campaign/ad name)
- Returns `true` for PLA/Eval campaigns
- Returns `false` for LeadGen/Leap/instant/on_facebook campaigns
- Default: `false` (no LP signal = assume instant form)

After the Apr 16 UTM fix, non-LP campaigns with `hasCRM=true` keep their CRM data. Only non-LP with `hasCRM=false` get CRM zeroed.

```js
// Check how many ads are LP vs non-LP
const ads = getAdPerformance('US');
const lp = ads.filter(a => _isLPCampaign({campaign: a['Campaign name'], adName: a['Ad name']}));
const nonLP = ads.filter(a => !_isLPCampaign({campaign: a['Campaign name'], adName: a['Ad name']}));
const nonLPmatched = nonLP.filter(a => a._hasCRM);
console.log(`LP: ${lp.length}, Non-LP: ${nonLP.length} (${nonLPmatched.length} with CRM match)`);
```

### When Reporting

Always distinguish between:
- **metaAdData** — Supabase cache of Meta API insights (daily spend per ad). Source of truth for spend.
- **metaCreatives** — Meta API creative objects (thumbnails, images). Source of truth for visuals.
- **costData** — Google Sheets cost tab (daily spend per campaign). Used for Dashboard KPIs.

These three can disagree on spend. costData is authoritative for portfolio totals (per [[02-skills/engineering-skills#AP-04|AP-04]]).
