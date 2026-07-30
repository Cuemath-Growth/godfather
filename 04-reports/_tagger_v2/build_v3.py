#!/usr/bin/env python3
"""Build influencer_tags_v3.csv from per-talent script-derived tags.

Each talent has ONE VO script -> one consistent set of hook_frame /
master_frame / close_type / specificity / pain_target tags. Only the
`language` field flips per ad-name when the ad name signals a vernac
variant (Telugu, Gujarati, etc).
"""

import csv
import re

ADS_CSV = "/Users/nainajethalia/Documents/Brain/godfather/04-reports/_tagger_v2/influencer_ads.csv"
OUT_CSV = "/Users/nainajethalia/Documents/Brain/godfather/04-reports/_tagger_v2/influencer_tags_v3.csv"

# Per-talent canonical tags derived from the VO script.
TAGS = {
    "Shweta Negi": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Try-Cuemath",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity",
        "evidence_hook": "He's been doing these Cuemath Classes. I love the fact that it's 1:1.",
        "evidence_close": "So if you want to see your... try this.",
        "evidence_pain": "Concepts. He isn't just counting anymore.",
        "notes": "",
    },
    "Heena": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Named-child",
        "pain_target": "Engagement,Concept-Clarity",
        "evidence_hook": "The math hack every mom needs to know - it changed how my daughter sees math.",
        "evidence_close": "Book a trial class.",
        "evidence_pain": "We started with Cuemath for Aashna. They offer a personalized learning plan.",
        "notes": "",
    },
    "Jia": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Recommendation",
        "specificity": "Anonymous",
        "pain_target": "Engagement,Foundation",
        "evidence_hook": "I'm glad that my daughter is finally engaged with something productive.",
        "evidence_close": "I can't recommend this enough.",
        "evidence_pain": "They're building strong math foundation, playing fun math games.",
        "notes": "",
    },
    "Deepthi": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Confidence,Personalization-Gap",
        "evidence_hook": "Look, I solved this math puzzle all by myself and got the right answer.",
        "evidence_close": "If you want your child to have that one-on-one attention, book a free trial.",
        "evidence_pain": "There is no pressure to keep up with the whole class.",
        "notes": "",
    },
    "Anudeep": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "Top-Tutors",
        "close_type": "Try-Cuemath",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity,Personalization-Gap",
        "evidence_hook": "Wow, I never thought the maths would be this good.",
        "evidence_close": "There will be a free Cuemath trial class. Try it once.",
        "evidence_pain": "Personalized online 1-1 classes with top Indian tutors.",
        "notes": "",
    },
    "Keerthi": {
        "hook_frame": "Cultural",
        "master_frame": "Cultural-Relatability",
        "close_type": "Try-Cuemath",
        "specificity": "Named-child",
        "pain_target": "Competition-Prep,Personalization-Gap",
        "evidence_hook": "As an NRI parent we always have the tension as to where to send for tuition specially for Math.",
        "evidence_close": "It is definitely worth it - please give it a try.",
        "evidence_pain": "They also train for competitive exams like Math Kangaroo and AMC 8.",
        "notes": "",
    },
    "Priyanshul": {
        "hook_frame": "Cultural",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Named-child",
        "pain_target": "Concept-Clarity",
        "evidence_hook": "Chicago ka weather abhi kaafi unpredictable chal raha hai.",
        "evidence_close": "I'll share the free trial class link with you.",
        "evidence_pain": "They focus on building concepts rather than rote learning.",
        "notes": "Hinglish NRI dad-of-Govind frame.",
    },
    "Sahar": {
        "hook_frame": "Child-diagnosis",
        "master_frame": "MathFit",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity",
        "evidence_hook": "He could sometimes get the right answer in math. But when I asked him how he solved it, he couldn't really explain it.",
        "evidence_close": "You can also try their free trial class.",
        "evidence_pain": "They call it becoming MathFit, developing real problem solving and reasoning skills.",
        "notes": "Script says QMath but means Cuemath.",
    },
    "Priyanka D": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity,Confidence",
        "evidence_hook": "Mama, if one apple costs $3, how much would seven apples cost? $21. So easy.",
        "evidence_close": "If you want to try out for a free Cuemath trial class.",
        "evidence_pain": "His tutor goes at his pace, makes sure he really understand math and focuses on reasoning.",
        "notes": "",
    },
    "Ana": {
        "hook_frame": "Enrichment",
        "master_frame": "Memorization-vs-Understanding",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Topic-Algebra",
        "evidence_hook": "I started using Cuemath for high school prep. My tutor just doesn't give me formulas to memorize.",
        "evidence_close": "Do them a favor and book the free trial.",
        "evidence_pain": "Visual simulations that make advanced algebra and geometry actually make sense.",
        "notes": "",
    },
    "Abhilasha": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Engagement,Concept-Clarity",
        "evidence_hook": "I love a good mom hack, but this one actually changed our everyday routine.",
        "evidence_close": "Cuemath even offers a free trial.",
        "evidence_pain": "He asks questions freely and gets instant feedback. Math time is no longer a struggle.",
        "notes": "",
    },
    "Subhi": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "Memorization-vs-Understanding",
        "close_type": "Free-Class",
        "specificity": "Named-child",
        "pain_target": "Confidence,Concept-Clarity",
        "evidence_hook": "My niece used to hate math - but now she teaches me math.",
        "evidence_close": "Free trial classes.",
        "evidence_pain": "Her tutor focuses on concept first, not speed.",
        "notes": "Niece Nitya named.",
    },
    "Sayani Roy": {
        "hook_frame": "Enrichment",
        "master_frame": "1-1-Personalization",
        "close_type": "Try-Cuemath",
        "specificity": "Anonymous",
        "pain_target": "Foundation,Engagement",
        "evidence_hook": "She's good with numbers - but I think she has more potential.",
        "evidence_close": "If you have a young kid, this approach is worth checking out.",
        "evidence_pain": "Not memorising numbers - but understanding what numbers mean and how they work.",
        "notes": "",
    },
    "Nidhi": {
        "hook_frame": "Anxiety",
        "master_frame": "Memorization-vs-Understanding",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Foundation,Confidence",
        "evidence_hook": "This year he will either love math or totally hate it. I wasn't ready to leave it to luck.",
        "evidence_close": "Book a free Cuemath trial class today.",
        "evidence_pain": "Visual tools and logic games that turn abstract concepts into something real.",
        "notes": "",
    },
    "Alev": {
        "hook_frame": "Enrichment",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity,Personalization-Gap",
        "evidence_hook": "She's always been good at math, but I knew school alone wouldn't be enough.",
        "evidence_close": "Check out the free trial class.",
        "evidence_pain": "Visual and interactive methods that actually help her understand the concepts.",
        "notes": "",
    },
    "Jayashree": {
        "hook_frame": "Behavioral-Outcome",
        "master_frame": "1-1-Personalization",
        "close_type": "Try-Cuemath",
        "specificity": "Anonymous",
        "pain_target": "Engagement",
        "evidence_hook": "She actually gets excited to sit at her desk for her Cuemath class.",
        "evidence_close": "If you want your child to enjoy math like this, you should try it.",
        "evidence_pain": "Her tutor really understands her learning style and keeps math fun.",
        "notes": "",
    },
    "Suzy": {
        "hook_frame": "Child-diagnosis",
        "master_frame": "Memorization-vs-Understanding",
        "close_type": "Unclear",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity,Confidence",
        "evidence_hook": "Every time it was time for math homework, my daughter would get frustrated.",
        "evidence_close": "She showed me a math puzzle she solved on her own.",
        "evidence_pain": "Instead of memorising formulas, she finally started understanding the concepts.",
        "notes": "No explicit CTA in script.",
    },
    "Priya Anand": {
        "hook_frame": "Enrichment",
        "master_frame": "MathFit",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Foundation,Engagement",
        "evidence_hook": "She's four. And she counts everything... I don't want to waste it.",
        "evidence_close": "Book a free Cuemath trial class and see how a dedicated tutor keeps that curiosity growing.",
        "evidence_pain": "Cuemath has made my child MathFit.",
        "notes": "",
    },
    "Jugnu": {
        "hook_frame": "Child-diagnosis",
        "master_frame": "Memorization-vs-Understanding",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Concept-Clarity,Personalization-Gap",
        "evidence_hook": "We used to spend so much time on math homework that my daughter was often missing playtime.",
        "evidence_close": "If you're curious, they offer a free trial class.",
        "evidence_pain": "Their approach is not about memorizing formulas - it's really understanding the why behind math.",
        "notes": "",
    },
    "Seema": {
        "hook_frame": "Child-diagnosis",
        "master_frame": "1-1-Personalization",
        "close_type": "Free-Class",
        "specificity": "Anonymous",
        "pain_target": "Confidence,Personalization-Gap",
        "evidence_hook": "Group classes with 20 to 30 kids did not give her the confidence to speak up.",
        "evidence_close": "Cuemath is offering one free one-on-one trial class.",
        "evidence_pain": "They make her think, explain her reasoning, and really understand the why.",
        "notes": "",
    },
    "Shalini": {
        "hook_frame": "Academic-Outcome",
        "master_frame": "Memorization-vs-Understanding",
        "close_type": "Try-Cuemath",
        "specificity": "Anonymous",
        "pain_target": "Confidence,Concept-Clarity",
        "evidence_hook": "Mama, I got 100 on my math test.",
        "evidence_close": "Cuemath is definitely worth trying.",
        "evidence_pain": "They focus on understanding concepts instead of memorizing formulas.",
        "notes": "",
    },
}

LANG_TOKENS = [
    ("Telugu", re.compile(r"Telugu|Telegu", re.I)),
    ("Tamil", re.compile(r"\bTamil\b", re.I)),
    ("Hindi", re.compile(r"\bHindi\b", re.I)),
    ("Gujarati", re.compile(r"Gujarati", re.I)),
    ("Kannada", re.compile(r"Kannada", re.I)),
    ("Malayalam", re.compile(r"Malayalam", re.I)),
    ("Mandarin", re.compile(r"Mandarin", re.I)),
]

def detect_language(ad_name, talent):
    for lang, rx in LANG_TOKENS:
        if rx.search(ad_name):
            return lang
    if talent == "Priyanshul":
        return "Mixed"
    return "English"

def production_cue_for(ad_name):
    if re.search(r"\bStatic\b", ad_name, re.I):
        return "Static-Graphic"
    return "UGC-polished"

def main():
    rows_out = []
    skipped = 0
    per_talent_counts = {}

    with open(ADS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            talent = row["talent"].strip()
            ad_name = row["ad_name"].strip()
            spend = row.get("spend", "")
            td = row.get("TD", "")

            if talent == "Bisma":
                skipped += 1
                continue
            if talent not in TAGS:
                skipped += 1
                print(f"[skip] no tag template for talent={talent!r} ad={ad_name}")
                continue

            t = TAGS[talent]
            lang = detect_language(ad_name, talent)
            prod = production_cue_for(ad_name)

            rows_out.append({
                "ad_name": ad_name,
                "talent": talent,
                "spend": spend,
                "TD": td,
                "hook_frame": t["hook_frame"],
                "master_frame": t["master_frame"],
                "close_type": t["close_type"],
                "specificity": t["specificity"],
                "pain_target": t["pain_target"],
                "production_cue": prod,
                "language": lang,
                "evidence_hook": t["evidence_hook"],
                "evidence_close": t["evidence_close"],
                "evidence_pain": t["evidence_pain"],
                "confidence": "High",
                "notes": t["notes"],
            })
            per_talent_counts[talent] = per_talent_counts.get(talent, 0) + 1

    fieldnames = [
        "ad_name", "talent", "spend", "TD",
        "hook_frame", "master_frame", "close_type", "specificity", "pain_target",
        "production_cue", "language",
        "evidence_hook", "evidence_close", "evidence_pain",
        "confidence", "notes",
    ]
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows_out)

    print(f"[done] wrote {len(rows_out)} rows -> {OUT_CSV}")
    print(f"[done] skipped {skipped} rows")
    print("[done] per-talent counts:")
    for k, v in sorted(per_talent_counts.items(), key=lambda x: -x[1]):
        print(f"   {v:>3}  {k}")

if __name__ == "__main__":
    main()
