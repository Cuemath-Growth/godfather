# Godfather — Project Overview

## What is Godfather?

Godfather is Cuemath's proprietary AI-powered creative audit, performance intelligence, and content generation platform. Built exclusively for the performance marketing team across India, US, Australia, and MEA.

**North star:** Help the marketing team identify what's working, kill what isn't, and manufacture high-converting creative content at scale — CPTD is my lagging metric. My time period for someone submitting a QL can go up to as high as 10 days to actually take a trial. So CPTD will be my lagging metric and you should keep monitoring leading metrics in the short term for daily optimization. 

**Leading Metrics:** Market-wise metrics to follow:
US: Spends, CTR, CPQL, TQL, CPTQL, Click to QL, CPTD
AUS: Spends, CTR, CPQL,  TQL, CPTQL, Click to QL, CPTD
MEA: Spends, CTR, CPQL,  TQL, CPTQL, Click to QL, CPTD
India: Spends, CTR, CPQL,  TQL, CPTQL, Click to QL, CPTD
While showing creative wise dashboard, show all above metrics and mark in red the ones that are beyond threshold  

Overall optimization of creatives and campaigns needs to be prioritized on CPTD first - wherever funnels are not fully matured, let's focus on CPTQL followed by other leading metrics mentioned above. 

**Thresholds**
Link to threshold sheet - 

**Column Mappings for the CRM: 
to be pulled from: https://docs.google.com/spreadsheets/d/1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs/edit?gid=1105847310#gid=1105847310** Refer to tabs leads and cost. 

**Leads Sheet (uses header names, not column letters)**

|                             |                                   |
| --------------------------- | --------------------------------- |
| Column Header               | Field                             |
| lead_created_month          | Month of lead creation            |
| lead_created_date           | Date of lead creation             |
| country_bucket              | Country (used for country filter) |
| ql_count (col L)            | QL count                          |
| mx_utm_campaign (col AH)    | Campaign name                     |
| adset                       | Adset name                        |
| ad_name (col J)             | Ad creative name                  |
| utm_medium (col G)          | Channel (Google / Meta / Bing)    |
| reason (col AC)             | Drop-off reason                   |
| grade (col AB)              | Grade                             |
| board (col AY)              | Board (CBSE / IB/ IGCSE etc.)     |
| ethnicity (col F)           | Ethnicity (NRI / Non-NRI etc.)    |
| trial_scheduled (col N)     | Trial scheduled flag              |
| trial_schedule_date (col O) | Trial schedule date               |
| trial_done (col Q)          | Trial done flag                   |
| trial_done_date (col R)     | Trial done date                   |
| paid (col T)                | Paid/enrolled flag                |
| paid_date (col V)           | Paid date                         |
| net_booking (col U)         | Revenue (net booking value)       |

**Costs Sheet (uses header names)**

|                                     |         |
| ----------------------------------- | ------- |
| Column Header                       | Field   |
| amount_spent (col H)                | Spend   |
| country (col D)                     | Country |
| day (col B)                         | Date    |
| campaign_name (col M) Campaign name |         |
|                                     |         |

**Metric Definitions**

|                 |             |                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID              | Label       | Formula                                                                                                                                                                                                                                                                                                                                                                                               |
| spend           | Spend       | Sum of costs                                                                                                                                                                                                                                                                                                                                                                                          |
| qls             | QL          | Count of QL = 1                                                                                                                                                                                                                                                                                                                                                                                       |
| cpql            | CPQL        | Spend / QLs                                                                                                                                                                                                                                                                                                                                                                                           |
| nriQls          | NRI QL      | Number of NRI QLs generated in US                                                                                                                                                                                                                                                                                                                                                                     |
|                 | TQL         | Targeted QL - every market has a different kind of lead we want to focus on, hence we want to track TQLs everywhere as a common term. Definitions across market as below<br>1. US - TQL = number of NRI QLs<br>2. India and MEA - TQL = Number of leads generated across IB and IGCSE boards. To be picked from the board column from CRM. <br>3. APAC and UK - TQL = total number of leads generated |
|                 | CPTQL       | Cost per targeted QL = spends / number of TQL                                                                                                                                                                                                                                                                                                                                                         |
| nriPct          | QL-TQL%     | TQL / QL × 100                                                                                                                                                                                                                                                                                                                                                                                        |
| cpNri           | CPTQL       | Spends / TQL                                                                                                                                                                                                                                                                                                                                                                                          |
| trialsScheduled | Trials Sch  | Count of trial_scheduled = 1                                                                                                                                                                                                                                                                                                                                                                          |
| qlTs            | QL-TS%      | Trials Scheduled / QLs × 100                                                                                                                                                                                                                                                                                                                                                                          |
| td              | Trial Done  | Count of trial_done = 1                                                                                                                                                                                                                                                                                                                                                                               |
| tsTd            | TS-TD%      | Trial Done / Trials Scheduled × 100                                                                                                                                                                                                                                                                                                                                                                   |
| qlTd            | QL-TD%      | Trial Done / QLs × 100                                                                                                                                                                                                                                                                                                                                                                                |
| cptd            | CPTD        | Spend / Trial Done                                                                                                                                                                                                                                                                                                                                                                                    |
| enrolled        | Enrolled    | Count of paid = 1                                                                                                                                                                                                                                                                                                                                                                                     |
| t2p             | T2P%        | Enrolled / Trial Done × 100                                                                                                                                                                                                                                                                                                                                                                           |
| qlP             | QL-P%       | Enrolled / QLs × 100                                                                                                                                                                                                                                                                                                                                                                                  |
| revenue         | Revenue (L) | Sum of net_booking x 100                                                                                                                                                                                                                                                                                                                                                                              |
| abv             | ABV (K)     | Revenue / Enrolled x 100                                                                                                                                                                                                                                                                                                                                                                              |
| roas            | ROAS        | Revenue / Spend                                                                                                                                                                                                                                                                                                                                                                                       |
| cac             | CAC         | Spend / Enrolled                                                                                                                                                                                                                                                                                                                                                                                      |

  

**5. Country / Region Logic**

**APAC Sub-country breakdown**

APAC is expanded into sub-countries using the mx_utm_campaign prefix:

ANZ_ → Australia

ANZ-NZ_ → New Zealand

ANZ-SG_ or SNG_ → Singapore

Unidentified APAC leads → "APAC (Others)"

**All other countries (US, UK, etc.)**

Standard NRI tracking. Board filter hidden.


**Competitive references:** Foreplay.co, Segwise, MagicBrief, Maino — but custom-built around Cuemath's funnel, brand voice, and multi-geo reality.

---

## Architecture — Four AI Agents

Godfather runs on **four specialised AI agents** orchestrated by a master layer:

| Agent                              | Role                                                                                   | Tab                          |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| **Sentinel** (Performance Agent)   | Ingests Meta + Google data + CRM, maps the full funnel, flags anomalies                | Tab 1: Performance Analytics |
| **Lens** (Creative Audit Agent)    | Decodes *why* creatives work or fail — hook, format, colour, context.                  | Tab 2: Creative Audit        |
| **Forge** (Content Studio Agent)   | Generates ad copy, scripts, and AI images grounded in brand + data                     | Tab 3: Content Studio        |
| **Oracle** (Master Insights Agent) | Pulls signals from all three agents on every refresh, synthesises the AI Insights view | Tab 0: Dashboard             |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + DM Sans
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Image gen:** Banana Pro (via API)
- **Data sources:** Meta Ads API, Google Ads API, manual CSV upload fallback
- **Storage:** Supabase (persistent) + localStorage (session)

---

## Vault Map

```
godfather-vault/
├── 00-project/          ← You are here. Project overview + roadmap.
├── 01-agents/           ← Agent definitions, system prompts, I/O schemas.
├── 02-skills/           ← Reusable skill modules agents can invoke.
├── 03-guardrails/       ← Hard rules every agent must follow.
├── 04-workflows/        ← Inter-agent orchestration + data flow diagrams.
└── 05-reference/        ← Brand book, funnel definitions, seasonal calendars.
```

---

## Key Links

- [[01-agents/00-agent-architecture|Agent Architecture]]
- [[04-workflows/00-orchestration|Orchestration & Data Flow]]
- [[03-guardrails/00-master-guardrails|Master Guardrails]]
- [[05-reference/brand-voice|Brand Voice Bible]]
