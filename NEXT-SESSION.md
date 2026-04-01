# Godfather — Next Session Spec

## What's Done (16 commits, 2026-04-01)
- Data architecture: getAdPerformanceDaily → getAdPerformance → getPortfolioMetrics
- All views wired to clean data layer (Dashboard, Tagger, Creators, Library, Performance, Insights)
- Boot: parallel load → single render pass
- Pause Now / Make More: cross-exclusion, notes, weekly trends, no false BURNs
- Dead sections removed (CMO, Win/Loss, Market Health/Intelligence)
- Tag migration for intermediate taxonomy
- Funnel bar conversion % fixed
- Library: Settings UI + Sheets API (284 creatives loading)

## Priority 1: Library Redesign (Operational Creative Tracker)

### Purpose
Map creative output → what was generated → what went live → tag identification (manual + auto)
NOT a performance view — that's Tagger/Grid.

### Card Design (simplified)
- Thumbnail (from Notion link via MCP, or Google Drive API, or Meta creatives)
- Creative name + format badge (Video/Static/Testimonial)
- Tags: auto (Lens) + manual (human-editable)
- Deployment status pills (US ✓, India —, etc.)
- Human notes field (text input, saved to Supabase)
- Date added + "NEW" badge for recent additions
- Designer name + week label

### Remove from cards
- Spend, QLs, TDs, CPTD, QL→TD% (move to Tagger Grid view)
- "Best on" audience breakdown
- "Lens matched" badge

### Features
1. Notion MCP integration for thumbnails (user has Notion MCP connected)
2. Google Drive API for drive link thumbnails
3. Auto-tagging via Lens (same prompt as Tagger)
4. Human notes per card → Supabase `library_notes` table
5. Date picker for sorting/filtering
6. Recent first (default sort)
7. Auto-sync: poll sheet for new rows, surface with "NEW" badge
8. Manual tag override (click tag to edit)

### Sheet URL
`https://docs.google.com/spreadsheets/d/1PCIBvtS5xoNUECaaU7ZQJhf6ST96jzlfSvXPX3pOk0o`
Tabs: 0:Static, 58845688:Testimonial, 927168945:Video
Config saved in localStorage `gf_libraryConfig`

## Priority 2: Remaining Items
- [ ] Tagger Lens prompt update (user shared new taxonomy in this session — search chat for "You are Lens")
- [ ] Data Explorer view (daily table like Ads Manager)
- [ ] Kill localStorage for data completely (Supabase-only)
- [ ] Thumbnail coverage improvement (51% → higher)
- [ ] Re-run Meta backfill with actions field

## Key Architecture Notes
- Single data flow: Meta API → getAdPerformanceDaily → getAdPerformance → getPortfolioMetrics
- CRM↔Meta match rate: 98.4% of matchable ads (exact name + utm_term alias)
- 1,732 Meta ads genuinely have 0 CRM leads (brand/slotbook/awareness)
- India runs slotbook campaigns — no CRM leads by design
- Supabase 404 on oracle_actions table — needs investigation
- localStorage at 4.44MB limit — data caching fragile
