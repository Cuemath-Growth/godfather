// Surface 2: Creative detail — open any ad, see actual content + every tag.
// Pulls live from Meta API via /api/proxy-meta. The "preview panel" Naina asked for.
import { findAdId, resolveCreative, getVideoSource, joinFunnel, loadAdSummary } from '../lib/data.js';
import { computeVerdict, fmt } from '../lib/verdict.js';

export async function render(container, state, args) {
  const adName = args && args[0] ? decodeURIComponent(args[0]) : null;
  if (!adName) {
    container.innerHTML = renderPicker(state);
    wirePicker(container);
    return;
  }

  if (!state.ads) {
    container.innerHTML = '<div class="loading">Ad summary still loading…</div>';
    return;
  }

  const ad = state.ads.find(a => a.ad_name === adName);
  if (!ad) {
    container.innerHTML = `<div class="empty">Ad not found: <code>${escapeHtml(adName)}</code><br /><a href="#/detail" class="btn">← Back to picker</a></div>`;
    return;
  }

  const funnel = joinFunnel(ad, state.funnel?.byAd);
  const verdict = computeVerdict(ad, funnel);
  const trust = ad.tag_trust || 'untagged';

  container.innerHTML = `
    <div class="surface-header">
      <h2>Creative detail</h2>
      <div class="desc">${escapeHtml(adName)}</div>
      <div class="surface-meta"><a class="btn small" href="#/recent">← Back to recent</a></div>
    </div>
    <div class="card">
      <div class="card-row">
        <div id="detailAsset" style="flex:0 0 auto;">
          <div class="loading" style="width:280px;height:180px;display:flex;align-items:center;justify-content:center;">Loading creative…</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
            <span class="pill ${verdict.color}">${verdict.label}</span>
            <span class="trust ${trust}">${trust}</span>
            <span class="small muted">${ad.market} · ${ad.format_guess} · ${ad.days_active}d active</span>
          </div>
          <div class="card-grid">
            <div><div class="k">Spend</div><div class="v">₹${fmt(ad.total_spend)}</div></div>
            <div><div class="k">Trial dones (TD)</div><div class="v"><strong>${funnel.td || 0}</strong></div></div>
            <div><div class="k">QL → TB → TC</div><div class="v">${funnel.ql || 0} · ${funnel.tb || 0} · ${funnel.tc || 0}</div></div>
            <div><div class="k">CPTD</div><div class="v">${funnel.td > 0 ? '₹' + fmt(ad.total_spend / funnel.td) : '—'}</div></div>
            <div><div class="k">CTR</div><div class="v">${ad.ctr_pct}%</div></div>
            <div><div class="k">First → Last</div><div class="v small">${ad.first_date} → ${ad.last_date}</div></div>
          </div>
          <div class="small muted" style="margin-top:10px;"><strong>Why this verdict:</strong> ${escapeHtml(verdict.why)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="font-size:13px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">V3 tags <span class="trust ${trust}" style="margin-left:6px;">${trust}</span></h3>
      <div class="card-grid">
        <div><div class="k">Hook frame</div><div class="v">${escapeHtml(ad.hook_frame || '—')}</div></div>
        <div><div class="k">Master / theme</div><div class="v">${escapeHtml(ad.master_frame || '—')}</div></div>
        <div><div class="k">Pain target</div><div class="v">${escapeHtml(ad.pain_target || '—')}</div></div>
        <div><div class="k">Close type</div><div class="v">${escapeHtml(ad.close_type || '—')}</div></div>
        <div><div class="k">Specificity</div><div class="v">${escapeHtml(ad.specificity || '—')}</div></div>
        <div><div class="k">Production</div><div class="v">${escapeHtml(ad.production_cue || '—')}</div></div>
        <div><div class="k">Language</div><div class="v">${escapeHtml(ad.language || '—')}</div></div>
        <div><div class="k">Source</div><div class="v small">${escapeHtml(ad.tag_source || 'untagged')} · ${escapeHtml(ad.tag_confidence || '—')}</div></div>
      </div>
      <div style="margin-top:12px;font-size:11px;border-top:1px solid var(--border);padding-top:10px;">
        <div><span class="k">Hook line:</span> ${escapeHtml(ad.evidence_hook || '—')}</div>
        <div style="margin-top:6px;"><span class="k">Pain line:</span> ${escapeHtml(ad.evidence_pain || '—')}</div>
        <div style="margin-top:6px;"><span class="k">CTA line:</span> ${escapeHtml(ad.evidence_close || '—')}</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-top:12px;">
      <a class="btn" href="#/replicator/${encodeURIComponent(adName)}">⑤ Replicate this brief</a>
      <a class="btn" href="#/optimise">⑥ Optimise queue</a>
    </div>
  `;

  // Async load the actual creative (image / video) from Meta
  const assetEl = document.getElementById('detailAsset');
  try {
    const found = await findAdId(adName);
    if (!found) { assetEl.innerHTML = '<div class="empty" style="width:280px;">Ad not found in Meta</div>'; return; }
    const creative = await resolveCreative(found.ad_id);
    if (!creative) { assetEl.innerHTML = '<div class="empty" style="width:280px;">No creative on this ad</div>'; return; }
    const videos = creative.asset_feed_spec?.videos || [];
    const images = creative.asset_feed_spec?.images || [];
    const isVideo = videos.length > 0 || !!creative.video_id;
    if (isVideo) {
      const videoId = videos[0]?.video_id || creative.video_id;
      // Show thumbnail first
      const thumb = creative.thumbnail_url || '';
      assetEl.innerHTML = `
        ${thumb ? `<img src="${escapeAttr(thumb)}" class="preview-img" />` : '<div class="empty" style="width:280px;">No thumbnail</div>'}
        <button class="btn" id="loadVideoBtn" style="margin-top:6px;">▶ Load shipped video</button>
      `;
      document.getElementById('loadVideoBtn')?.addEventListener('click', async (e) => {
        e.target.disabled = true; e.target.textContent = '⏳ Loading…';
        try {
          const src = await getVideoSource(videoId);
          if (!src) throw new Error('No mp4 source URL');
          assetEl.innerHTML = `<video src="${escapeAttr(src)}" controls autoplay class="preview-video"></video>`;
        } catch (err) {
          e.target.disabled = false;
          e.target.textContent = '⚠ ' + (err.message || 'Failed').slice(0, 40);
        }
      });
    } else if (images.length || creative.image_url) {
      const url = creative.image_url || creative.thumbnail_url || '';
      assetEl.innerHTML = url ? `<img src="${escapeAttr(url)}" class="preview-img" />` : '<div class="empty" style="width:280px;">No image URL</div>';
    } else {
      assetEl.innerHTML = '<div class="empty" style="width:280px;">Unknown asset type</div>';
    }
  } catch (e) {
    assetEl.innerHTML = `<div class="empty" style="width:280px;">Meta API: ${escapeHtml(e.message || String(e))}</div>`;
  }
}

function renderPicker(state) {
  const ads = state.ads || [];
  const opts = ads.slice(0, 20).map(a => `<a class="nav-item" href="#/detail/${encodeURIComponent(a.ad_name)}"><span class="nav-icon">▸</span><span><strong>${escapeHtml(shortName(a.ad_name))}</strong><br /><small>${a.market} · ₹${fmt(a.total_spend)}</small></span></a>`).join('');
  return `
    <div class="surface-header">
      <h2>Creative detail</h2>
      <div class="desc">Pick an ad — or click any row from Recent performance.</div>
    </div>
    <input type="search" id="detailSearch" placeholder="Search ad name to open…" style="width:360px;margin-bottom:12px;" />
    <div id="detailHits"></div>
    <div style="margin-top:20px;">
      <div class="small muted" style="text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Top 20 by spend</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px;">${opts}</div>
    </div>
  `;
}
function wirePicker(container) {
  const inp = container.querySelector('#detailSearch');
  const hits = container.querySelector('#detailHits');
  if (!inp || !hits) return;
  inp.addEventListener('input', async () => {
    const q = inp.value.toLowerCase().trim();
    if (q.length < 3) { hits.innerHTML = ''; return; }
    const ads = await loadAdSummary(); // cached
    const matches = ads.filter(a => (a.ad_name || '').toLowerCase().includes(q)).slice(0, 20);
    hits.innerHTML = matches.map(a => `<a class="nav-item" href="#/detail/${encodeURIComponent(a.ad_name)}"><span class="nav-icon">▸</span><span><strong>${escapeHtml(shortName(a.ad_name))}</strong><br /><small>${a.market} · ₹${fmt(a.total_spend)}</small></span></a>`).join('') || '<div class="empty">No matches</div>';
  });
}

function shortName(name) {
  if (!name) return '';
  const parts = name.split('_');
  if (parts.length > 5) return parts.slice(-3).join('_');
  return name.length > 80 ? name.slice(0, 80) + '…' : name;
}
function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }
