// Cloudflare Pages Function — proxies Meta Graph API calls
// Access token stored in Cloudflare environment variables, never exposed to browser

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: true, message: 'POST only' }, { status: 405 });
  }

  try {
    const META_TOKEN = env.META_ACCESS_TOKEN;
    if (!META_TOKEN) {
      return Response.json({ error: true, message: 'META_ACCESS_TOKEN not configured in environment' }, { status: 500 });
    }

    const body = await request.json();
    const { endpoint, params } = body;

    if (!endpoint) {
      return Response.json({ error: true, message: 'endpoint required' }, { status: 400 });
    }

    // Build Meta Graph API URL using URL constructor for the base
    // Use v22.0 — Meta deprecates older versions regularly
    const url = new URL(`https://graph.facebook.com/v22.0/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }
    url.searchParams.set('access_token', META_TOKEN);

    const res = await fetch(url.toString());
    const responseText = await res.text();

    // Try to parse as JSON, fall back to raw text error
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return Response.json(
        { error: true, message: `Meta returned non-JSON (${res.status}): ${responseText.slice(0, 200)}` },
        { status: res.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return Response.json(data, {
      status: res.status,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return Response.json({ error: true, message: e.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
