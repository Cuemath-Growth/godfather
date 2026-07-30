# Cuemath India — Premium LP for LinkedIn

Built May 4, 2026. Replaces / sits alongside `class.cuemath.com/perf/india/h/signup/` (legacy LP has stale claims and India-mass-market motifs that fight the premium pitch).

## Why a new LP

India business problem (Naina, May 4, 2026):

- TDs (trials done) are over-achieving plan
- TD → P (paid) is only ~10% — operational burn for ops + tutor pool
- Root cause: premium price meeting an audience that wasn't qualified for premium pricing

Strategy: justify the premium **from the ad → through the LP → into the form**, so non-payers self-deselect *before* booking the trial. Lower TQL volume, higher TD→P, less burn.

Target audience for this page: parents in India of children at IB / IGCSE / International (American & British) school families. LinkedIn is the highest-IB-density channel in India (per `05-reference/lp-planning/media-plan/channel-mix-summary.md`).

## File

- `linkedin.html` — single LP, premium baseline, two new sections vs the MEA template:
  1. **Pricing** — transparent per-class price, monthly plan, sibling discount, reassign-tutor, daily progress notes
  2. **Why our classes cost what they do** — six brand-aligned cards explaining the premium, ending in the brand callout *"No shortcuts. Just real conceptual clarity that lasts."*
- `styles.css` — copy of MEA premium baseline + minimal additions for `.price-card-large` / `.price-headline` / `.price-rows`

## Voice

LinkedIn-formal, parent-as-professional. The page reads as the response a senior education buyer expects — no aspirational fluff, no India-mass-market motifs, no "₹500 to ₹3,000" market-range hedging. Outcome-anchored, transparent on price.

## What's the same as MEA premium baseline

- Trustpilot 4.9, 200,000+ students, 80+ countries
- Same teacher every class, monthly plan no lock-in, sibling discount, reassign tutor at no cost, free first class, WhatsApp summary post-trial
- Clean white surface, yellow primary, generous whitespace
- Final CTA on dark surface

## What's India-specific

- Hero pill: "For IB, IGCSE & International school families"
- Hero hook: "Specialist 1:1 math, for parents who pay for outcomes."
- Country code dropdown defaults to **+91**, plus +971 / +65 / +1 / +44 / +61 for globally-mobile families
- Grade dropdown: 4–12 (premium boards skew higher)
- Form has a **board** field (IB / IGCSE / International / CBSE / ICSE / Other) — unlike MEA — so CRM can route premium boards to the priority funnel
- Two new sections (Pricing + Why-this-price)
- Hidden form fields: `curriculum=Premium-IB-IGCSE-Intl`, `market=India`, `channel=LinkedIn`

## Open verifications (Naina to confirm before going live)

- [ ] **Per-class price** — placeholder `₹ ____` in the pricing section. Insert the verified premium per-class number (HTML comment marks the spot)
- [ ] **Hero parent quote** — currently a defensible-but-fictional placeholder ("Grade 9 IB, Bengaluru"). Replace with a real verified India IB / IGCSE parent review before going live (HTML comment marks the spot)
- [ ] Confirm "rigorous selection" framing for top-1% tutors is OK, vs naming a specific stage count
- [ ] Confirm monthly plan + sibling discount + reassign-tutor are all currently active for India (the verified-features memory is dated)

## Form wiring (engineering handoff)

Form `action="#"` is a placeholder. To go live:

1. Wire `action` to the trial-booking endpoint (same as `/perf/india/h/signup/`)
2. Pass `curriculum`, `market`, `board`, `channel` hidden fields through to CRM tags
3. UTM pass-through: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` from URL into the lead row
4. WhatsApp opt-in confirmation: trigger the post-trial WhatsApp summary template
5. Suggested URL: `class.cuemath.com/perf/india/linkedin/` (clean, board-agnostic, paid-channel suffix)

## Pre-launch checklist

- [ ] Replace ₹ placeholder with verified price
- [ ] Replace placeholder parent quote with a verified India IB / IGCSE quote
- [ ] Form submits to live endpoint and creates a CRM lead with `board=` tag
- [ ] WhatsApp summary fires post-submission
- [ ] Renders on mobile (375px) and desktop (1440px)
- [ ] Trustpilot 4.9 / 200K+ / 80+ countries claims still match public Cuemath site
- [ ] No "free trial PLUS extra discount" bolt-ons — premium positioning means no discount theatrics
- [ ] OG tags + meta description premium-aligned (already updated; verify final copy)

## Source-of-voice (no fabrication)

Every Cuemath claim on this page traces to the verified-features list in `feedback_no_invented_facts_lp.md` (May 4 audit) + the HS Performance Marketing Brief positioning principles ("classes" not "sessions", "personalised program" not "tutoring", aligned-with-curriculum not own-curriculum). Every comparison row is a generic-industry-pattern contrast (1:1 vs group, specialist vs generalist, monthly vs annual) — no named-competitor specifics.

## What's not here yet

- A/B variants (Stretch / Wild) — this is the Safe baseline. Add them after week-1 performance data lands
- Brand-awareness variant (separate from performance) — different page, story-first, no hard CTA
- Tutor faces / "Meet your tutor" section — pending photo + bio approval. The MEA `.tutor-grid` styles are present in `styles.css` if/when added
