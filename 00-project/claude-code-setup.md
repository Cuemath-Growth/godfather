# How to Put This on Claude Code — Step by Step

## Prerequisites

Before you start, make sure you have:
- [x] Node.js installed (you already did this)
- [x] Claude Code installed (you already did this — PATH fixed)
- [x] Anthropic API key (from console.anthropic.com)
- [ ] This Obsidian vault downloaded and unzipped

---

## Step 1: Set Up Your Project Folder

Open Terminal and run:

```bash
mkdir godfather-v2
cd godfather-v2
```

---

## Step 2: Copy the Vault Into the Project

Copy the entire `godfather-vault` folder into the project root. Claude Code will use these .md files as reference context.

```bash
cp -r ~/Downloads/godfather-vault ./docs
```

Your folder should now look like:
```
godfather-v2/
└── docs/
    ├── 00-project/
    ├── 01-agents/
    ├── 02-skills/
    ├── 03-guardrails/
    ├── 04-workflows/
    └── 05-reference/
```

---

## Step 3: Create the CLAUDE.md File

This is the most important step. Claude Code reads a `CLAUDE.md` file in your project root as its persistent instructions. This is where you paste the master prompt.

Create a file called `CLAUDE.md` in the `godfather-v2/` root:

```bash
touch CLAUDE.md
```

Open it in any editor and paste the content from **Step 4** below.

---

## Step 4: The CLAUDE.md Prompt

Paste this into your `CLAUDE.md` file:

```markdown
# Godfather v2 — Project Prompt

## WHO YOU ARE
You are building Godfather v2 — Cuemath's proprietary AI-powered creative audit,
performance intelligence, and content generation platform. This is an internal tool
for Cuemath's performance marketing team across India, US, Australia, and MEA.

## REFERENCE DOCS
All brand rules, agent definitions, guardrails, workflows, and funnel definitions
are in the `docs/` folder. READ THESE BEFORE WRITING ANY CODE:

- `docs/00-project/README.md` — Project overview and vault map
- `docs/00-project/roadmap.md` — Build phases and order of operations
- `docs/01-agents/` — All 4 agent definitions (Sentinel, Lens, Forge, Oracle)
- `docs/02-skills/` — Reusable skill modules
- `docs/03-guardrails/` — Master guardrails + agent-specific rules
- `docs/04-workflows/00-orchestration.md` — How agents communicate
- `docs/05-reference/brand-voice.md` — CRITICAL: Brand rules, banned words, MathFit framework
- `docs/05-reference/funnel-definitions.md` — Funnel stages, metrics, thresholds
- `docs/05-reference/seasonal-calendar.md` — Geo-specific seasonal moments

## TECH STACK
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS + DM Sans font
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Image Gen: Banana Pro API (Phase 5)
- Storage: localStorage for MVP, Supabase for Phase 6
- No auth needed for MVP

## BUILD ORDER (follow the roadmap)
Phase 1: Tab 3 (Forge / Content Studio) — brief wizard + Claude API + copy output
Phase 2: Tab 1 (Sentinel / Performance Analytics) — CSV upload + funnel analysis
Phase 3: Tab 2 (Lens / Creative Audit) — creative tagging + pattern correlation
Phase 4: Tab 0 (Oracle / Dashboard) — cross-agent synthesis
Phase 5: Image gen + API integrations
Phase 6: Feedback loop + persistence

## CRITICAL RULES
1. Read `docs/05-reference/brand-voice.md` before writing ANY copy-related code
2. Read `docs/03-guardrails/00-master-guardrails.md` before building ANY agent logic
3. The Forge agent's system prompt MUST include all banned words and brand rules
4. MathFit skills = FUAR (Fluency, Understanding, Application, Reasoning) for marketing
5. Never use "classroom", "center", "guaranteed marks", or any banned phrase
6. Parent-facing voice always. Never address children directly.
7. Every generated copy must include a "why this works" data grounding note
8. Agents communicate via shared JSON files, not real-time calls
9. Never aggregate campaign rows — each instance stays individual
10. Currency must always be explicitly labelled (INR, USD, AUD)

## ENV VARS NEEDED
ANTHROPIC_API_KEY=your-key-here

## START HERE
Begin with Phase 1. Scaffold the Next.js app, build the 5-step brief wizard,
wire the Forge system prompt into the Claude API, and display structured copy output.
Read the roadmap for detailed tasks.
```

---

## Step 5: Set Your API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

Or create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## Step 6: Launch Claude Code

Navigate to your project folder and start Claude Code:

```bash
cd godfather-v2
claude
```

Claude Code will automatically read the `CLAUDE.md` file and have full context.

---

## Step 7: Give Your First Command

Once Claude Code is running, type:

```
Read the docs/ folder structure and the roadmap. Then scaffold the Next.js 14 
app with Tailwind and DM Sans. Set up the 4-tab navigation layout 
(Dashboard, Performance, Creative Audit, Content Studio). Only Tab 3 
(Content Studio) should be functional for Phase 1. Start building the 
5-step brief wizard for Forge.
```

Claude Code will:
1. Read all the .md files in docs/
2. Scaffold the Next.js app
3. Set up routing for all 4 tabs
4. Build the wizard UI
5. Wire the Forge system prompt

---

## Step 8: Iterate Phase by Phase

After Phase 1 is working, move to Phase 2:

```
Phase 1 is complete. Now build Phase 2: Sentinel / Performance Analytics.
Read docs/01-agents/01-sentinel.md and docs/05-reference/funnel-definitions.md.
Build the CSV upload interface, data ingestion, funnel mapping, threshold 
scoring, and the campaign drill-down tables for Tab 1.
```

Follow the same pattern for each phase.

---

## Tips for Working with Claude Code on This Project

### Keep the docs/ folder updated
If you discover new guardrails, add them to the .md files. Claude Code re-reads
CLAUDE.md on every session but you can also tell it to re-read specific files.

### Use explicit phase commands
Don't say "build everything." Say "build Phase 2" and reference the specific 
agent doc + guardrails doc it should read first.

### Test the Forge system prompt early
The system prompt for the Claude API call is the most important piece. 
Ask Claude Code to show you the full system prompt before it builds the API route.
Compare it against docs/05-reference/brand-voice.md to verify completeness.

### Paste sample data for Sentinel
When building Phase 2, paste a few rows from the performance tracker CSV 
so Claude Code can see the actual column structure and build the parser correctly.

### Version control
Init a git repo early:
```bash
git init
git add .
git commit -m "Phase 1: Forge MVP"
```
Commit after each working phase.

---

## Folder Structure After Phase 1

```
godfather-v2/
├── CLAUDE.md                    ← Master prompt for Claude Code
├── docs/                        ← Your Obsidian vault (reference)
│   ├── 00-project/
│   ├── 01-agents/
│   ├── 02-skills/
│   ├── 03-guardrails/
│   ├── 04-workflows/
│   └── 05-reference/
├── app/
│   ├── layout.tsx               ← Root layout + nav
│   ├── page.tsx                 ← Redirect to /dashboard
│   ├── dashboard/page.tsx       ← Tab 0 (Phase 4)
│   ├── performance/page.tsx     ← Tab 1 (Phase 2)
│   ├── creative-audit/page.tsx  ← Tab 2 (Phase 3)
│   └── content-studio/page.tsx  ← Tab 3 (Phase 1) ← START HERE
├── components/
│   └── content-studio/
│       ├── BriefWizard.tsx
│       ├── CopyOutput.tsx
│       ├── OutputBlock.tsx
│       └── RefineInput.tsx
├── lib/
│   ├── forge-system-prompt.ts   ← Forge's full system prompt
│   ├── brand-rules.ts           ← Banned words, substitutions
│   └── seasonal-dates.ts        ← Calendar by geo
├── .env.local                   ← API key
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Claude Code says "command not found" | Run `export PATH="$HOME/.npm-global/bin:$PATH"` or add to ~/.zshrc |
| API key not working | Check ANTHROPIC_API_KEY in .env.local — must start with `sk-ant-` |
| Claude Code not reading docs | Say: "Read the file at docs/05-reference/brand-voice.md" explicitly |
| Next.js won't start | Run `npm install` then `npm run dev` |
| Forge generates banned words | Check that forge-system-prompt.ts includes the full banned list from brand-voice.md |
