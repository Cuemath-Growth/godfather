// Proxies Claude and Gemini API calls — keeps API keys on server, never exposed to browser
export default async (req) => {
  // CORS preflight
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
    const body = await req.json();
    const { provider, model, messages, system, max_tokens } = body;

    if (provider === 'claude' || provider === 'anthropic') {
      const CLAUDE_KEY = Netlify.env.get('CLAUDE_API_KEY');
      if (!CLAUDE_KEY) return new Response(JSON.stringify({ error: 'CLAUDE_API_KEY not configured' }), { status: 500 });

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
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (provider === 'gemini') {
      const GEMINI_KEY = Netlify.env.get('GEMINI_API_KEY');
      if (!GEMINI_KEY) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });

      const geminiModel = model || 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_KEY}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.geminiBody || {}),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown provider. Use "claude" or "gemini".' }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const config = {
  path: '/api/proxy-ai',
};
