# Copy Guardrails — Forge-Specific

These guardrails apply specifically to Forge's copy generation, script writing, and image prompting. They supplement the [[03-guardrails/00-master-guardrails|Master Guardrails]].

---

## Language Gate (Auto-Reject)

These checks run automatically before any copy is shown to the user. If any fail, Forge regenerates.

### F-01: Banned Word Scan
Scan all output text against the banned word list in [[05-reference/brand-voice#Never Use|Brand Voice Bible]]. Any match = auto-reject + regenerate.

Banned list (non-exhaustive):
```
classroom, center, centre, unlock potential, bright future, 
love for learning, amazing, incredible, powerful, 
capable strong and confident, kiddish,
guaranteed marks, guaranteed grades, quick results,
fast improvement, easy math, math is easy
```

### F-01b: Positioning Gate
Scan for language that violates the Constitution's positioning rules:
- Promising shortcuts or speed tricks
- Over-indexing on ease or fun
- Addressing children directly instead of parents
- Using childish exaggeration or gimmicky language
Any match = auto-reject + regenerate with MathFit-aligned alternative.

### F-02: Character Limit Verification
Every headline, description, and CTA is verified against channel-specific limits **after generation, before display.**

| Channel | Element | Hard Limit |
|---|---|---|
| Google RSA | Headline | 30 chars |
| Google RSA | Description | 90 chars |
| Meta | Headline | 40 chars |
| Meta | Description | 30 chars |
| Meta | Primary text | 250 chars max (125 ideal) |

If a headline is 31 chars, it does not ship. Forge shortens and re-verifies.

### F-03: Duplicate Word Scan
No word repeats within:
- A single headline
- A single body copy paragraph
- A set of 3 headline variants (same root word across headlines is a flag)
- A caption + CTA pair

Includes morphological variants: "build" / "building" / "built" / "builds" count as the same word.

### F-04: Parent-Voice Check
Scan for second-person pronouns addressing children: "you will learn", "practice your math", "you'll love it". All copy must address parents: "your child will...", "give your child..."

---

## Quality Gate (Flag + Suggest)

These checks produce warnings. The user sees the output but with a flag.

### F-05: Headline Variety Check
In a set of 3 headlines, at least 2 must use different hook types. Three variations of "Indian tutors" is not A/B testable. Flag: "All three headlines use the same hook. Consider diversifying."

### F-06: ICP Distinctiveness Check
If generating copy for multiple ICPs in one session, Forge compares outputs. If >60% of words overlap between two ICP variants, flag: "These two ICP variants are too similar. The Foundation Builder version should sound noticeably different from the Accelerator version."

### F-07: "Why This Works" Completeness
Every generation must include a "why this works" note that references at least one of:
- A Sentinel data point (e.g., "NRI + static is the best CPTD combo in Feb US data")
- A Lens signal (e.g., "Math-anchored hooks correlate with 2x better QL→TD%")
- A brief-specific insight (e.g., "Diwali is 3 weeks out — seasonal urgency increases CTR")

If the note is generic ("this copy is designed to convert"), flag: "Why this works note lacks data grounding."

### F-08: Accelerator Churn Flag
If generating copy for the Accelerator ICP (competition prep, advanced math), always append a note: "⚠️ Accelerator segment has highest churn risk per strategy doc. Copy may attract high-intent leads who churn after competition season. Consider pairing with retention-focused nurture sequence."

---

## Script-Specific Rules

### F-09: Influencer Script Hook Rule
The first 3 seconds of any influencer script must be either:
- Math-anchored (references a specific math problem, concept, or moment)
- Testimonial (references a specific outcome: grades, confidence in a test, etc.)

Never: lifestyle-only ("being a mom is hard"), generic emotional ("I want the best for my kids"), or unrelated context (cricket, pizza, generic parenting).

> **Origin:** Feb US analysis showed math-anchored influencer hooks convert at 3–5x the rate of lifestyle hooks on QL→TD%.

### F-10: Script CTA Must Be Verbal + Visual
Every script must include a CTA that is both:
- Spoken by the talent ("Book a free trial at cuemath.com")
- Shown as text on screen (end card or overlay)

Verbal-only CTAs lose 40%+ of conversion intent.

### F-11: Script Length Guardrails
| Script Type | Ideal Length | Maximum |
|---|---|---|
| Influencer UGC | 30–45 seconds | 60 seconds |
| Performance marketing | 15–30 seconds | 45 seconds |
| AI / motion graphic | 15–20 seconds | 30 seconds |

Longer ≠ better. Attention drops sharply after 30 seconds on Meta.

---

## Image Generation Rules

### F-12: Meta Text Policy
Generated images must have <20% text coverage. Text overlay (headline, CTA, badge) is added post-generation, not baked into the AI prompt. The image itself should be text-free or text-minimal.

### F-13: No Identifiable Children
AI-generated images must never depict identifiable children's faces. Use: abstract math visuals, parent focus, illustration style, or environmental shots (desk, books, screen).

### F-14: Brand Colour Anchoring
Every generated image must incorporate at least one of:
- Yellow #F5A623 (primary)
- Navy #1A1A2E (secondary)

As a dominant or accent colour. Never generate images with no brand colour presence.

### F-15: Format Compliance
Images are generated at exact Meta-compliant dimensions:
| Format | Pixels | Use |
|---|---|---|
| 1:1 | 1080×1080 | IG/FB feed |
| 4:5 | 1080×1350 | IG feed (tall) |
| 9:16 | 1080×1920 | Stories/Reels |
| 16:9 | 1920×1080 | YouTube/GDN |
| 1.91:1 | 1200×628 | FB/Google landscape |

---

## See Also

- [[03-guardrails/00-master-guardrails|Master Guardrails]]
- [[01-agents/03-forge|Forge Agent Definition]]
- [[05-reference/brand-voice|Brand Voice Bible]]
- [[02-skills/key-skills#Skill: Brand Validation|Brand Validation Skill]]
