---
name: eval-influencer-no-past-script
skill: forge
expected: STOP behavior — Forge should ask, not draft
tests-for-rule: reference_influencer_script_process (May 11-12) — repeat creators REQUIRE actual shipped script from creative_assets.csv
last-known-pass: process locked May 11, calibrated May 12
---

## Brief / Input

> `/write influencer`
>
> Creator: [name of a real Cuemath-shipped creator — use any name from Forge's known repeat-creator list, e.g., Jugnu / Kalyani / Keerthi / Mohit Kukreja]
> Audience: NRI parents grades 6-10
> Topic: kid's confidence on word problems
> Length: ~60 sec
>
> Write a script for this creator.

## Expected output — checkable criteria

**This is a GATE eval. The correct output is NOT a script. The correct output is a STOP-AND-ASK response.**

Forge should:

1. **Recognise the creator name as a repeat / shipped-before creator** (cross-checks against `creative_assets.csv`)
2. **NOT proceed to draft a generic script** based on persona templates
3. **Stop and request the actual past shipped script** for this creator before generating
4. **Explain why** — past shipped script is the source of truth for that creator's voice, cadence, pet phrases, hook style. Without it, the new script will be a generic NRI parent voice, not THIS creator's voice. May 13 audit showed 0% match between V3 tag profiles and actual shipped scripts for Jugnu / Kalyani / Keerthi (see `feedback_v3_brief_vs_shipped_audit.md`).

## Acceptable variations of the STOP response

- "I need the past shipped script from `creative_assets.csv` for [creator] before I can draft this. Their voice is creator-specific; generating without it will produce a generic NRI parent script that won't match how they actually deliver."
- "Stop — repeat creators require their past shipped script per the May 11 process lock. Can you pull the most recent one from `creative_assets.csv` or Slack `#video-requirement` (channel `C094MNCNU74`)?"

## What this catches

- Forge skipping the gate and drafting on persona / V3 tag profile alone
- Using V3 training data as a fallback (V3 lags 2-6 weeks behind shipped; brief-vs-shipped match rate is 0% on corroborable creators)
- Generic NRI-parent voice being delivered as if it were creator-specific

## Anti-pattern (fail mode)

If Forge produces ANY script content (hook lines, VO drafts, structural beats) without first asking for the past shipped script — that's a FAIL. The gate is binary.

## Known-good reference

- Process locked May 11 in `reference_influencer_script_process.md`, calibrated May 12 with 11 lessons appended
- Source hierarchy for ground truth: Slack `#video-requirement` (`C094MNCNU74`) > Notion Collateral DB > Google Docs > local files > V3 training data
- Forge agent updated to invoke this 5-step flow

## Variant: no-past-script creator (truly new)

If the creator is genuinely new (never shipped a Cuemath script before), Forge should:
1. Confirm with the user that this is a first-time creator
2. Generate v1 draft using audience voice canon as base
3. Mark output as "v1 — calibrate against creator's organic content before shipping"

That path is correct. The FAIL is only when Forge skips the gate on a repeat creator.
