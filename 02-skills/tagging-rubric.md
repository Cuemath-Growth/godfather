# Content-Grounded Tagging Rubric
**Use:** Inputs to the semantic tagger. The tagger receives `content_summary` (transcript + frame descriptions + OCR), NOT the ad_name, and assigns each tag below from a closed enum based on the rubric. Every tag must cite an `evidence_snippet` from `content_summary`. If no evidence supports any value, output `null` — not a guess.

**Forbidden inputs to this rubric:** ad_name, campaign_name, adset_name, file path, any filename token. Those are tagged separately as structural fields.

---

## content_summary structure (what the tagger consumes)

```yaml
ad_id: 23851234567890
asset_type: video | static
duration_sec: 28        # video only
transcript:             # video only — Whisper output, timestamped
  - {t: 0.0,  text: "My daughter used to hate math homework."}
  - {t: 4.2,  text: "Then we found Cuemath, and her tutor Priya..."}
  - {t: 12.0, text: "Now she explains problems to me."}
on_screen_text:         # OCR per keyframe
  - {t: 0.0,  text: "From struggling to confident"}
  - {t: 24.0, text: "Book a free trial today"}
keyframes:              # 5 frames @ 0/25/50/75/100% — Vision describes
  - {t: 0.0,  desc: "Indian-American woman, 38, kitchen background, holding phone, smiling at camera, natural light, no graphics"}
  - {t: 14.0, desc: "Split-screen: child working at laptop on left, tutor's whiteboard on right, screen recording style"}
  - {t: 28.0, desc: "End card: Cuemath logo, 'Book Free Trial' button, white background"}
end_card_text: "Book a free trial today"
audio_style: "single voice, no music bed, conversational pace"
```

---

## Field 1: Hook

**Definition:** What the ad does in the **first 3 seconds** to stop the scroll. Measured from `transcript[t<=3.0]` + `keyframes[t=0]` + `on_screen_text[t<=3.0]`.

**Closed enum:** `Outcome First` | `Social Proof` | `Curiosity` | `Authority` | `Recommendation` | `Offer/Price` | `Feature-Driven` | `Problem-Aware` | null

**Decision tree:**
- Opens with a **specific transformation/result claim** about a child ("went from failing to top of class") → **Outcome First**
- Opens with a **count / star rating / many-people claim** ("3M+ parents trust", "10,000 reviews", "thousands of families") → **Social Proof**
- Opens with a **single named peer recommendation** ("My friend told me about", "A mom in my building suggested") → **Recommendation** (NOT Social Proof — sample of 1)
- Opens with a **question or contradictory statement** ("Did you know your child's math curriculum is wrong?") → **Curiosity**
- Opens with a **credential/expertise claim** ("Top 1% tutors", "IIT trained", "20 years experience") → **Authority**
- Opens with a **price or discount** ("$49 trial", "50% off", "Free for 7 days") → **Offer/Price**
- Opens with a **product feature description** ("AI-powered learning", "Live 1:1 sessions") → **Feature-Driven**
- Opens with a **pain identification but no solution claim yet** ("Is your child memorizing instead of understanding?") → **Problem-Aware**
- No clear hook in first 3 seconds (cold logo, generic intro) → **null**

**Required evidence:** transcript span `[0.0, 3.0]` OR keyframe `t=0` description OR `on_screen_text[t<=3.0]`.

**Examples (correct):**
- transcript[0:3]="My daughter went from getting Cs to being the top student in her class" → **Outcome First** (specific transformation, named subject)
- transcript[0:3]="The same program 50,000 American families use" → **Social Proof** (numerical claim)
- transcript[0:3]="My neighbor told me about Cuemath last spring" → **Recommendation** (single named peer)
- on_screen_text[t=0]="$1 first trial" → **Offer/Price** (price salient on open)

**Anti-examples (common mis-tags):**
- transcript[0:3]="Hi I'm Keerthi" → **null** (creator intro is not a hook; no claim, no question, no number)
- ad shows a parent + "Testimonial" in filename → does NOT auto-imply Social Proof. Read the actual opening words.
- "Confidence is built one problem at a time" → **null** (philosophical statement, no claim, no question)
- Filename contains `_Influencer_` → irrelevant. Hook is whatever the influencer says in seconds 0–3.

**Null rule:** If the first 3 seconds are creator self-intro, generic logo reveal, or scene-setting without a claim/question/number/credential, return null. Do not infer hook from talent or filename.

---

## Field 2: Benefit

**Definition:** The **central promise** about what the child or parent gains. Measured from full `transcript` + `on_screen_text`. Choose the dominant claim, not every claim mentioned.

**Closed enum:** `Personalization` | `Confidence` | `Grades & School` | `Foundation Building` | `Parent Peace of Mind` | `Competition Prep` | `Fun & Engagement` | null

**Decision criteria:**
- Claims about **1:1 customization, fit-to-your-child, individual pace** → **Personalization**
- Claims about child **emotional state, not afraid, volunteering answers, raising hand** → **Confidence**
- Claims about **test scores, grades, school report cards, A-grades** → **Grades & School**
- Claims about **understanding the why, conceptual depth, lifelong skill** → **Foundation Building**
- Claims about **mom can finally relax, no more battles, family harmony** → **Parent Peace of Mind**
- Claims about **AMC, Olympiad, Math Kangaroo, contests, advanced math** → **Competition Prep**
- Claims about **child enjoys, looks forward to, math is fun now** → **Fun & Engagement**

**Required evidence:** specific transcript span(s) + `on_screen_text` snippet(s) supporting the dominant claim.

**Anti-examples:**
- Creator says "my daughter is enjoying math now and her grades went up" → choose the **dominant** thrust. If frame composition + tone emphasizes grades (report-card screenshot, "A+" graphic), tag **Grades & School**. If music + visuals are about smiling/laughing, tag **Fun & Engagement**. If both equally weighted and you cannot decide, allow `Confidence | Grades & School` combo (only when both are explicit, not inferred).
- Brand tagline "Making Kids MathFit" alone → **null** (slogan, not benefit claim).
- Filename says `_Confidence_Building_` → ignore, read the content.

**Brand guardrail:** "Fun & Engagement" tagged ads should be flagged for review — they violate brand DON'T ("over-index on ease/fun"). Likely real benefit is something else dressed up.

---

## Field 3: Tone

**Definition:** Emotional register of the **delivery**. Voice + pacing + music + visual mood, not content. Measured from `audio_style` + `keyframes[*].desc` + transcript pace.

**Closed enum:** `Warm` | `Aspirational` | `Confident` | `Urgent` | `Playful` | `Inspirational` | `Authoritative` | null

**Decision criteria:**
- Conversational, mom-to-mom, soft delivery, natural light, no music → **Warm**
- Future-frame, "imagine your child", swelling music, polished visuals → **Aspirational**
- Direct address, declarative sentences, no hedging, professional setting → **Confident**
- Time pressure, "limited slots", fast cuts, ticking sounds, FOMO frames → **Urgent**
- Light humor, kid jokes, bright colors, bouncy music → **Playful**
- Transformation arc, before/after, emotional crescendo, motivational music → **Inspirational**
- Credentialed expert speaking, suit/lab coat, lecture posture → **Authoritative**

**Required evidence:** combination of `audio_style` (music presence, voice texture, pace) + at least one keyframe describing visual mood.

**Anti-examples:**
- Influencer in kitchen with no music speaking conversationally about her child → **Warm** (NOT Aspirational, NOT Inspirational — those need music/transformation cues)
- Creator says inspiring words but delivery is flat and visuals are static → **null** or **Confident** (content can be inspirational while tone is not)

**Combos:** Allowed only when two tones are simultaneously and equally present. `Warm | Inspirational` = warm voice over a transformation arc with swelling music. Do not stack 3+ tones.

---

## Field 4: Format

**Definition:** Structural format of the creative — how content is delivered. Measured from `keyframes` + `transcript` structure + `asset_type`.

**Closed enum:** `Personal Testimonial` | `Direct Address` | `Multi-Person Testimonial` | `Graphic Explainer` | `Product Demo` | `Skit/Story` | `Mixed Media` | null

**Resolves the Talking-Head-vs-Testimonial collision:**
- Speaker is a **parent or influencer** sharing **their own child's experience** ("my daughter…", "my son…") → **Personal Testimonial**
- Speaker addresses camera, talks about Cuemath generally **without first-person experience claim** ("Here's why this program works", "Top tutors handpicked from…") → **Direct Address**
- Multiple parents/students stitched together → **Multi-Person Testimonial**
- Voiceover + animated/typographic explanation, no on-camera speaker → **Graphic Explainer**
- Screen recording or app walkthrough showing the product UI → **Product Demo**
- Acted scenario, fictional setup, characters, narrative arc → **Skit/Story**
- Combination of two formats with rough parity → **Mixed Media**

**Required evidence:** keyframe descriptions confirming presence/absence of on-camera speaker, plus transcript pattern (first-person vs general).

**Anti-examples:**
- Filename `_Testimonial_Keerthi_` but transcript has no first-person experience claim, just Keerthi explaining Cuemath features → **Direct Address**, not Personal Testimonial.
- Filename `_Talking_Head_` but Keerthi opens with "my daughter Aanya" → **Personal Testimonial**.
- Static image with parent quote → **Personal Testimonial** (asset_type=static does not preclude testimonial format).

---

## Field 5: Talent

**Definition:** Who is on screen. Verified from `keyframes`, not filename.

**Closed enum:** `Parent` | `Influencer-Parent` | `Influencer-NonParent` | `Child` | `Tutor` | `Animated Character` | `None` | null

**Decision criteria:**
- Adult, identified or implied as parent of the child mentioned → **Parent**
- Known creator from creator-roster, who is also a parent → **Influencer-Parent**
- Known creator, no parent claim → **Influencer-NonParent**
- Person under 18 → **Child** (always tag if child appears, even with parent — prioritize whoever speaks/leads)
- Adult presented as Cuemath tutor/teacher (whiteboard, classroom, "I teach…") → **Tutor**
- Animated character or AI avatar → **Animated Character**
- No human on screen (text-only static, abstract animation) → **None**

**Required evidence:** keyframe descriptions identifying the on-screen person + transcript verifying role claim ("I'm Aanya's mom" → Parent; "I'm a Cuemath tutor" → Tutor).

**Cross-check with Creator field:** If `Creator` is set (from filename or creator-roster match), Talent should align. If Creator=Priyanshul (known influencer-parent) but on-screen analysis suggests no parent claim, flag for human review — possible filename mislabeling.

---

## Field 6: Production

**Definition:** Production tier of the asset. Measured from `keyframes[*].desc` describing lighting, framing, gear, polish.

**Closed enum:** `UGC` | `Studio` | `Static Graphic` | `Animated` | `AI-Generated` | `Stock Footage` | null

**Decision criteria:**
- Phone-shot, natural light, handheld or selfie angle, casual setting (kitchen, living room), no gear visible → **UGC**
- Studio lighting (key+fill+rim), tripod-stable, pro audio, intentional set, possible green screen → **Studio**
- Still image (asset_type=static) with graphics, text overlay, photo, or composite → **Static Graphic**
- Motion graphics, illustrated characters, no live footage → **Animated**
- AI-generated video (uncanny faces, morphing details, generative artifacts visible) → **AI-Generated** (flag for human verification — false positives common)
- Licensed stock footage (generic family scenes, no specific Cuemath context) → **Stock Footage**

**Required evidence:** at least 2 keyframe descriptions consistent with the tier.

**Anti-examples:**
- Influencer self-shot in well-lit kitchen with phone → **UGC** (not Studio, even if it looks polished). Studio requires identifiable production gear or sets.
- "Inhouse-edited" videos in filename → IRRELEVANT. The original footage is what determines Production.

---

## Field 7: Language

**Definition:** Primary spoken language in audio + primary on-screen text language.

**Closed enum:** `English` | `Telugu` | `Tamil` | `Hindi` | `Gujarati` | `Mandarin` | `Spanish` | `Mixed` | null

**Decision criteria:**
- Primary spoken language in `transcript` (Whisper detects). If 80%+ of audio is one language → that language.
- If audio is one language but on-screen text is another (e.g., Telugu voiceover + English subtitles), tag **audio language** (Telugu).
- If audio is split 50/50 (e.g., code-switched Telugu/English testimonial) → **Mixed**.
- Static-only ad: tag the language of the OCR text.

**Anti-examples:**
- Ad has English voiceover with one Hindi greeting → **English**. Don't tag based on minor code-switches.

---

## Field 8: Offer

**Definition:** Is there a price, discount, or promotional offer **visible or stated** in the ad?

**Closed enum:** `Yes` | `No`

**Decision criteria:**
- `transcript` mentions a price, discount %, or "free trial" with specific terms → **Yes**
- `on_screen_text` shows price, "$X", "% off", "limited time" → **Yes**
- "Book a free trial" without price/discount language → **No** (free trial is the default product CTA, not a promotional offer)
- Generic "limited slots" without price → **No**

**Required evidence:** specific transcript span or OCR text with the offer.

---

## Field 9: CTA

**Definition:** The action the ad explicitly asks the viewer to take. From end-card text + closing transcript + clickable button text.

**Closed enum:** `Sign Up` | `Book Free Trial` | `Learn More` | `Get Quote` | `Download` | `Other` | null

**Decision criteria:**
- "Sign up", "Get started", "Create account" → **Sign Up**
- "Book a free trial", "Schedule trial", "Try a class" → **Book Free Trial**
- "Learn more", "See more", "Read the article" → **Learn More**
- Custom CTAs not in this enum → **Other**
- No CTA shown or stated → **null**

**Required evidence:** `end_card_text` OR final 3 seconds of transcript OR explicit on-screen button text.

---

## Field 10: Headline

**Definition:** The dominant on-screen text claim — the line that anchors the ad's message visually. Usually appears in first frame or held throughout. NOT the CTA, NOT the closing card.

**Closed enum:** `Student Outcomes` | `Social Proof` | `Personalized Learning` | `Parent Peace of Mind` | `Building Foundations` | `Promotional Offer` | `Math Competition` | `Expert Tutors` | `Fun & Engagement` | `Brand` | null

**Decision criteria:** Read `on_screen_text` excluding CTA buttons. Pick the dominant theme:
- "From C to A in 3 months" → **Student Outcomes**
- "10,000 parents trust us" → **Social Proof**
- "1:1 learning built for your child" → **Personalized Learning**
- "Finally, math without battles" → **Parent Peace of Mind**
- "Understand the why, not just the how" → **Building Foundations**
- "$49 first month" → **Promotional Offer**
- "AMC prep that works" → **Math Competition**
- "IIT-trained tutors" → **Expert Tutors**
- "Make math fun" → **Fun & Engagement** (flag — brand DON'T)
- "MathFit™" alone → **Brand**

**Required evidence:** specific OCR text snippet.

**Null rule:** If on-screen text is purely the CTA + creator handle + logo, headline is **null**. Don't infer headline from voiceover — that's covered by Benefit.

---

## Field 11: Visual

**Definition:** Dominant visual treatment of the asset. Measured from keyframe descriptions.

**Closed enum:** `Real Person Closeup` | `Real Person Wide` | `Photo Collage` | `Text-Heavy` | `Character/Illustration` | `Home/Study Environment` | `Product UI` | `Split Screen` | null

**Decision criteria:**
- 60%+ of keyframes show a person's face/upper body filling frame → **Real Person Closeup**
- 60%+ show full-body or environmental context with the person → **Real Person Wide**
- Static composite of multiple photos → **Photo Collage**
- 60%+ of frame area is text/typography → **Text-Heavy**
- Cartoon, illustration, animated character → **Character/Illustration**
- Setting emphasizes home/study area without person dominance → **Home/Study Environment**
- App UI, whiteboard, or product screens → **Product UI**
- Two visual fields shown simultaneously → **Split Screen**

**Required evidence:** dominant keyframe description.

---

## Fields handled outside this rubric (do NOT tag from content_summary)

**Type** (Video/Static): from `asset_type` field directly.
**Audience** (NRI/Lookalike/HNI/Interest/Vernacular/Influencer + BAU/PLA segment): from campaign-name regex rules in the dashboard. This is filename-derivable; do not infer from content.
**Creator** (named person token): from creator-roster lookup using filename, then verified against on-screen face if Talent=Influencer.
**Market**: from ad account ID + campaign-name market prefix.

---

## Provenance schema (every tag row in Supabase)

```sql
CREATE TABLE creative_tags (
  ad_id              text NOT NULL,
  field              text NOT NULL,        -- 'hook', 'benefit', etc.
  value              text,                  -- nullable
  source             text NOT NULL,        -- 'content' | 'filename' | 'human' | 'roster'
  evidence_snippet   text,                  -- e.g., "transcript[0.0-3.5]: 'My daughter went from...'"
  confidence         numeric,               -- 0.0–1.0, model's self-rating
  rubric_version     text NOT NULL,        -- e.g., 'v1.0-2026-04-29'
  tagged_at          timestamptz NOT NULL,
  validated_by       text,                  -- human rater name if spot-checked
  validation_status  text,                  -- 'pending' | 'agreed' | 'disagreed' | 'corrected'
  PRIMARY KEY (ad_id, field, rubric_version)
);
```

---

## Tagger prompt skeleton (drop-in for Claude)

```
You are a creative analyst tagging a Cuemath ad.

You will see only the content_summary below. You will NOT see the ad name,
campaign name, or any filename token. Tagging from filename is forbidden.

For each of the 12 fields below, output {value, evidence_snippet, confidence}.
- value must be from the closed enum, or null.
- evidence_snippet must quote a specific span from transcript / on_screen_text /
  keyframes that supports your tag. If you cannot cite evidence, output null.
- confidence is 0.0–1.0; below 0.7 will be queued for human review.

[paste rubric per field]

content_summary:
[paste structured content_summary]

Output JSON: {field_name: {value, evidence_snippet, confidence}, ...}
```

---

## Validation gate

Before any batch persists to Supabase:
1. Random-sample 5% of the batch.
2. Human rater watches each ad fresh, tags blind from a UI showing the ad + the empty rubric form.
3. Compute per-field agreement: human tag == LLM tag.
4. Pass criteria: ≥80% agreement on every field.
5. If any field fails, refine that field's rubric (this doc), bump rubric_version, re-run the entire batch.

**No exceptions.** A single batch passing without validation is how every previous regression entered the system.

---

## Coverage SLA (enforced in dashboard)

For each (market, segment, field):
- Coverage = % of mature ads with non-null tag and validation_status ∈ {agreed, corrected}.
- Below 80%: dashboard shows the field but greys out rankings with "tagging coverage too low — N% of spend untagged".
- Below 50%: dashboard hides the dimension entirely from rankings.

This prevents future "deep insights" being computed on minority data.
