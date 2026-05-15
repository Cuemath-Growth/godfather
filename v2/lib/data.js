// data.js — Supabase + Google Sheets fetchers. All async. localStorage TTL cache.
// Heavy aggregation happens server-side in v2_ad_summary view; we pull pre-aggregated rows.

const SUPABASE_URL = 'https://lcixlyyzlnzeiqjdbxfh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3vFEM4zGI7Rx9z7H4cLmhw_xt6nkw4u';
const GOOGLE_API_KEY = 'AIzaSyBpsf0wJBwmNNNX_BU23bebBF1DBhm4fZM';
const CRM_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1lhgXeOPQ2OJfCxt6v4QGpZPzyMIQmE8emwqs6eCpWDs/edit';

// In-memory cache so multiple surfaces share data without re-fetching.
const cache = { adSummary: null, funnel: null, costRows: null };
const _inflight = {};

async function supabaseGet(table, query = 'select=*') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const r = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!r.ok) throw new Error(`Supabase ${table}: ${r.status}`);
  return r.json();
}

async function supabasePost(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${onConflict ? '?on_conflict=' + onConflict : ''}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: onConflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
    },
    body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
  });
  return r.ok;
}

// ── Ad summary (Surface 1, 3, 4, 5, 6) ──
// Pulls from v2_ad_summary view. ~4K rows, one per ad.
export async function loadAdSummary(force = false) {
  if (!force && cache.adSummary) return cache.adSummary;
  if (_inflight.adSummary) return _inflight.adSummary;
  _inflight.adSummary = (async () => {
    // PostgREST defaults to 1000-row pages — use Range header to get all.
    const rows = [];
    let from = 0;
    const size = 1000;
    while (true) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/v2_ad_summary?select=*&order=total_spend.desc`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${from}-${from + size - 1}`,
          'Range-Unit': 'items',
          Prefer: 'count=exact',
        },
      });
      if (!r.ok) throw new Error(`v2_ad_summary: ${r.status}`);
      const page = await r.json();
      rows.push(...page);
      if (page.length < size) break;
      from += size;
      // yield between pages so renderer can paint
      await new Promise(res => setTimeout(res, 0));
    }
    cache.adSummary = rows;
    return rows;
  })();
  try { return await _inflight.adSummary; }
  finally { _inflight.adSummary = null; }
}

// ── Google Sheets funnel data (Surface 1, 6) ──
// Pulls leads + cost from CRM sheet. Cached in localStorage with 6h TTL.
const FUNNEL_TTL_MS = 6 * 60 * 60 * 1000;

function extractSheetId(url) {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function parseSheetValues(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
}

export async function loadFunnelFromSheets(force = false) {
  if (!force) {
    if (cache.funnel) return cache.funnel;
    try {
      const ts = parseInt(localStorage.getItem('gfv2_funnel_ts') || '0');
      if (Date.now() - ts < FUNNEL_TTL_MS) {
        const cached = JSON.parse(localStorage.getItem('gfv2_funnel') || 'null');
        if (cached && cached.byAd) { cache.funnel = cached; return cached; }
      }
    } catch (_) {}
  }
  if (_inflight.funnel) return _inflight.funnel;

  _inflight.funnel = (async () => {
    const id = extractSheetId(CRM_SHEET_URL);
    if (!id) throw new Error('Invalid CRM sheet URL');
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values`;
    const [leadsRes, costRes] = await Promise.all([
      fetch(`${base}/leads!A:BW?key=${GOOGLE_API_KEY}`),
      fetch(`${base}/cost!A:O?key=${GOOGLE_API_KEY}`),
    ]);
    if (!leadsRes.ok) throw new Error(`Leads sheet ${leadsRes.status}`);
    if (!costRes.ok) throw new Error(`Cost sheet ${costRes.status}`);
    const leadsJson = await leadsRes.json();
    const costJson = await costRes.json();
    await new Promise(r => setTimeout(r, 0));
    const allLeads = parseSheetValues(leadsJson.values);
    const leads = allLeads.filter(r => (r.utm_medium || r.mx_utm_medium || '').toLowerCase() === 'meta');
    await new Promise(r => setTimeout(r, 0));
    const allCost = parseSheetValues(costJson.values);
    const costRows = allCost.filter(r => (r.medium || '').toLowerCase() === 'meta');
    cache.costRows = costRows;

    // Aggregate by ad name. utm_term carries ad name in new scheme; mx_utm_adcontent in old.
    await new Promise(r => setTimeout(r, 0));
    const byAd = {};
    leads.forEach(r => {
      const adName = (r.mx_utm_term || r.mx_utm_adcontent || '').trim();
      if (!adName || adName.length < 5) return;
      const key = adName.toLowerCase();
      if (!byAd[key]) byAd[key] = { ad_name: adName, ql: 0, tb: 0, tc: 0, td: 0, nri: 0, paid: 0, invalid: 0 };
      const e = byAd[key];
      // Field detection — Cuemath CRM has standard names
      if (parseInt(r.qls || '0', 10) > 0) e.ql++;
      if (parseInt(r.trials_sch || '0', 10) > 0) e.tb++;
      if (parseInt(r.trials_conf || '0', 10) > 0) e.tc++;
      if (parseInt(r.trials_done || '0', 10) > 0) e.td++;
      if (parseInt(r.paid || '0', 10) > 0) e.paid++;
      if (parseInt(r.invalid || '0', 10) > 0) e.invalid++;
      if ((r.country_bucket || '').toLowerCase() === 'nri') e.nri++;
    });

    const result = { byAd, leadCount: leads.length, costCount: costRows.length, fetchedAt: Date.now() };
    cache.funnel = result;
    try {
      localStorage.setItem('gfv2_funnel', JSON.stringify(result));
      localStorage.setItem('gfv2_funnel_ts', String(Date.now()));
    } catch (_) { /* storage full, skip */ }
    return result;
  })();
  try { return await _inflight.funnel; }
  finally { _inflight.funnel = null; }
}

// ── Per-ad detail: live Meta API via /api/proxy-meta ──
const META_ACCOUNTS = ['act_5215842511824318', 'act_888586384639855', 'act_925205080936963'];

async function metaApi(endpoint, params) {
  const r = await fetch('/api/proxy-meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, params }),
  });
  if (!r.ok) throw new Error(`Meta API ${endpoint}: ${r.status}`);
  return r.json();
}

export async function findAdId(adName) {
  for (const acct of META_ACCOUNTS) {
    const j = await metaApi(`${acct}/ads`, {
      fields: 'id,name',
      limit: 5,
      filtering: JSON.stringify([{ field: 'ad.name', operator: 'EQUAL', value: adName }]),
    });
    const ad = (j.data || [])[0];
    if (ad && ad.id) return { account: acct, ad_id: ad.id };
  }
  return null;
}

export async function resolveCreative(adId) {
  const j = await metaApi(adId, {
    fields: 'creative{id,thumbnail_url,asset_feed_spec{images,videos},video_id,object_type,image_url}',
  });
  return j.creative || null;
}

export async function getVideoSource(videoId) {
  const j = await metaApi(videoId, { fields: 'source' });
  return j.source || null;
}

// ── Persistence: oracle_actions (Surface 6) ──
// Schema confirmed May 16: item_id, card_type, status, note, item_name, actioned_by, actioned_at, snooze_until.
export async function logAdAction(ad_name, action, reason) {
  return supabasePost('oracle_actions', {
    item_id: 'v2:' + (ad_name || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 60) + ':' + action,
    item_name: ad_name,
    card_type: 'v2_' + action,
    status: 'done',
    note: reason || '',
    actioned_by: 'naina',
    actioned_at: new Date().toISOString(),
  }, 'item_id');
}

// ── Helpers for filters ──
export function filterByMarket(rows, market) {
  if (!market || market === 'all') return rows;
  return rows.filter(r => r.market === market);
}

export function filterByWindow(rows, days) {
  if (!days || days === 'all') return rows;
  const cutoff = new Date(Date.now() - parseInt(days, 10) * 86400000).toISOString().slice(0, 10);
  return rows.filter(r => r.last_date >= cutoff);
}

export function joinFunnel(adRow, funnelByAd) {
  if (!funnelByAd) return { ql: null, tb: null, tc: null, td: null, paid: null };
  const f = funnelByAd[(adRow.ad_name || '').toLowerCase()];
  if (!f) return { ql: 0, tb: 0, tc: 0, td: 0, paid: 0 };
  return { ql: f.ql, tb: f.tb, tc: f.tc, td: f.td, paid: f.paid, nri: f.nri };
}
