# Skills Index

Skills are reusable capability modules that agents invoke. Each skill is a self-contained unit of logic with defined inputs, outputs, and rules.

---

## Sentinel Skills

| Skill | Description | Used By |
|---|---|---|
| [[02-skills/data-ingestion|Data Ingestion]] | Parse CSV/API data, normalise headers, validate schema | Sentinel |
| [[02-skills/funnel-mapping|Funnel Mapping]] | Map raw platform events to Cuemath's funnel stages | Sentinel |
| [[02-skills/anomaly-detection|Anomaly Detection]] | Flag statistical outliers, budget leaks, funnel breaks | Sentinel |
| [[02-skills/threshold-scoring|Threshold Scoring]] | Score metrics green/amber/red against geo-specific benchmarks | Sentinel |

## Lens Skills

| Skill | Description | Used By |
|---|---|---|
| [[02-skills/creative-tagging|Creative Tagging]] | Assign multi-dimensional attributes to creatives | Lens |
| [[02-skills/pattern-correlation|Pattern Correlation]] | Map creative attributes to funnel performance | Lens |
| [[02-skills/fatigue-detection|Fatigue Detection]] | Detect creative decay over time-series data | Lens |
| [[02-skills/brief-generation|Brief Generation]] | Translate winning patterns into actionable creative briefs | Lens, Oracle |

## Forge Skills

| Skill | Description | Used By |
|---|---|---|
| [[02-skills/copy-generation|Copy Generation]] | Generate headlines, body copy, CTAs per channel spec | Forge |
| [[02-skills/script-writing|Script Writing]] | Write influencer, performance, and AI video scripts | Forge |
| [[02-skills/image-prompting|Image Prompting]] | Engineer Banana Pro prompts for ad image generation | Forge |
| [[02-skills/brief-interpretation|Brief Interpretation]] | Extract structured brief from freeform user input | Forge |
| [[02-skills/channel-adaptation|Channel Adaptation]] | Format output for Meta, Google, Bing specs and limits | Forge |

## Oracle Skills

| Skill | Description | Used By |
|---|---|---|
| [[02-skills/cross-signal-synthesis|Cross-Signal Synthesis]] | Combine outputs from multiple agents into new insights | Oracle |
| [[02-skills/prioritisation|Prioritisation]] | Rank insights by impact × confidence × urgency | Oracle |
| [[02-skills/action-formatting|Action Formatting]] | Structure recommendations as specific, named, executable steps | Oracle |

## Shared Skills

| Skill | Description | Used By |
|---|---|---|
| [[02-skills/geo-context|Geo Context]] | Inject geography-specific knowledge (currencies, school systems, festivals) | All agents |
| [[02-skills/brand-validation|Brand Validation]] | Validate any text output against Cuemath brand rules | Forge, Oracle |
