// Cloudflare Pages Function — server-side vision tagger.
// Mirrors the Python pipeline at 04-reports/_tagger_v2/auto_pipeline/vision_tagger.py
// but runs server-side so the dashboard can fire-and-forget tagging for new ads
// on every load. Capped at 10 ads per call to fit inside Workers' 30s wall time.
//
// POST body:  { ad_names: [<string>, ...] }
// Response:   { tagged: N, skipped: N, errors: [...], results: [{ad_name, status, kind?, source?}] }

const META_VERSION = "v22.0";
const SUPA_URL = "https://lcixlyyzlnzeiqjdbxfh.supabase.co";
const SUPA_KEY = "sb_publishable_3vFEM4zGI7Rx9z7H4cLmhw_xt6nkw4u";
const ACCOUNTS = [
  "act_5215842511824318", // US/CA
  "act_888586384639855",  // India
  "act_925205080936963",  // ROW
];
const MAX_PER_CALL = 10;
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

// Vision prompt — locked controlled vocabularies, mirrors PROMPT.md.
const SYSTEM_PROMPT = `You are a marketing analyst tagging Cuemath ad creatives. You read the on-image text + visual cues and output structured tags. Only use values from the controlled vocabularies. Use "Unclear" when not supported.

hook_frame: Enrichment | Anxiety | System-diagnosis | Child-diagnosis | Competition | Academic-Outcome | Behavioral-Outcome | Future-readiness | Cultural | Outcome-First | Memorization-vs-Understanding | Foundation | Competition-Prep | Unclear
master_frame: MathFit | Memorization-vs-Understanding | 1-1-Personalization | Top-Tutors | Cultural-Relatability | Outcome-First | Competition-Prep | Trust-Badge | Unclear
close_type: Recommendation | Try-Cuemath | Free-Class | Offer-led | Trust-Badge | Unclear
specificity: Named-tutor | Named-child | Named-both | Named-parent | Anonymous | Unclear
pain_target: pick up to 2 from: Confidence, Foundation, Concept-Clarity, Competition-Prep, Late-Stage-HS, Engagement, Speed-Accuracy, Personalization-Gap, Topic-Algebra, Topic-Fractions, Topic-Word-Problems, Topic-Geometry, Topic-Calculus, Topic-Number-Sense, Topic-Multiplication, Unclear (comma-separated)
production_cue: UGC-raw | UGC-polished | Studio | AI-Generated | Static-Graphic | Animated | Unclear
language: English | Telugu | Tamil | Hindi | Gujarati | Mandarin | Kannada | Malayalam | Mixed | Unclear

Output a SINGLE JSON object (no prose, no markdown):
{
  "ad_name": "<exact name passed in>",
  "hook_frame": "...", "master_frame": "...", "close_type": "...",
  "specificity": "...", "pain_target": "<primary>[,<secondary>]",
  "production_cue": "...", "language": "...",
  "evidence_hook": "<exact on-image text>", "evidence_close": "<CTA>", "evidence_pain": "<text/scene>",
  "confidence": "High|Medium|Low",
  "notes": "<1 sentence or empty>"
}`;

// ---------- helpers ----------

async function metaCall(token, endpoint, params) {
  const u = new URL(`https://graph.facebook.com/${META_VERSION}/${endpoint}`);
  if (params) for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  u.searchParams.set("access_token", token);
  const r = await fetch(u.toString());
  return r.json();
}

async function fetchBytes(url) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return null;
  return new Uint8Array(await r.arrayBuffer());
}

function bytesToBase64(bytes) {
  let s = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function sniffMime(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[8] === 0x57) return "image/webp";
  return "image/jpeg";
}

async function findAdId(token, adName) {
  // Try each account; first match wins.
  for (const acct of ACCOUNTS) {
    const body = await metaCall(token, `${acct}/ads`, {
      fields: "id,name",
      limit: "10",
      filtering: JSON.stringify([{ field: "ad.name", operator: "EQUAL", value: adName }]),
    });
    const ad = (body.data || [])[0];
    if (ad?.id) return { account: acct, ad_id: ad.id };
  }
  return null;
}

async function resolveAssetUrl(token, account, ad_id) {
  const body = await metaCall(token, ad_id, {
    fields: "creative{thumbnail_url,asset_feed_spec{images,videos},video_id,object_type,id}",
  });
  const creative = body.creative;
  if (!creative) return null;
  const afs = creative.asset_feed_spec || {};
  const videos = afs.videos || [];
  const images = afs.images || [];

  if (videos.length) {
    const vid = videos[0].video_id;
    const fallback = videos[0].thumbnail_url; // 160x160
    if (vid) {
      const tBody = await metaCall(token, vid, { fields: "thumbnails{uri,is_preferred}" });
      const thumbs = ((tBody.thumbnails || {}).data) || [];
      if (thumbs.length) {
        const pref = thumbs.find(t => t.is_preferred) || thumbs[0];
        return { kind: "video", url: pref.uri, source: "v3-vision-video-frame" };
      }
    }
    if (fallback) return { kind: "video", url: fallback, source: "v3-vision-video-frame-lores" };
    return null;
  }
  if (images.length) {
    const hash = images[0].hash;
    if (!hash) return null;
    const aiBody = await metaCall(token, `${account}/adimages`, {
      hashes: JSON.stringify([hash]),
      fields: "permalink_url,width,height",
    });
    const row = (aiBody.data || [])[0];
    if (row?.permalink_url) return { kind: "static", url: row.permalink_url, source: "v3-vision-static" };
    return null;
  }
  return null;
}

async function callHaiku(claudeKey, ad_name, market, fmt, b64, mime) {
  const userPrompt = `Tag this Cuemath ad.\n\nAd name: ${ad_name}\nMarket: ${market}\nFormat: ${fmt}\n\nRead on-image text + visual cues and output the JSON now.`;
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
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mime, data: b64 } },
          { type: "text", text: userPrompt },
        ],
      }],
    }),
  });
  const j = await r.json();
  if (j.error) return { error: j.error };
  return j;
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

function marketFromName(name) {
  const n = (name || "").toUpperCase();
  if (/MEA|KSA|UAE|SAUDI|QATAR|KUWAIT|OMAN|BAHRAIN/.test(n)) return "MEA";
  if (/ANZ|AUSTRALIA|\bNZ\b|\bSG\b|SNG|SINGAPORE/.test(n)) return "ANZ";
  if (/USA|US_|CAN|CANADA|NRI/.test(n)) return "US";
  if (/UK_|^UK|_UK_/.test(n)) return "UK";
  if (/IND_|INDIA/.test(n)) return "India";
  return "ROW";
}

async function upsertV3(row) {
  const r = await fetch(`${SUPA_URL}/rest/v1/creative_tags_v3?on_conflict=ad_name`, {
    method: "POST",
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([row]),
  });
  return r.ok;
}

// ---------- handler ----------
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

  const META_TOKEN = env.META_ACCESS_TOKEN;
  const CLAUDE_KEY = env.CLAUDE_API_KEY;
  if (!META_TOKEN || !CLAUDE_KEY) {
    return Response.json({ error: true, message: "Missing tokens in env" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  let adNames = Array.isArray(body.ad_names) ? body.ad_names : [];
  if (!adNames.length) {
    return Response.json({ error: true, message: "ad_names required (array)" }, { status: 400 });
  }
  if (adNames.length > MAX_PER_CALL) adNames = adNames.slice(0, MAX_PER_CALL);

  const results = [];
  let tagged = 0, skipped = 0;

  for (const ad_name of adNames) {
    try {
      const found = await findAdId(META_TOKEN, ad_name);
      if (!found) { skipped++; results.push({ ad_name, status: "ad_not_found" }); continue; }
      const asset = await resolveAssetUrl(META_TOKEN, found.account, found.ad_id);
      if (!asset) { skipped++; results.push({ ad_name, status: "no_asset" }); continue; }
      const bytes = await fetchBytes(asset.url);
      if (!bytes || bytes.length < 500) { skipped++; results.push({ ad_name, status: "fetch_failed" }); continue; }
      const mime = sniffMime(bytes);
      const b64 = bytesToBase64(bytes);
      const market = marketFromName(ad_name);
      const fmt = asset.kind === "video" ? "Video" : "Static";
      const resp = await callHaiku(CLAUDE_KEY, ad_name, market, fmt, b64, mime);
      if (resp.error) { skipped++; results.push({ ad_name, status: "haiku_error", err: String(resp.error.message || resp.error).slice(0, 120) }); continue; }
      const parsed = parseHaikuJson(resp);
      if (!parsed) { skipped++; results.push({ ad_name, status: "parse_failed" }); continue; }

      const row = {
        ad_name,
        hook_frame:    parsed.hook_frame,
        master_frame:  parsed.master_frame,
        close_type:    parsed.close_type,
        specificity:   parsed.specificity,
        pain_target:   parsed.pain_target,
        production_cue:parsed.production_cue,
        language:      parsed.language,
        evidence_hook: parsed.evidence_hook || "",
        evidence_close:parsed.evidence_close || "",
        evidence_pain: parsed.evidence_pain || "",
        confidence:    parsed.confidence,
        notes:         parsed.notes || "",
        source:        asset.source,
        tagged_at:     new Date().toISOString().slice(0, 10),
      };
      const ok = await upsertV3(row);
      if (!ok) { skipped++; results.push({ ad_name, status: "upsert_failed" }); continue; }

      tagged++;
      results.push({ ad_name, status: "ok", kind: asset.kind, source: asset.source, hook_frame: row.hook_frame, confidence: row.confidence });
    } catch (e) {
      skipped++;
      results.push({ ad_name, status: "exception", err: String(e.message || e).slice(0, 200) });
    }
  }

  return Response.json(
    { tagged, skipped, total_input: adNames.length, results },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
