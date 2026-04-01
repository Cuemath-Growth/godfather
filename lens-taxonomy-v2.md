# Lens Tagger Taxonomy v2 (shared 2026-04-01)

User shared this updated taxonomy for the Lens creative tagging engine.
NOT YET IMPLEMENTED — current code still uses v1 taxonomy with TAG_MIGRATION for intermediate values.

## FORMAT (pick exactly 1)
- Static image — single image, no motion
- Video — non-testimonial video content
- Influencer UGC — content creator or influencer on camera, self-shot or raw feel
- Testimonial video — parent or student speaking to camera, professionally shot
- Vernacular testimonial — testimonial in Hindi, Telugu, Tamil, or Gujarati
- Product video — shows Cuemath platform or app in use
- Brand video — brand-level storytelling, no single spokesperson

## HOOK TYPE (pick exactly 1)
- Math anchor — opens with a math problem, equation, or specific skill gap
- Problem — present-tense learning struggle or parent frustration
- Fear / urgency — future risk, falling behind, or time pressure
- Parent testimonial — parent leads the hook, speaking or quoted
- Statistic — opens with a data point or proof number
- Question — direct question to the parent
- Lifestyle / emotional — aspiration, warmth, family moment, pride
- Competitive — directly references another tutor, brand, or compares
- Offer / price — discount, free trial, or price point as the hook
- Grade badge — specific grade or board call-out leads the ad
- Seasonal — season, holiday, or exam period is the hook

## PAIN POINT (array, 1-2 values max)
- Grades & school
- Confidence & anxiety
- Strong foundations
- Future readiness
- Tutor quality
- Indian roots
- Competition prep

## TONE (pick exactly 1)
- Testimonial
- Aspirational
- Confident
- Urgency
- Comparison
- Offer / promo
- Seasonal

## AUDIENCE (pick exactly 1)
- NRI parents
- Expat parents
- Local parents
- Gujarati speaking
- Telugu speaking
- Tamil speaking
- High school parents

## OFFER PRESENT (true/false)

## TALENT NAME (string or null)
Known names: Keerthi, Priyanshul, Shweta Negi, Mital, Swetha, Payal, Gunjan, Jharna, Damla, Kaira, Sarita, Rituja, Deepthi, Jia, Neha, Surveen, Jasleen, Chetan Patel, Kinjal Gandhi, Haiyan, Jasmine, Sameer, Nancy, Manan, Madhavi, Anushree, Priyanka, Shalini, Silvia, Rishva, Keerthana, Minal, Anandi, Stuti, Aditya, Joyita, Shruti, Kasi Madi, Edison, Gunjan, Varun, Sathish, Aaron, Bryan

## SETTING (pick 1 or null)
- Home
- Studio
- Outdoor
- Screen recording
- Animation

## PRODUCTION STYLE (pick 1)
- UGC
- Studio shoot
- Motion graphic
- Screen record

## CONFIDENCE (0.0 to 1.0)

## JSON OUTPUT
```json
{
  "format": "",
  "hook_type": "",
  "pain_point": ["", ""],
  "tone": "",
  "audience": "",
  "offer_present": false,
  "offer_detail": null,
  "talent_name": null,
  "setting": null,
  "production_style": "",
  "confidence": 0.0,
  "flag_for_review": false,
  "flag_reason": null
}
```
