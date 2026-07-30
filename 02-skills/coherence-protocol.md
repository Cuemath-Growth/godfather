# Coherence Protocol — the ad ↔ LP ↔ nurture bridge

The spine that makes the format manuals compound. Without this, each format manual enforces its own rules but the surfaces don't talk to each other — the parent gets one promise from the ad, a different promise from the LP, a third tone from the email. Coherence is the gear that converts brand discipline into CPTD reduction.

KPI: every campaign delivers ONE promise, in ONE vocabulary, with ONE proof anchor, ending at ONE CTA, across every surface the parent encounters.

---

## When to invoke

Always, before any format-skill work begins. Two trigger conditions:

1. **Starting work on a surface in an active campaign** — opens the coherence brief for that campaign (or creates one if missing).
2. **Editing a surface in an active campaign** — flags adjacent-surface impact: which other surfaces need to update because of this change.

Single-surface work outside any campaign (e.g. a one-off brand reel) skips the protocol. But almost all performance work is campaign work.

---

## What this protocol does

1. **Resolves the cell.** Market + sub-ICP + grade band + season + funnel stage. The full coordinate before drafting starts.
2. **Surfaces the promise.** One sentence that every surface in this campaign must reinforce. The promise that survived the test.
3. **Locks the vocabulary.** The specific words that must stay consistent across ad → LP → email → WhatsApp.
4. **Locks the proof anchor.** The same testimonial, the same outcome, the same Trustpilot quote referenced across surfaces (so the parent recognises it).
5. **Locks the CTA.** Every surface ends at the same next step.
6. **Tracks adjacent-surface state.** Records every active surface for this campaign in the campaign registry.
7. **Flags the adjacent-surface delta.** When you change one surface, the protocol surfaces what must change elsewhere.

---

## The campaign brief — fill before any drafting

Every campaign has a coherence brief in `~/Documents/CM Brain /godfather/campaigns/{campaign-id}.md`. One file per active campaign. Greppable, version-controlled.

Template:

```yaml
---
campaign_id: [e.g. UK-11plus-Y5Y6-prep-2026Q3]
status: [draft / active / paused / shipped / retired]
opened: [YYYY-MM-DD]
last_edit: [YYYY-MM-DD]
---

# [Campaign name — human-readable]

## Cell
Market: [IN / US / UK / AU / MEA]
Sub-ICP: [from per-market voice canon — e.g. Settled UK Asian-origin Y5-Y6]
Grade band: [K-2 / 3-5 / 6-7 / 8-12 / Y5-Y6 / etc.]
Season: [from per-market seasonal map — e.g. UK 11+ pre-window Jul-Aug + in-window Sep-Oct]
Funnel stage: [TOFU / MOFU / BOFU]

## The promise (one sentence)
[The thing every surface confirms. Survives the read-aloud + sister test.]
e.g. "Not an 11+ specialist. A Year 3-to-Y8 coach whose Year 5-6 work happens to include 11+ prep."

## Vocabulary lock
[Specific words / phrases that must stay consistent across all surfaces in this campaign]
- 
- 
- 

## Proof anchor (same one across surfaces)
- Trustpilot quote referenced: [verbatim + reviewer first name + flag]
- Or: named outcome (kid + result): [verifiable from Godfather or LP outcome bank]
- Or: tenure / memory framing: [specific phrasing]

## CTA across all surfaces
- Ad: "[exact wording]"
- LP: "[exact wording]"
- Email: "[exact wording]"
- WhatsApp: "[exact wording]"
[Must match. If they don't, fix.]

## Banned for this campaign
[Surface-specific or campaign-specific bans beyond the universal locks]
- 

## Surfaces in this campaign

### Google RSA
- Status: [draft / live / paused]
- Ad group(s): [e.g. uk-11plus-grammar-school-search]
- Last edit: [date]
- File / link: [Google Ads URL or local draft path]
- H2 leads across RSAs: [list the differentiating H2s]

### Meta paid (static + reel)
- Static IDs: [list]
- Reel IDs: [list]
- Audience cells targeted: [list]
- Status per asset: [live / paused / retired]

### LP
- LP-ID: [from Notion LP Content Library DB]
- Production host: [class.cuemath.com/perf or leap.cuemath.com]
- 8-segment slug: [from [[reference_lp_slug_structure]]]
- URL: [production URL]
- Last edit: [date + commit if applicable]
- Hero copy: [verbatim — the thing the ad must echo]

### Influencer / UGC
- Creator briefs / scripts: [list with creator names]
- Voice canons applied: [per creator]

### Email / nurture
- Sequence ID / file path: []
- Steps: [pre-trial 1, 2, 3, post-trial 1, 2, etc.]

### WhatsApp
- Templates used: [list]

## Adjacent-surface deltas (pending changes)
[When one surface changes, what else needs to update — recorded here]
- 

## CPTD benchmarks (from Godfather)
- Cell-weighted CPTD amber threshold:
- Current performance: 
- Hook profile of current winner in this cell:
- Tag profile to beat or match:

## Coherence audit log
- [date] — [what was checked / what was changed]
- 
```

---

## The cell resolution — first move on any new work

Before writing a single line of copy, fill this:

```
Resolving the cell — [YYYY-MM-DD]
==============================
Market: [IN / US / UK / AU / MEA]
Sub-ICP within market: [from voice canon options]
Grade band: [specific]
Seasonal window: [primary + secondary if active]
Funnel stage: [TOFU / MOFU / BOFU]
Surface being written: [format from format-manuals]

Other surfaces in this campaign: [list, with status]
Banned-for-this-cell vocabulary: [pull from market overrides + voice canon]
CPTD benchmark to beat: [pull from Godfather]
Voice canon(s) applied: [from voice-canons/ — could be 2 for AU, 3 for US]
```

If any field is `?` — stop and resolve before writing. The most common drafting failure is starting before the cell is resolved.

---

## The adjacent-surface delta — when you change one thing

Every edit to a surface in an active campaign triggers a delta check:

```
You just changed: [surface + what changed]
Campaign: [campaign-id]

Adjacent surfaces that may need to update because of this change:
[ ] LP fold-1 — does hero still echo the ad promise within 5 seconds?
[ ] Other ads in this campaign — does the promise still match?
[ ] Email-1 subject + body — does it pick up the same vocabulary?
[ ] WhatsApp welcome message — does the named tutor / outcome match?
[ ] Influencer scripts in this campaign — does the promise survive their voice?

For each adjacent surface that needs to update, queue a task and reference back to this campaign-id.
```

Brand Manager owns reconciliation when these flag.

---

## Surface-state tracking — the campaign registry

Each campaign brief is one file under `~/Documents/CM Brain /godfather/campaigns/`. The directory IS the registry.

To list all active campaigns:
```bash
grep -l "status: active" ~/Documents/CM Brain /godfather/campaigns/*.md
```

To find which campaign a specific LP belongs to:
```bash
grep -l "LP-ID: [the-lp-id]" ~/Documents/CM Brain /godfather/campaigns/*.md
```

To audit coherence across a campaign:
```bash
cat ~/Documents/CM Brain /godfather/campaigns/{campaign-id}.md
```

Light, greppable, version-controlled. No tooling.

---

## Output: the coherence block embedded in every output

Every format-skill output ends with a coherence block, before the asset itself ships. This is what makes coherence visible.

```
COHERENCE BLOCK — [YYYY-MM-DD]
Campaign: [campaign-id]
Surface: [format]

Cell resolved: ✓
Promise echoed from upstream surface: ✓ / ✗ (if ✗, explain)
Vocabulary lock applied: ✓
Proof anchor matches campaign: ✓
CTA matches campaign: ✓
Adjacent-surface impact flagged: [list]

This output ships when Brand Manager approves the coherence check.
```

---

## Failure modes when coherence is skipped

1. **Ad promises X, LP confirms Y.** Parent clicks 11+ ad expecting "school maths + 11+", LP says "11+ specialist tutor." Message-match broken in 5 seconds. Bounce. CPL wasted.
2. **Same campaign, different vocabulary across surfaces.** Ad says "longitudinal coach," LP says "your dedicated tutor," email says "Cuemath mentor." Parent doesn't recognise the same offering.
3. **Different proof anchors across surfaces.** Ad cites one Trustpilot quote, LP shows different reviews, email mentions a third outcome. No reinforcement, no compounding.
4. **CTA drift.** RSA says "Book Free Trial," LP says "Get Started," email says "Confirm your slot," WhatsApp says "Reply YES." Same intent, four phrasings — feels disjointed.
5. **Adjacent surfaces frozen in time.** RSA gets a fresh H2 lead about "Y3-Y8 coach"; LP still has "11+ prep specialist" hero from 3 months ago. Delta not flagged, delta not actioned.
6. **Wrong production host for the LP.** RSA Final URL points to `class.cuemath.com/perf/...` but the LP exists at `leap.cuemath.com/...`. Per [[reference_lp_host_mapping]] — different hosts, must match.
7. **Cross-market borrowing.** Campaign for UK 11+ has Meta static showing ₹ pricing because the writer pulled the India template. Universal failure mode without market lock-in.
8. **No campaign-id, no registry.** Work happens in isolation, surfaces drift, no one tracks the delta. Three months later, no one knows which RSAs go with which LP.

---

## Worked example — UK 11+ campaign

```yaml
---
campaign_id: UK-11plus-Y5Y6-prep-2026Q3
status: active
opened: 2026-05-12
last_edit: 2026-05-13
---

# UK 11+ Year 5-6 prep — Sep-Oct exam window

## Cell
Market: UK
Sub-ICP: Settled UK Asian-origin family (Y5-Y6 parents, grammar-school-aspirational)
Grade band: Y5-Y6
Season: Pre-window peak Jul-Aug, exam window Sep-Oct, results Jan
Funnel stage: BOFU (intent-hot, 11+ keyword search) + MOFU (comparison-shopping retargeting)

## The promise (one sentence)
Not an 11+ specialist. A Year 3-to-Y8 coach whose Year 5-6 work happens to include 11+ prep.

## Vocabulary lock
- "Year 5/6" (NOT "Grade 5/6")
- "maths" (NOT "math")
- "grammar school" / "the 11+" (UK-specific)
- "one coach" (longitudinal frame)
- "patient" (Trustpilot-mined parent word)
- "Mum" (NOT "Mom")
- "fee" / "tenure" (operational lock per market ops)

## Proof anchor
- Trustpilot UK Y6 parent: [verbatim quote from CSV — TBD when filled]
- + Verified outcome: a Y5-Y6 kid who passed 11+ AND is still being coached for KS3

## CTA across all surfaces
- RSA: "Book Free 1:1 Class"
- Meta static: "Book a free 1:1 class"
- LP: "Book a free 1:1 class"
- Email: "Confirm your trial"
- WhatsApp: "Reply YES to confirm"

## Banned for this campaign
- "11+ specialist" / "11+ tutor" framing (per school-maths-plus-exam rule)
- Naming Atom Learning / Bonas MacFarlane / Kumon UK / MyTutor
- GCSE / A-Level references (out of K-8 cap)
- "Indian-trained" / "Indian rigour" anywhere
- AmE spelling
- ₹ pricing

## Surfaces in this campaign

### Google RSA — active
- Ad group: uk-11plus-grammar-school-search
- 3 RSAs, each differing at H2:
  - RSA-A H2 lead: longitudinal coach ("Year 3 To GCSE. 11+ Included.")
  - RSA-B H2 lead: school maths + exam ("School Maths + 11+, One Coach")
  - RSA-C H2 lead: method depth ("The Reasoning 11+ Actually Tests")
- All 3 carry full 6-moat balance across unpinned + descriptions

### LP — needs refresh
- LP-ID: [TBD from Notion LP DB]
- Production host: leap.cuemath.com/lp/uk-11plus-y5y6-prep (TBD confirm against host mapping)
- Hero copy required: "Year 3 to Y8. 11+ Is One Chapter."
- Status: NEEDS REFRESH if current hero is 11+-specialist framed

### Meta paid — 6-8 statics planned
- TOFU: pain-led (parent's worry about Y5-Y6 transition)
- MOFU: comparison (Cuemath vs centre-based group tuition)
- BOFU: outcome (named 11+ pass + continued coaching)
- Audience cells: Settled UK Asian-origin Y5-Y6 mothers, London/Manchester/Birmingham metro
- Filed under Notion LP DB once shipped

### Influencer — pending
- Creator briefs being explored
- Voice canon: voice-uk-british-indian

### Email — pre-trial sequence + post-trial sequence
- Pre-trial 1: "We've matched a coach for [child]"
- Pre-trial 2 (T-2 days): "What to expect — the trial isn't an 11+ assessment"
- Post-trial 1: "[Tutor]'s notes on [child]" — with specific observations

### WhatsApp — post-form-submit
- Trial date confirmation + tutor name + day-of reminder
- Post-trial summary + plan

## Adjacent-surface deltas (pending)
- LP hero needs refresh to mirror RSA H2 lead "School Maths + 11+, One Coach"
- LP fold 3 (method) needs longitudinal-coach reframe — drop any "11+ prep module" specialist framing
- Pre-trial email 2 needs reframe of trial — "the trial isn't an 11+ assessment"
- 11+ exam-prep fold on LP needs reframe as "11+ folded into school maths year-round"

## CPTD benchmarks (from Godfather)
- UK cell-weighted CPTD amber threshold: [TBD pull from dashboard]
- Best-performing tag profile in this cell: [TBD]

## Coherence audit log
- 2026-05-12 — Campaign opened, brief drafted
- 2026-05-13 — RSAs drafted, 3 distinct H2 leads logged, LP refresh queued
```

This is the file. One per active campaign. Every format-skill draft starts here.

---

## Output checklist before any format work ships

- [ ] Campaign brief exists at `~/Documents/CM Brain /godfather/campaigns/{campaign-id}.md`
- [ ] Cell fully resolved (no `?` fields)
- [ ] Promise is one sentence, passes read-aloud + sister test
- [ ] Vocabulary lock listed
- [ ] Proof anchor named
- [ ] CTA listed across every surface
- [ ] Surfaces in this campaign listed with status
- [ ] Adjacent-surface deltas flagged if this change affects others
- [ ] CPTD benchmark from Godfather logged
- [ ] Audit-log entry added

---

## Canonical references — read before drafting any campaign

- `~/Documents/CM Brain /godfather/05-reference/market-operational-models.md` — per-market operational truth
- `~/Documents/CM Brain /godfather/05-reference/cuemath-creative-direction-v1.md` — CD v1 brand canon
- Per-market voice canon files (once built) — `~/Documents/CM Brain /godfather/02-skills/voice-canons/`
- Per-format manual — read before drafting that surface
- Godfather dashboard — CPTD benchmarks, current winners, cell-weighted data
- Trustpilot CSV — proof anchor sourcing
- Notion LP Content Library DB — LP-ID lookup, last-shipped reference

---

## Related

- [[meta-static.md]] · [[lp.md]] · [[google-rsa.md]] · [[influencer-script.md]] — every format manual references back to this
- [[brand-manager.md]] — pre-ship gate runs the coherence checklist
- [[reference_lp_host_mapping]] — LP host disambiguation (class.cuemath vs leap.cuemath)
- [[reference_lp_slug_structure]] — 8-segment slug rules
- [[feedback_creative_audience_connection]] — every page connects creative to audience to performance

---

*Version 1 · 2026-05-13 · drafted post-format-decision-sweep with Naina · revise as campaigns expose gaps*
