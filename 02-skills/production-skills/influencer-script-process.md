---
name: Influencer Script Process
description: Canonical decision tree for every influencer script — new vs repeat, scaffold lookup, minimum-edit rebuild, continuity check, and the ship→log loop. Stops the "drafting blind" failure where v(n+1) is written without v(n) in front of the writer.
owner: Naina
locked: 2026-05-11
supersedes: the Influencer Brief section of video-script-writer.md (Type 2)
---

# Influencer Script Process

Every influencer script — new shoot, repeat creator, organic-only, boostable — goes through this. No exceptions. The flow exists because the May wave got drafted blind to the April winners, and that's the single biggest creative leak we can plug.

---

## Step 0 — Inputs you need before opening the script

If any of these are missing, stop and ask. Don't draft on incomplete inputs.

| Input | Why |
|---|---|
| Creator handle + name | Lookup key for repeat-check |
| Market | US-NRI / NRI Australia / NRI UK / India / MEA |
| Child grade (and age signal) | Drives Warmth vs Expertise register |
| Language | English / Telugu / Hindi / Tamil / Kannada / Marathi / etc |
| Story angle or campaign window | What this video is *about* |
| Preferred narrative format | Vlog / kid-line skit / talking-head / day-in-life / comparison / YT-integration |

---

## Step 1 — New or repeat?

### Step 1a — Resolve identity FIRST. Handle, not name.

**The handle (IG/YT/TikTok URL) is the canonical primary key for every creator. The name is not.**

Brief sheets, UTM strings, and CRM dumps refer to the same creator by different names:
- Brief sheet calls her "Arigela." UTMs call her "Keerthi." Handle is `moni_rinky`. Same person.
- Brief sheet calls him "Anu." UTMs call him "Anudeep." Handle is `deepanu27`. Same person.
- Two different Deepthis exist (creator + performance talent). Same name. Different pipelines. **Treat as different rows.**

**Resolution sequence — apply every time before logging or auditing:**

1. Take the IG/YT URL from the brief. **Normalise** (strip `?utm_*`, trailing `/`, query strings). That's the canonical key.
2. Query `creative_assets.csv` filter `creator_handle = <normalised handle>`. Any match = same creator regardless of name.
3. **If no handle match, search by name as a secondary check** — but only to surface name-aliases. Any name-match still needs handle-verification before merging.
4. **If briefed with no handle**, stop and ask. Don't proceed on a name alone.

### Step 1b — Pipeline disambiguation. Read the UTM, don't aggregate on name.

UTM strings encode the production pipeline. Different pipelines = different identities, even when the name matches.

| UTM pattern | Pipeline | Talent identity |
|---|---|---|
| `Influencer_Video_<Name>_<YYMMDD>` | **Influencer organic** | The named creator. Has an IG/YT audience. Track in `creative_assets.csv`. |
| `<MKT>_..._Postboost_Video_<Name>_<date>` | **Influencer organic, Meta-boosted** | Same creator as above. Same row + boost UTM. |
| `Video_Testimonial-<Name>-<duration>-<lang>_<date>` | **Performance shoot — testimonial** | Cuemath-shot. Paid talent. Different table. |
| `Inmarket_<MKT>_<Lang>_<Name>_OVid_<date>` | **Performance shoot — org-video** | Cuemath-shot. Different table. |
| `..._Perf_Edit_..._Video_Perf_Influencer_<Name>_<date>` | **Performance edit** | Brand-team edit. Talent identity needs explicit cross-check (thumbnail / face / sign-off). |
| `..._Static-<theme>-<date>` | **Static** | Not a video script at all. Skip. |

**Never aggregate across pipelines under one name.** Performance talent (Cuemath-shot) lives in a separate library (`performance_talent.csv` — TBD). They're not influencer creators with their own audiences.

### Step 1c — Thumbnail / face cross-check (when name is ambiguous)

If a UTM's pipeline tag is unclear, or two assets share a name across pipelines, pull the thumbnail from the tagged_creatives library (or the Meta Ads Library if the creative is paid). **Verify face identity visually before joining performance data.**

Common gotcha: "Deepthi" is a common name. Multiple Deepthis exist as both performance talent and creators. Name alone is insufficient.

### Step 1d — The branch

| Result of 1a+1b | Branch |
|---|---|
| 0 prior records under this handle in `creative_assets.csv` | → Step 2A (NEW) |
| ≥1 prior record under this handle | → Step 2B (REPEAT) |
| Records exist under a different name but same handle | → Step 2B (REPEAT) — merge name aliases in CSV |
| Performance-pipeline records exist under this name (different handle or no handle) | **Do NOT count as repeat.** Different talent identity. Branch on `creative_assets.csv` only. |

---

## Step 2A — NEW creator

Pick the winning formula by intersecting four axes:

| Axis | Source | What it determines |
|---|---|---|
| Market | inputs | Terminology + operational truth (NAPLAN, ₹/$/AUD, "maths"/"math", curriculum mentions) |
| Register | child grade → K-5 Warmth or 6-12 Expertise | Emotional frame (relationship-led vs credibility-led) |
| Pillar | match story angle to CD §8.1–§8.6 | Which of the 5 reference templates this asset is forking |
| USP | per CD §4 ranked list | #1 Same Cuemath coach (default) unless objection requires #2/3/4/5 |

Once the four are locked, fork the matching reference ad from `cuemath-creative-direction-v1.md` §8 verbatim — swap variables per §8 instructions (coach, child name, "used-to" line, mom-VO line). **Do not invent a new pillar.** 30 reference ads exist for a reason.

Default scaffold for NEW NRI vlog creators (most common case in the May wave):

| Beat | Job | Length |
|---|---|---|
| 1. Hook | Parent observation (vlog register) OR kid line (skit register) — math signal lands by ~5s | 0–5s |
| 2. Specifics | 2–3 specific kitchen/school moments, age-appropriate | 5–15s |
| 3. Philosophy | Parent articulates the thesis in HER words (sets up MathFit without naming it yet) | 15–25s |
| 4. Cuemath bridge | One soft line connecting parent's thesis to brand | 25–28s |
| 5. Method visibility | 3 method atoms: same Cuemath coach + 1:1 + interactive (shown, not described) | 28–40s |
| 6. Beat 3 canonical | One CD §3 behavioural moment, **verbatim**, age-mapped | 40–48s |
| 7. CTA | Conditional soft CTA — "If you want to explore this for your child…" | 48–55s |
| 8. Locked close card | **Same Cuemath Coach. Every Single Class. Making Your Child *MathFit*.** | 55–60s |

This is the proven NRI vlog scaffold (decoded from April Kalyani winner + reference set §8.1).

---

## Step 2B — REPEAT creator

### B1. Do we have the actual shipped script?

**Query:** `creative_assets.csv` for prior `script_text` of this creator.

| State | Action |
|---|---|
| Script logged | Proceed to B2 |
| Script missing | **STOP.** Flag to Naina. Ask her to paste from the creator's actual IG / YT post (not from the original brief — the brief is aspirational, the shipped post is descriptive). Don't proceed without it. |

**Why this matters:** The brief is what we asked for. The script is what the creator actually said. Influencers rewrite. The voice that converted is the voice they used, not the voice we briefed. Reverse-engineering structure from a brief is a category error.

### B2. Decode the prior winner

With the actual script in hand:

1. **Pull the performance** from CRM (intl_leads/india_leads) joined on `utm_organic` and `utm_boost`. Apply the evidence-first winner gate (May 11 rule):
   - Confirmed winner: cohort ≥ 14d + TDs ≥ 3 + CPTD ≤ market amber
   - Provisional: cohort ≥ 14d + TDs ≥ 2 + CPTD ≤ amber × 1.3
   - Early signal: cohort < 14d OR TDs < 2 — do not yet change direction
2. **Map the beats** of the prior script onto the 8-beat scaffold above. Identify which beats are load-bearing (the conversion engine) and which are decorative.
3. **Identify the structural signature** — the specific lines/moves that earned the click in that creator's voice (e.g., Kalyani April's "That's why I really like what Cuemath is doing" bridge; the parent-philosophy-before-brand sequence; the discovery-framing of MathFit as her word).

### B3. Apply the minimum-edit principle

v(n+1) ≈ v(n) + 5–15% targeted edits. **Only edit what the new story OR new locked rules require.** Preserve:

- Voice, register, sentence rhythm
- Beat order and beat shapes
- Conversion-engine bridge lines (verbatim where possible)
- Vocabulary the creator owns (her emoji palette, code-switch markers, signature phrases)

### B4. Update for new locked rules (only when they postdate the prior video)

- **Locked close card** (May 10) — verbatim card replaces flat closing line
- **Beat 3 canonical** (CD §3) — one observable behavioural moment in the body, age-mapped to Clarity / Application / Confidence verbatim
- **Cuemath coach attribution** (May 6) — never bare "Coach [Name]"; use "Cuemath coach" + tenure or memory
- **"kids" not "children"** (May 5)
- **"tutor" not "specialist"** (May 5)

### B5. Continuity check — does it feel like the next episode?

The creator's audience saw the prior video. The new one should feel like Episode 2, not a fresh ad.

| Continuity dimension | Test |
|---|---|
| Voice | Same register, pacing, emoji palette as prior post |
| Character | Same child (or sibling, named consistently). Same Cuemath coach reference shape if one was established. |
| Concept stack | If prior video already introduced MathFit, the new one assumes the audience knows. Don't reintroduce. |
| Tone arc | If April was wonder, May shouldn't pivot to anxiety. Tone should compound, not contradict. |
| Story progress | Show the *next* observed moment, not a different parent journey. "She's still doing X, AND now also Y" beats "completely different story." |

If a continuity dimension fails: rewrite the offending line, don't rewrite the script.

---

## Step 3 — Brand pass (universal, every script)

Run all of these before showing the script to anyone:

- [ ] SACI gate (Sharp · Articulate · Creative · Impactful) — fail any, rewrite
- [ ] Hard Kills scan (CD v1 + NRI Review §"Hard Kills") — any tripped = do not ship
- [ ] MathFit dimension named exactly once (Clarity / Application / Confidence) per CD §3 mapping
- [ ] Cuemath coach visible (Named / Tenure / Memory) — never bare-name, never Absent
- [ ] Locked close card present, verbatim
- [ ] Math word visible/audible in first 3s (performance ad) or by 5–7s (influencer-organic vlog)
- [ ] "kids"/"child" never "children"; "tutor" never "specialist"
- [ ] No invented facts (tenure ranges, outcomes, contest names, stats) — every claim sources to CD/NRI-review/seasonal-calendar/CRM
- [ ] CTA single + soft + matches market overlay

---

## Step 4 — Ship → log (the loop closes here)

When the creator ships the final post:

1. **Paste the FINAL post copy** (not the brief, not the working draft) into `creative_assets.csv` as a new row.
2. **Tag** the row using the schema below — dimension, USP, coach visibility, close-card state.
3. **Add the post URL** + organic UTM + boost UTM.
4. **After 14 days**: pull funnel from the latest CRM dump, fill in QLs / TBs / TDs / CPTD. Mark `winner_status` per the evidence-first gate.
5. **Annotate `notes`** — what structurally worked or didn't, in one line. This is the institutional memory.

The next script for this creator starts at Step 1 with this row already in place.

---

## Schema: `04-reports/creative_assets.csv`

| Column | Type | Source |
|---|---|---|
| `asset_id` | text · `YYMMDD-{MARKET}-INF-{NN}` | manual at log time |
| `creator_handle` | text · IG/YT handle | manual |
| `creator_name` | text · display name | manual |
| `flight_date` | YYYY-MM-DD | manual |
| `flight_month` | YYYY-MM | manual |
| `market` | enum · US-NRI / NRI-AUS / NRI-NZ / NRI-SG / NRI-UK / India / MEA | manual |
| `language` | text | manual |
| `child_grade` | text · "KG" / "1" / "5" / "10" / "G2 + G4 (siblings)" | manual |
| `story_angle` | text · one-line | manual |
| `script_text` | longtext · **FULL FINAL POSTED COPY** (not the brief) | manual paste from post |
| `post_url` | url · IG / YT post | manual |
| `utm_organic` | text · campaign or adcontent for organic | from UTM gen |
| `utm_boost` | text · boost ad creative adcontent | from UTM gen |
| `dimension_named` | enum · Clarity / Application / Confidence / mixed | tagger |
| `usp_led` | enum · #1-Same-coach / #2-1-in-200 / #3-1:1 / #4-Indian-pedagogy / #5-Manan | tagger |
| `coach_visibility` | enum · Named / Tenure / Memory / Absent | tagger |
| `close_card` | enum · locked / pre-lock / missing | tagger |
| `mathfit_named_count` | int | tagger |
| `qls` | int | CRM join |
| `tb` | int | CRM join |
| `td` | int | CRM join |
| `cptd` | currency | calc post-cohort-mature |
| `winner_status` | enum · confirmed / provisional / early-signal / not-winner | per evidence-first gate |
| `notes` | text · 1-line structural note | manual after performance review |

---

## When to use this skill

`/write influencer` for any creator script. The skill auto-triggers Steps 0–4 in order. If a step can't complete (missing inputs, missing prior script), the skill **stops and asks** rather than improvising.

Direct invocation: pass `creator: <handle> | market: <X> | grade: <Y> | angle: <Z>` and the process runs.

---

## Calibration lessons from May 11 Naina review (3 gtg scripts: Divya, Amaya, Saloni)

These are the patterns Naina demonstrated by accepting OR rejecting Forge's revisions. Apply on every script going forward.

1. **Don't over-edit good drafts.** If the original clears the brand floor, the right edit count is 0–2 micro-fixes, not a structural rewrite. Divya: full revision rejected; only ™ symbol + outro line touched. Archana: original kept, two micro-edits ("super fast" → "good at math"; added "Math" to outcome).

2. **Beat 3 canonical ("works through problems she's never seen before") is a brand PRINCIPLE, not a verbatim copy-paste.** Naina dropped it from Amaya, Saloni, Divya. In body the proof can be parent-voice ("explains why the answer is right" / "teacher noticed before I said anything"). Use the canonical line as an *option*, not a mandatory insertion.

3. **Locked close card is NOT auto-appended to every influencer organic.** None of the 3 gtg scripts had it. May 10 close card belongs to performance ads + LPs primarily. For influencer organic, the script-level close can be flat (`Cuemath makes kids MathFit™`) and the locked card overlay (if any) is a production-design decision.

4. **Grade 6+ scripts get a STAKES LAYER.** Specific US-academic vocabulary: "honors track / accelerated track / AP / pre-calc foundation / Grade 9 window." Application register made concrete. Mandatory addition for any 6–12 register script.

5. **Production direction (Energy / Land notes) belongs inline for higher-register scripts.** Amaya carries it: *"Energy: genuinely surprised, not performative"* / *"Land: The surprise needs to feel real. This moment earns the next 50 seconds."* Required for Grade 6+ talent direction. K-5 Warmth scripts don't need it.

6. **"Common Core curriculum" is OK in body.** Verified US reference. Don't strip on fact-check grounds.

7. **Group-class / offline-class comparison is OK in BODY, just not in HOOK.** Anti-USP framing in body scenes is fine ("Kids don't get that kind of attention in school or even in offline group classes" — Anni scene 3 approved). Don't strip as "punching at strawmen" unless it's the lead claim.

8. **"Cuemath coach" attribution NOT mandatory in body.** Use "tutor" throughout. Brand attribution happens via Cuemath/MathFit named mentions + close card. Don't insert "Cuemath coach" in every body line.

9. **Coach-line texture should be simple, not layered.** "She knows how she learns, where she hesitates" is enough. Stop stacking tenure + memory + specific behavioural detail — that reads engineered.

10. **MathFit™ with TM symbol** is preferred in body brand mentions.

11. **Parent-philosophy leads are OK for Grade 6+ register.** Don't force kid-observed beats. For strategic-parent register, parent-reflection-first is the correct opening (Saloni: "I spend so much time building my kids' routines — school, activities, everything").

12. **Brand frameworks NEVER spoken in parent/influencer VO.** Caught May 12 on Reshu Shot 4 — spelled out 3 FUAR pillars (fluency, understanding, reasoning) in mom's VO. **Hard rule:** FUAR pillars (Fluency · Understanding · Application · Reasoning) and MathFit dimensions (Clarity · Application · Confidence) live in on-screen text, end-card copy, and brand-side strategy docs ONLY. Parent/influencer VO uses the *outcome* — not the framework name.

**Outcome translations (parent voice):**

| Framework name | Parent-VO equivalent |
|---|---|
| Fluency | "she's quick on the basics" / "doesn't get stuck on simple steps" |
| Understanding | "she actually gets *why* it works" / "she explains it back" |
| Application | "she can tackle a problem she's never seen" / "not freezing on new questions" |
| Reasoning | "she thinks it through before she answers" / "catches her own mistakes" |
| Clarity | "she explains her steps before she solves" / "shows the why" |
| Confidence | "she tries, fails, retries — instead of asking for the answer" |

**Exception:** MathFit™ as a *brand term* is OK in parent VO ("she's becoming MathFit™" / "they call it MathFit"). The dimensions/pillars are not.

---

## What this skill replaces

- The Influencer Brief section (Type 2) of `02-skills/production-skills/video-script-writer.md` — that section assumed every script is a fresh brief and had no repeat-creator branch. Forge should call this skill instead when the job is influencer.
- Ad-hoc decoding of "what did the prior video say?" from briefs — briefs are aspirational; the shipped post is descriptive. Always start from the shipped artifact.

---

*Owner: Naina · Locked: 2026-05-11 · Trigger: any influencer script request*
