# Godfather Decision Log

Every design decision with FULL specificity. Read this BEFORE building anything.

---

## Create Tab (Apr 5, 2026)

### ICP TYPE → Audience pills
- **Decision:** Remove "ICP Type" pills (NRI/Non-NRI/Universal/HighSchool). Replace with "Audience" pills using `campaign_audience` taxonomy values.
- **Values:** NRI, Broad/Advantage+, PLA, Influencer, Vernacular, Retargeting, General
- **Source:** GODFATHER_TAXONOMY.fields.campaign_audience.values
- **Why:** Content team thinks in targeting terms ("PLA audience", "NRI targeting"), not behavioral segments ("East Asian Parents").

### Segment → Targeting dropdown
- **Decision:** Remove behavioral segment dropdown (Foundation Rebuilder, Personalization Seeker, etc.). Replace with actual Meta ad set targeting names parsed from ALL market campaign names.
- **Values pulled from Perf Tracker Daily (gid=827992753) across ALL 3 Meta accounts:**
  - **Lookalike:** LAL Enrolled, LAL PayU, LAL QL 0-2%, PayU Lookalike
  - **Interest-Based:** Indian Interests, Int Parenting, Int 4C, Engaged Shoppers, Job Titles, Premium Parents + Income
  - **Audience:** Expats, India Expats, HNI, Parents All, Bollywood/Cultural, TV Channels, School Targeting
  - **Geo-Based (India):** Metro Tier 1, South Cities, Pincodes IB/IGCSE, City Targeting (BLR/HYD), Locations
  - **Broad & Retargeting:** Advantage+, Broad, Remarketing, Vernacular
- **Why:** Content team creates copy FOR specific targeting setups. "What works for LAL PayU audience" is the real question, not "what works for Foundation Rebuilders."
- **Scope:** ALL markets — US/CAN, India, AUS/ANZ, NZ, SG, UK, MEA. Never US-only.

### Haiku AI generation
- **Decision:** Create tab uses Claude Haiku (claude-haiku-4-5-20251001) for generation. Overrides old "zero API credits" rule.
- **PIN-locked:** 3 content team members. PIN stored in Supabase `godfather_config` table (key: `create_pin`).
- **Fallback:** Template generation when PIN denied or API fails.
- **Model badge:** "Haiku" in teal (was "Sonnet" in purple).

### Brand safety
- **Decision:** Post-generation banned phrase check on Create output. NOT YET IMPLEMENTED.

---

## Taxonomy (Apr 5, 2026)

### 14-field unified taxonomy
- GODFATHER_TAXONOMY is single source of truth
- 13 AI-tagged fields + 1 parsed (campaign_audience from campaign name)
- campaign_audience replaces ICP — parsed, not AI-tagged
- emotional_tone has lower weight — too subjective, never primary grouping
- Testimonial is FORMAT (content_format), not hook
- Composite PK: (ad_name, account)

### Tag systems killed
- TAG_CATEGORIES, TAG_OPTIONS, TAG_DIMS all deleted
- tagged_creatives, tag_cache, gf_tagCache replaced by creative_tags Supabase
- Tagger prompt auto-generates from taxonomy

---

## Tab Roles (Apr 5, 2026)

### Library = asset tracker ONLY
- No performance data (most cards would be blank)
- Grid stays in Lens for individual ad performance

### Lens landing = Winning/Losing Patterns
- Audience-segmented combos with action buttons
- NOT heatmap
- 3 default combo pairs: hook x pain_benefit, hook x campaign_audience, content_format x production_style
- Adaptive minimums per market tier

### Oracle landing = WoW digest
- "This week vs last week" summary on dashboard open
- No email, just show on open

### Creators tab
- Uses talent_name from tags, NOT _isInfluencerAd() campaign name gate

---

## Cost & Access (Apr 5, 2026)

### PIN system
- Create tab: PIN-locked for 3 content team members
- Tagger: PIN-locked to prevent accidental credit spend
- PIN stored in Supabase godfather_config table, NOT localStorage
- Session-level unlock (one entry per page load)

---

## Combos & Thresholds (Apr 5, 2026)

- US/India: min 3 creatives, 5 TDs, ₹50K spend
- AUS/APAC: min 2 creatives, 3 TDs, ₹25K spend
- MEA/UK: min 2 creatives, 2 TDs, ₹15K spend
- Default Lens view segments by audience — never mix NRI and Broad patterns
