// Cloudflare Pages Function — Notion page reader.
// Two modes:
//   default: returns { image_url, page_id } — first image found in page (legacy thumb path)
//   mode='blocks': returns { blocks, page_id } — full recursive block tree (Library Phase 1.5)
//
// Notion integration token stored in Cloudflare env vars, never exposed to browser.

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
    // Accept either page_id (legacy) or url (new) — extract ID from URL if given.
    let { page_id, url, mode } = body;
    if (!page_id && url) {
      // Notion URLs end with `<title>-<32hex>` or `<title>-<8-4-4-4-12 dashed>`.
      const m = String(url).match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (m) page_id = m[0];
    }

    if (!page_id) {
      return Response.json({ error: true, message: 'page_id or url required' }, { status: 400 });
    }

    // Clean page ID (remove dashes if needed, extract from URL)
    const cleanId = page_id.replace(/-/g, '');

    const notionHeaders = {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
    };

    // mode='blocks' → walk the full block tree recursively. Returns raw Notion
    // API block objects with `.children` arrays inlined for blocks where
    // has_children=true. Browser parser walks paragraphs, image/file embeds,
    // bookmarks, and rich-text links to find Drive URLs and ad-copy pairings.
    // Depth-limited to 4 levels (column_list → column → toggle → content).
    if (mode === 'blocks') {
      async function fetchTree(blockId, depth = 0) {
        if (depth > 4) return [];
        const res = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`, { headers: notionHeaders });
        if (!res.ok) return [];
        const data = await res.json();
        const results = data.results || [];
        for (const b of results) {
          if (b.has_children) {
            b.children = await fetchTree(b.id, depth + 1);
          }
        }
        return results;
      }
      try {
        const blocks = await fetchTree(cleanId, 0);
        return Response.json(
          { blocks, page_id: cleanId },
          { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3000' } }
        );
      } catch (e) {
        return Response.json(
          { error: true, message: 'block tree fetch failed: ' + e.message },
          { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // Default mode: legacy first-image-only path used by the Library thumb cache.
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${cleanId}/children?page_size=100`, {
      headers: notionHeaders,
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
            const childRes = await fetch(`https://api.notion.com/v1/blocks/${block.id}/children?page_size=50`, { headers: notionHeaders });
            if (childRes.ok) {
              const childData = await childRes.json();
              imageUrl = findFirstImage(childData.results || []);
              if (imageUrl) break;

              // Check one more level (columns inside column_list)
              for (const child of (childData.results || [])) {
                if (child.has_children) {
                  try {
                    const grandchildRes = await fetch(`https://api.notion.com/v1/blocks/${child.id}/children?page_size=50`, { headers: notionHeaders });
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
