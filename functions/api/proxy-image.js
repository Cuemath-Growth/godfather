// Cloudflare Pages Function — fetches images server-side, returns base64
// Needed for tagging pipeline: Meta CDN thumbnail URLs get CORS-blocked client-side

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return Response.json({ error: true, message: 'url query parameter required' }, { status: 400 });
    }

    // Validate URL is a reasonable image source
    const parsed = new URL(imageUrl);
    const allowedHosts = ['scontent', 'fbcdn', 'facebook', 'instagram', 'cdninstagram', 'googleapis', 'googleusercontent'];
    const isAllowed = allowedHosts.some(h => parsed.hostname.includes(h));
    if (!isAllowed) {
      return Response.json({ error: true, message: 'URL host not in allowlist' }, { status: 403 });
    }

    const res = await fetch(imageUrl);
    if (!res.ok) {
      return Response.json({ error: true, message: `Image fetch failed: ${res.status} ${res.statusText}` }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binary);

    // Determine mime type
    let mimeType = 'image/jpeg';
    if (contentType.includes('png')) mimeType = 'image/png';
    else if (contentType.includes('gif')) mimeType = 'image/gif';
    else if (contentType.includes('webp')) mimeType = 'image/webp';

    return Response.json({ base64, mimeType }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return Response.json({ error: true, message: e.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
