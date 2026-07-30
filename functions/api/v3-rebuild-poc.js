// Cloudflare Pages Function — POC for v3 audio-layer rebuild.
// One-time. Remove after Phase 1 sign-off.
// POST { ad_names: [...] } (max 3 per call to fit 30s wall time)
// For each ad: Meta API -> creative_id + mp4 source -> Whisper -> Haiku audio tags
// Persists each row to poc_v3_audio_results and returns the batch result.

const META_VERSION = "v22.0";
const SUPA_URL = "https://lcixlyyzlnzeiqjdbxfh.supabase.co";
const SUPA_KEY = "sb_publishable_3vFEM4zGI7Rx9z7H4cLmhw_xt6nkw4u";
const ACCOUNTS = [
  "act_5215842511824318", // US/CA
  "act_888586384639855",  // India
  "act_925205080936963",  // ROW
];
const MAX_PER_CALL = 3;
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const WHISPER_MODEL = "whisper-1";

const AUDIO_SYSTEM_PROMPT = `You are a marketing analyst tagging Cuemath ad creatives by their voiceover transcript. You read the spoken-word transcript and output structured tags. Only use values from the controlled vocabularies. Use "Unclear" when not supported by the transcript.

hook_frame: Enrichment | Anxiety | System-diagnosis | Child-diagnosis | Competition | Academic-Outcome | Behavioral-Outcome | Future-readiness | Cultural | Outcome-First | Memorization-vs-Understanding | Foundation | Competition-Prep | Unclear
master_frame: MathFit | Memorization-vs-Understanding | 1-1-Personalization | Top-Tutors | Cultural-Relatability | Outcome-First | Competition-Prep | Trust-Badge | Unclear
close_type: Recommendation | Try-Cuemath | Free-Class | Offer-led | Trust-Badge | Unclear
pain_target: pick up to 2 from: Confidence, Foundation, Concept-Clarity, Competition-Prep, Late-Stage-HS, Engagement, Speed-Accuracy, Personalization-Gap, Topic-Algebra, Topic-Fractions, Topic-Word-Problems, Topic-Geometry, Topic-Calculus, Topic-Number-Sense, Topic-Multiplication, Unclear (comma-separated)
language: English | Telugu | Tamil | Hindi | Gujarati | Mandarin | Kannada | Malayalam | Mixed | Unclear

evidence_hook: verbatim first 15-20 seconds of the transcript (opening hook)
evidence_pain: verbatim sentence(s) from the transcript that justify pain_target
evidence_close: verbatim closing line from the transcript

Output a SINGLE JSON object (no prose, no markdown):
{
  "ad_name": "<exact name passed in>",
  "hook_frame": "...", "master_frame": "...", "close_type": "...",
  "pain_target": "<primary>[,<secondary>]",
  "language": "...",
  "evidence_hook": "...", "evidence_close": "...", "evidence_pain": "...",
  "confidence": "High|Medium|Low",
  "notes": "<1 sentence or empty>"
}`;

async function metaCall(token, endpoint, params) {
  const u = new URL(`https://graph.facebook.com/${META_VERSION}/${endpoint}`);
  if (params) for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  u.searchParams.set("access_token", token);
  const r = await fetch(u.toString());
  return r.json();
}

async function findAdId(token, adName) {
  for (const acct of ACCOUNTS) {
    const body = await metaCall(token, `${acct}/ads`, {
      fields: "id,name",
      limit: "5",
      filtering: JSON.stringify([{ field: "ad.name", operator: "EQUAL", value: adName }]),
    });
    const ad = (body.data || [])[0];
    if (ad?.id) return { account: acct, ad_id: ad.id };
  }
  return null;
}

async function resolveCreative(token, ad_id) {
  const body = await metaCall(token, ad_id, {
    fields: "creative{id,thumbnail_url,asset_feed_spec{images,videos},video_id,object_type}",
  });
  return body.creative || null;
}

async function getVideoSource(token, video_id) {
  const body = await metaCall(token, video_id, { fields: "source" });
  return body.source || null;
}

async function transcribeWithWhisper(openaiKey, mp4Url) {
  const r = await fetch(mp4Url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return { error: `download_failed_${r.status}` };
  const buf = await r.arrayBuffer();
  if (buf.byteLength < 1000) return { error: "video_too_small" };

  const form = new FormData();
  form.append("file", new Blob([buf], { type: "video/mp4" }), "ad.mp4");
  form.append("model", WHISPER_MODEL);
  form.append("response_format", "verbose_json");

  const wr = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });
  const j = await wr.json();
  if (j.error) return { error: (j.error.message || JSON.stringify(j.error)).slice(0, 200) };
  return { text: j.text || "", language: j.language, duration: j.duration };
}

async function callHaikuAudio(claudeKey, ad_name, transcript) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      system: AUDIO_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [{
          type: "text",
          text: `Tag this Cuemath ad by its voiceover transcript.\n\nAd name: ${ad_name}\nTranscript:\n"""\n${transcript}\n"""\n\nOutput the JSON now.`,
        }],
      }],
    }),
  });
  return r.json();
}

function parseHaikuJson(resp) {
  const content = resp.content || [];
  const txt = content.filter(c => c.type === "text").map(c => c.text).join("").trim();
  const stripped = txt.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(stripped.slice(start, end + 1)); } catch (_) { return null; }
}

async function getCurrentV3(adName) {
  const u = `${SUPA_URL}/rest/v1/creative_tags_v3?ad_name=eq.${encodeURIComponent(adName)}&select=hook_frame,evidence_hook,master_frame,pain_target,close_type,source`;
  const r = await fetch(u, { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } });
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function persistPocRow(row) {
  const r = await fetch(`${SUPA_URL}/rest/v1/poc_v3_audio_results?on_conflict=ad_name`, {
    method: "POST",
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  });
  return r.ok;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response("", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return Response.json({ error: true, message: "POST only" }, { status: 405 });
  }

  const META = env.META_ACCESS_TOKEN;
  const CLAUDE = env.CLAUDE_API_KEY;
  const OPENAI = env.OPENAI_API_KEY;
  if (!META || !CLAUDE || !OPENAI) {
    return Response.json({
      error: true,
      message: "Missing token in env",
      missing: { META_ACCESS_TOKEN: !META, CLAUDE_API_KEY: !CLAUDE, OPENAI_API_KEY: !OPENAI },
    }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  let adNames = Array.isArray(body.ad_names) ? body.ad_names : [];
  const market = typeof body.market === "string" ? body.market : null;
  const spend = typeof body.spend === "number" ? body.spend : null;
  if (!adNames.length) {
    return Response.json({ error: true, message: "ad_names required (array)" }, { status: 400 });
  }
  if (adNames.length > MAX_PER_CALL) adNames = adNames.slice(0, MAX_PER_CALL);

  const results = [];

  for (const ad_name of adNames) {
    const row = { ad_name, status: "unknown", market, spend_inr: spend };
    try {
      const found = await findAdId(META, ad_name);
      if (!found) {
        row.status = "ad_not_found";
        results.push(row); await persistPocRow(row); continue;
      }
      row.ad_id = found.ad_id;
      row.account = found.account;

      const creative = await resolveCreative(META, found.ad_id);
      if (!creative) {
        row.status = "no_creative";
        results.push(row); await persistPocRow(row); continue;
      }
      row.creative_id = creative.id;

      const videos = (creative.asset_feed_spec && creative.asset_feed_spec.videos) || [];
      const images = (creative.asset_feed_spec && creative.asset_feed_spec.images) || [];
      const isVideo = videos.length > 0 || !!creative.video_id;
      row.asset_type = isVideo ? "video" : (images.length ? "image" : "unknown");

      if (!isVideo) {
        row.status = "static_no_audio";
        const current = await getCurrentV3(ad_name);
        row.current_v3_hook = current?.hook_frame || null;
        row.current_v3_source = current?.source || null;
        results.push(row); await persistPocRow(row); continue;
      }

      const video_id = (videos[0] && videos[0].video_id) || creative.video_id;
      if (!video_id) {
        row.status = "no_video_id";
        results.push(row); await persistPocRow(row); continue;
      }
      row.video_id = video_id;

      const mp4Url = await getVideoSource(META, video_id);
      if (!mp4Url) {
        row.status = "no_video_source";
        results.push(row); await persistPocRow(row); continue;
      }
      row.video_source_url = mp4Url;

      const whisper = await transcribeWithWhisper(OPENAI, mp4Url);
      if (whisper.error) {
        row.status = "whisper_failed";
        row.error = whisper.error;
        results.push(row); await persistPocRow(row); continue;
      }
      row.vo_transcript = whisper.text;
      row.detected_language = whisper.language;
      row.duration_sec = whisper.duration;

      if (!whisper.text || whisper.text.length < 10) {
        row.status = "empty_transcript";
        results.push(row); await persistPocRow(row); continue;
      }

      const haikuResp = await callHaikuAudio(CLAUDE, ad_name, whisper.text);
      if (haikuResp.error) {
        row.status = "haiku_failed";
        row.error = JSON.stringify(haikuResp.error).slice(0, 200);
        results.push(row); await persistPocRow(row); continue;
      }
      const tags = parseHaikuJson(haikuResp);
      if (!tags) {
        row.status = "haiku_parse_failed";
        results.push(row); await persistPocRow(row); continue;
      }
      row.audio_hook_frame = tags.hook_frame;
      row.audio_master_frame = tags.master_frame;
      row.audio_close_type = tags.close_type;
      row.audio_pain_target = tags.pain_target;
      row.audio_evidence_hook = tags.evidence_hook;
      row.audio_evidence_pain = tags.evidence_pain;
      row.audio_evidence_close = tags.evidence_close;
      row.audio_confidence = tags.confidence;
      row.audio_language = tags.language;

      const current = await getCurrentV3(ad_name);
      row.current_v3_hook = current?.hook_frame || null;
      row.current_v3_evidence = current?.evidence_hook || null;
      row.current_v3_source = current?.source || null;
      row.hook_match = current ? (current.hook_frame === tags.hook_frame) : null;

      row.status = "ok";
      results.push(row); await persistPocRow(row);
    } catch (e) {
      row.status = "exception";
      row.error = String(e.message || e).slice(0, 300);
      results.push(row);
      try { await persistPocRow(row); } catch (_) {}
    }
  }

  return Response.json(
    {
      batch_size: adNames.length,
      ok: results.filter(r => r.status === "ok").length,
      static: results.filter(r => r.status === "static_no_audio").length,
      results,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
