// Surface 1: Recent performance — what's live, what's the verdict per ad
import { filterByMarket, filterByWindow, joinFunnel } from '../lib/data.js';
import { computeVerdict, fmt } from '../lib/verdict.js';

export async function render(container, state) {
  if (!state.ads) {
    container.innerHTML = '<div class="loading">Ad summary still loading…</div>';
    return;
  }

  const market = state.market;
  const days = state.windowDays;
  let rows = filterByMarket(state.ads, market);
  if (days !== 'all') rows = filterByWindow(rows, days);
  rows = rows.slice().sort((a, b) => (+b.total_spend) - (+a.total_spend));

  const funnelByAd = state.funnel?.byAd || null;

  // Verdict counts for header pills
  const counts = { scale: 0, working: 0, watch: 0, pause: 0, kill: 0, monitor: 0, 'too-early': 0, brand: 0 };
  const rowsWithVerdict = rows.map(ad => {
    const funnel = joinFunnel(ad, funnelByAd);
    const v = computeVerdict(ad, funnel);
    counts[v.key] = (counts[v.key] || 0) + 1;
    return { ad, funnel, verdict: v };
  });

  const search = `<input type="search" id="recentSearch" placeholder="Search ad name…" style="margin-bottom:12px; width: 260px;" />`;

  const headerHtml = `
    <div class="surface-header">
      <h2>Recent performance</h2>
      <div class="desc">${market === 'all' ? 'All markets' : market} · ${days === 'all' ? 'all time' : 'last ' + days + 'd'} · ${rows.length} ads</div>
      <div class="surface-meta">
        ${pill('scale', counts.scale + ' Scale')}
        ${pill('working', counts.working + ' Working')}
        ${pill('watch', counts.watch + ' Watch')}
        ${pill('pause', (counts.pause + counts.kill) + ' Pause/Kill')}
      </div>
    </div>
    ${search}
    ${funnelByAd ? '' : '<div class="status err" style="margin-bottom:12px;display:inline-block;">CRM funnel not yet loaded — verdicts use Meta-only signals. Wait or click Refresh.</div>'}
  `;

  const rowsHtml = rowsWithVerdict.map(({ ad, funnel, verdict }) => {
    const cptd = funnel.td > 0 ? +ad.total_spend / funnel.td : 0;
    const trust = ad.tag_trust || 'untagged';
    return `<tr data-ad-name="${escapeAttr(ad.ad_name)}">
      <td>
        <div style="font-weight:600;line-height:1.3;">${escapeHtml(shortName(ad.ad_name))}</div>
        <div class="small muted">${ad.market} · ${ad.format_guess} · <span class="trust ${trust}">${trust}</span></div>
      </td>
      <td><span class="pill ${verdict.color}">${verdict.label}</span><div class="small muted" style="margin-top:2px;">${escapeHtml(verdict.why)}</div></td>
      <td><span class="pill ${ad.status === 'active' ? 'scale' : ad.status === 'recent' ? 'watch' : 'monitor'}">${ad.status}</span><div class="small muted">${ad.days_since_last_spend === 0 ? 'today' : ad.days_since_last_spend + 'd ago'}</div></td>
      <td class="num">₹${fmt(ad.total_spend)}</td>
      <td class="num">${funnel.ql || 0}</td>
      <td class="num">${funnel.tb || 0}</td>
      <td class="num"><strong>${funnel.td || 0}</strong></td>
      <td class="num">${cptd > 0 ? '₹' + fmt(cptd) : '<span class="dim">—</span>'}</td>
      <td>${escapeHtml(ad.hook_frame || '—')}</td>
      <td>
        <button class="btn small" data-action="open-detail" data-ad="${escapeAttr(ad.ad_name)}">View</button>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = headerHtml + `
    <table class="gf">
      <thead><tr>
        <th>Ad</th><th>Verdict</th><th>Status</th>
        <th class="num">Spend</th><th class="num">QL</th><th class="num">TB</th><th class="num">TD</th>
        <th class="num">CPTD</th><th>Hook</th><th></th>
      </tr></thead>
      <tbody id="recentBody">${rowsHtml || '<tr><td colspan="10" class="empty">No ads match this filter.</td></tr>'}</tbody>
    </table>
  `;

  // Search filter (client-side, lightweight)
  document.getElementById('recentSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('#recentBody tr').forEach(tr => {
      const adName = (tr.dataset.adName || '').toLowerCase();
      tr.style.display = (!q || adName.includes(q)) ? '' : 'none';
    });
  });

  // Open detail on row click
  container.querySelectorAll('[data-action="open-detail"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      location.hash = `#/detail/${encodeURIComponent(btn.dataset.ad)}`;
    });
  });
  container.querySelectorAll('#recentBody tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const ad = tr.dataset.adName;
      if (ad) location.hash = `#/detail/${encodeURIComponent(ad)}`;
    });
  });
}

function pill(cls, label) { return `<span class="pill ${cls}">${label}</span>`; }
function shortName(name) {
  if (!name) return '';
  // Strip the long market/account prefix segments — keep the descriptive tail
  const parts = name.split('_');
  if (parts.length > 5) return parts.slice(-3).join('_');
  return name.length > 80 ? name.slice(0, 80) + '…' : name;
}
function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }
