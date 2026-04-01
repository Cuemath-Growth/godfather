// Cloudflare Pages Function — extracts first image from a Notion page
// Notion integration token stored in Cloudflare env vars, never exposed to browser

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
    const NOTION_TOKEN = env.NOTION_API_TOKEN;
    if (!NOTION_TOKEN) {
      return Response.json({ error: true, message: 'NOTION_API_TOKEN not configured in environment' }, { status: 500 });
    }

    const body = await request.json();
    const { page_id } = body;

    if (!page_id) {
      return Response.json({ error: true, message: 'page_id required' }, { status: 400 });
    }

    // Clean page ID (remove dashes if needed, extract from URL)
    const cleanId = page_id.replace(/-/g, '');

    // Fetch all blocks from the page to find the first image
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${cleanId}/children?page_size=100`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!blocksRes.ok) {
      const err = await blocksRes.json().catch(() => ({}));
      return Response.json(
        { error: true, message: err.message || `Notion API ${blocksRes.status}` },
        { status: blocksRes.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const blocksData = await blocksRes.json();
    let imageUrl = null;

    // Search for first image block (could be nested in columns, toggles, etc.)
    function findFirstImage(blocks) {
      for (const block of blocks) {
        if (block.type === 'image') {
          if (block.image?.file?.url) return block.image.file.url;
          if (block.image?.external?.url) return block.image.external.url;
        }
      }
      return null;
    }

    imageUrl = findFirstImage(blocksData.results || []);

    // If no image in top-level blocks, check inside toggles/columns (one level deep)
    if (!imageUrl) {
      for (const block of (blocksData.results || [])) {
        if (block.has_children) {
          try {
            const childRes = await fetch(`https://api.notion.com/v1/blocks/${block.id}/children?page_size=50`, {
              headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
              },
            });
            if (childRes.ok) {
              const childData = await childRes.json();
              imageUrl = findFirstImage(childData.results || []);
              if (imageUrl) break;

              // Check one more level (columns inside column_list)
              for (const child of (childData.results || [])) {
                if (child.has_children) {
                  try {
                    const grandchildRes = await fetch(`https://api.notion.com/v1/blocks/${child.id}/children?page_size=50`, {
                      headers: {
                        'Authorization': `Bearer ${NOTION_TOKEN}`,
                        'Notion-Version': '2022-06-28',
                      },
                    });
                    if (grandchildRes.ok) {
                      const gcData = await grandchildRes.json();
                      imageUrl = findFirstImage(gcData.results || []);
                      if (imageUrl) break;
                    }
                  } catch (_) {}
                }
              }
              if (imageUrl) break;
            }
          } catch (_) {}
        }
      }
    }

    return Response.json(
      { image_url: imageUrl, page_id: cleanId },
      { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3000' } }
    );
  } catch (e) {
    return Response.json({ error: true, message: e.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
