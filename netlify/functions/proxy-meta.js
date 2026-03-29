// Proxies Meta Graph API calls — keeps access token on server
export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  try {
    const META_TOKEN = Netlify.env.get('META_ACCESS_TOKEN');
    if (!META_TOKEN) return new Response(JSON.stringify({ error: 'META_ACCESS_TOKEN not configured' }), { status: 500 });

    const body = await req.json();
    const { endpoint, params } = body;

    if (!endpoint) return new Response(JSON.stringify({ error: 'endpoint required' }), { status: 400 });

    // Build Meta Graph API URL — endpoint is like "act_123456/ads" or "act_123456/insights"
    const url = new URL(`https://graph.facebook.com/v21.0/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    url.searchParams.set('access_token', META_TOKEN);

    const res = await fetch(url.toString());
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const config = {
  path: '/api/proxy-meta',
};
