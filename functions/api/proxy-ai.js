// Cloudflare Pages Function — proxies Claude API calls
// Keys stored in Cloudflare environment variables, never exposed to browser

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
    const CLAUDE_KEY = env.CLAUDE_API_KEY;
    if (!CLAUDE_KEY) {
      return Response.json({ error: true, message: 'CLAUDE_API_KEY not configured in environment' }, { status: 500 });
    }

    const body = await request.json();
    const { provider, model, messages, system, max_tokens } = body;

    if (provider === 'claude' || provider === 'anthropic' || !provider) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-haiku-4-5-20251001',
          max_tokens: max_tokens || 4096,
          system: system || '',
          messages: messages || [],
        }),
      });

      const data = await res.json();
      return Response.json(data, {
        status: res.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    return Response.json({ error: true, message: 'Unknown provider. Use "claude".' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: true, message: e.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
