# Production Skills

These are **uploadable Claude Project skills** — not internal agent skills consumed at runtime by Godfather. Each file in this folder is designed to be uploaded into a Claude Project (or its skills surface) so any team member can invoke it directly outside the dashboard.

Distinct from the agent-internal skills in the parent `02-skills/` folder (e.g., `data-intelligence-skills.md`, `segwise-intelligence-skills.md`), which describe capabilities the **agents themselves** call.

## Files

| File | What it does |
|---|---|
| `meta-ad-copy.md` | Generate Meta ad copy (primary headlines, descriptions, CTAs). |
| `google-ads-rsa.md` | Generate responsive search ad headline + description banks. |
| `video-script-writer.md` | Performance + influencer video scripts. |
| `landing-page-content.md` | Full LP copy with folds, proof, CTAs. |
| `landing-page-email.md` | Post-LP nurture and remarketing email copy. |
| `testimonial-script.md` | Parent / kid testimonial format and prompts. |
| `campaign-concept.md` | Translate brief into hooks and big idea. |
| `sound-human.md` | De-corporatise generated copy. |
| `brand-validator.md` | Final pass against brand voice + creative direction v1. |
| `brand-guidelines-uploadable.md` | Cuemath voice constraints, used at generation time inside other skills. |

## How they relate to Forge

Forge (`01-agents/03-forge.md`) is the **agent** that orchestrates these skills end-to-end inside Godfather. The skills here are the same capabilities packaged for direct, agent-free use.
