# Google Demand Gen — format manual

The format manual for Google Demand Gen campaigns — Google's image + video inventory across YouTube (in-feed, Shorts), Gmail, Discover. Sibling to Meta paid (image + video) but routed through Google's audience and intent signals.

KPI is CPTD via cell-targeted reach × creative-fit × LP conversion. Demand Gen lives between RSA (text-only, intent-hot) and YouTube TrueView (skippable pre-roll) — broader awareness with stronger targeting than Meta.

---

## When to invoke

You are writing Demand Gen creative when ALL of these are true:
- Surface = Google's image + video inventory (YouTube in-feed, Shorts, Gmail promotions, Discover)
- Format = image (1080×1080 / 1080×1350) or video (15-30s, 9:16 vertical preferred for Shorts placement)
- Audience = lookalike or custom-audience signals via Google
- Funnel stage = MOFU (warmed audiences from search/visit retargeting) or TOFU (lookalike from existing customers)

If Google Search text-only → [[google-rsa.md]].
If YouTube pre-roll TrueView specifically → [[youtube-video.md]].

---

## Physics of this surface

| Property | Reality |
|---|---|
| Inventory mix | YouTube in-feed (above the related-videos rail) · Shorts feed (vertical scroll, similar to Reels) · Gmail promotions tab · Google Discover (mobile feed) |
| Auto-rotation | Google rotates image / video assets per impression based on placement |
| Audience signal | Custom Intent (keyword + URL signals) · Lookalike (existing customer match) · Retargeting (visit-based) |
| Time budget | Varies by placement — Shorts = 3-sec hook physics (same as Reels); Gmail = scroll-past (compelling subject + image); Discover = curiosity-led |
| Spec sheet | Image: 1.91:1 + 1:1 + 4:5 + 9:16. Video: 15-30s, 9:16 vertical primary. |
| Brand safety | Google enforces brand-safety filters; copy must avoid medical / legal / financial framing that triggers ad disapproval |

---

## The Demand Gen creative package — assets per campaign

| Asset | Required for | Notes |
|---|---|---|
| Square image (1:1) | Discover, Gmail | Hero outcome anchor — single child, named result |
| Landscape image (1.91:1) | Gmail header, YouTube in-feed | 3-beat compressed into one frame |
| Vertical image (9:16 or 4:5) | Shorts feed, Reels cross-post | Same shape as Meta static 9:16 |
| Vertical video (15-30s) | Shorts feed | Same physics as [[meta-reel.md]] — first 3 sec earns continued scroll |
| Horizontal video (16:9, 15-30s) | YouTube in-feed | More room to breathe — 3-beat full |

Google requires 5-15 image assets + 1-5 video assets per Demand Gen campaign. Don't ship a Demand Gen campaign with single-asset coverage.

---

## Lock / Free / Anchor per funnel stage

### MOFU Demand Gen (retargeting from search / LP visit)

**Locked:**
- Audience already saw a higher-intent surface (RSA / LP visit / form-start)
- Promise echoes that upstream surface
- CTA = "Book a free 1:1 class" (or HS US diagnostic)
- Coach visible / tenure / memory framing
- Locked close card (for video assets) / locked end-frame (for images)
- No competitor names
- Single MathFit dimension (or none)

**Free:**
- Which proof anchor to lead with — outcome (number) vs tenure vs Trustpilot quote
- Asset structure — testimonial card · before/after · 3-beat reel · documentary cut-down
- Specific child / family featured (per market visual rules)

**Anchor:**
- Upstream creative (the RSA / LP they came from) — message-match required
- Trustpilot CSV slice for the cell
- Godfather creative_tags_v3 for current MOFU winners

### TOFU Demand Gen (lookalike from existing customers)

**Locked:** All MOFU locks. Plus: first 5 seconds without Cuemath / without math / without "this is an ad" (DBS rule for video; equivalent visual restraint for image — no logo top-half, hero kid moment first).

**Free:**
- Pain-led vs outcome-led vs human-led (DBS H1-H5 hypothesis variants)
- Brand film cut-downs from Hub series
- Lookalike segment-specific creative (different visual for first-gen vs second-gen US, etc.)

---

## Variation axes

Demand Gen rewards asset breadth. Each campaign should ship variants across:

1. **Hook hypothesis** (H1 pain · H2 evidence · H3 human · H4 product · H5 contrast — per DBS §6)
2. **Audience-cell segmentation** (sub-ICP per market, with creative matched)
3. **Asset format mix** (image-heavy week vs video-heavy week to test placement performance)
4. **Vertical vs horizontal balance** (Shorts placement vs in-feed placement)
5. **Brand reveal timing** (immediate / mid / late)

---

## Per-market overrides

Same per-market rules as Meta static + Meta Reel. Voice canon applied to image overlay text + video VO + Gmail subject line.

### India
- Channels active for Demand Gen: limited — primary use is Discover + Gmail. YouTube Shorts placement plausible. Lean Meta-first; Demand Gen as supplement.
- Currency: ₹ on-screen if mentioned
- Voice: per [[voice-india-parent]]

### US
- Channels active: full Demand Gen suite (Gmail + Discover + YouTube in-feed + Shorts) per DBS Y1
- Audience segmentation: First-gen + Second-gen + East Asian — three audience builds
- Voice: three sub-canons per [[voice-us-first-gen]] · [[voice-us-second-gen]] · [[voice-asian-mom-creator]]

### UK
- Channels active: tighter — Meta + Google Search dominant. Demand Gen as secondary spend.
- Audience cell: Settled UK Asian-origin Y5-Y6 for 11+ campaigns

### AU
- Channels active: Demand Gen is part of the 4-channel mix
- NAPLAN seasonality lock applies to all Demand Gen creative

### MEA
- Channels active: Meta + Google + YouTube — Demand Gen included
- International expat register, no vernacular

---

## CPTD gates

1. **Asset-level performance** — Google reports each asset's contribution. Bottom-quartile assets pause, top-quartile scale.
2. **Audience-segment CPTD** — by lookalike build, retargeting depth
3. **LP form-rate** — does Demand Gen traffic convert at parity with Meta and Search? If not, message-match issue.
4. **Placement-level performance** — Shorts vs Gmail vs Discover often diverge sharply; allocate budget accordingly

---

## Failure modes — Demand Gen specific

1. **Single-asset campaign.** Google needs 5-15 images + 1-5 videos to rotate. Single-asset = throttled distribution.
2. **No vertical asset.** Shorts placement requires 9:16. Missing it = no Shorts inventory.
3. **Brand safety triggers.** Words like "anxiety," "struggling," "behind" can trip filters. Reframe: "challenges" / "gaps" / "next-grade-readiness."
4. **Image text > 20% rule violation.** Google (like Meta) prefers low-text images. Use the cleaner version of meta-static copy patterns for Demand Gen.
5. **Audience-creative mismatch.** Shipping first-gen-cultural-register creative to a second-gen-evidence-led audience build. Match creative to segment.
6. **Out-of-season exam-prep creative running.** NAPLAN in May. 11+ in March. AMC in June. Same seasonality lock as RSA.
7. **CTA mismatch with downstream LP.** Demand Gen video says "Free SAT diagnostic" but routes to a generic LP. CTA → LP routing must be precise.

---

## Coherence checks

Same campaign-coherence rules — campaign ID, upstream signal (what audience signal selected this user), downstream LP, vocabulary lock, CTA matching.

---

## Output checklist before ship

- [ ] 5-15 image assets + 1-5 video assets minimum
- [ ] Vertical asset present (9:16 for Shorts)
- [ ] First 5s of video without Cuemath/math/ad (TOFU only)
- [ ] Locked close card on video assets
- [ ] CTA matches downstream LP
- [ ] Per-market voice canon applied to overlay + VO
- [ ] Per-market visual rules applied
- [ ] Audience-cell-creative match (sub-ICP-specific assets)
- [ ] Brand-safety filter check (no anxiety/struggling/behind hard language)
- [ ] Seasonal validity check
- [ ] Coherence block filled
- [ ] CPTD benchmark per cell

---

## Canonical references

- DBS §6 (5 creative hypotheses — H1-H5)
- [[meta-static.md]] + [[meta-reel.md]] — sibling formats, much shared physics
- [[google-rsa.md]] — coherence pair (Demand Gen often retargets RSA visits)
- Per-market voice canons

---

*Version 1 · 2026-05-13*
