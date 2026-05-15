// Surface 6: Optimise queue — pause / refresh / kill / monitor with one-click action.
// Filters Recent down to ads that need ACTION. Persists clicks to oracle_actions.
import { filterByMarket, filterByWindow, joinFunnel, logAdAction } from '../lib/data.js';
import { computeVerdict, fmt } from '../lib/verdict.js';

const ACTION_BUCKETS = [
  { key: 'pause',   label: '🛑 Pause now',     filter: v => v.action === 'pause' },
  { key: 'refresh', label: '🔁 Refresh hook',   filter: v => v.action === 'refresh' },
  { key: 'scale',   label: '🚀 Scale + replicate', filter: v => v.action === 'scale' },
  { key: 'monitor', label: '👁 Monitor',         filter: v => v.action === 'monitor' && v.key !== 'too-early' && v.key !== 'brand' },
];

export async function render(container, state) {
  if (!state.ads) {
    container.innerHTML = '<div class="loading">Ad summary still loading…</div>';
    return;
  }
  if (!state.funnel) {
    container.innerHTML = `
      <div class="surface-header"><h2>Optimise queue</h2></div>
      <div class="empty">CRM funnel data still loading. Optimise queue needs TD counts. Wait or hit Refresh.</div>
    `;
    return;
  }

  let rows = filterByMarket(state.ads, state.market);
  if (state.windowDays !== 'all') rows = filterByWindow(rows, state.windowDays);

  const enriched = rows.map(ad => {
    const funnel = joinFunnel(ad, state.funnel.byAd);
    const v = computeVerdict(ad, funnel);
    return { ad, funnel, v };
  });

  // Group by recommended action
  const groups = ACTION_BUCKETS.map(b => ({
    ...b,
    items: enriched.filter(r => b.filter(r.v))
      .sort((a, b2) => (+b2.ad.total_spend) - (+a.ad.total_spend)),
  })).filter(g => g.items.length);

  if (!groups.length) {
    container.innerHTML = `
      <div class="surface-header"><h2>Optimise queue</h2></div>
      <div class="empty">No ads need action in this filter.</div>
    `;
    return;
  }

  const sections = groups.map(g => `
    <div style="margin-bottom:24px;">
      <h3 style="font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
        ${g.label}
        <span class="small muted" style="font-weight:normal;">${g.items.length} ads</span>
      </h3>
      <table class="gf">
        <thead><tr>
          <th>Ad</th><th>Why</th>
          <th class="num">Spend</th><th class="num">TD</th><th class="num">CPTD</th>
          <th>Action</th>
        </tr></thead>
        <tbody>${g.items.slice(0, 20).map(r => renderRow(r, g.key)).join('')}</tbody>
      </table>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="surface-header">
      <h2>Optimise queue</h2>
      <div class="desc">${state.market === 'all' ? 'All markets' : state.market} · last ${state.windowDays === 'all' ? 'all-time' : state.windowDays + 'd'}</div>
      <div class="surface-meta">${groups.map(g => `<span class="pill ${g.key === 'pause' ? 'pause' : g.key === 'scale' ? 'scale' : g.key === 'refresh' ? 'watch' : 'monitor'}">${g.items.length} ${g.key}</span>`).join(' ')}</div>
    </div>
    ${sections}
  `;

  // Wire action buttons
  container.querySelectorAll('[data-action-btn]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const adName = btn.dataset.ad;
      const action = btn.dataset.action;
      const reason = btn.dataset.reason || '';
      btn.disabled = true;
      btn.textContent = '⏳ Logging…';
      const ok = await logAdAction(adName, action, reason);
      if (ok) {
        btn.textContent = '✓ Logged';
        btn.classList.add('primary');
        setTimeout(() => { btn.closest('tr').style.opacity = '0.4'; }, 300);
      } else {
        btn.disabled = false;
        btn.textContent = '⚠ Retry';
        btn.classList.add('danger');
      }
    });
  });
  container.querySelectorAll('tbody tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const ad = tr.dataset.adName;
      if (ad) location.hash = `#/detail/${encodeURIComponent(ad)}`;
    });
  });
}

function renderRow({ ad, funnel, v }, bucketKey) {
  const cptd = funnel.td > 0 ? +ad.total_spend / funnel.td : 0;
  const actionBtnClass = bucketKey === 'pause' ? 'danger' : bucketKey === 'scale' ? 'primary' : '';
  return `<tr data-ad-name="${escapeAttr(ad.ad_name)}">
    <td>
      <div style="font-weight:600;line-height:1.3;">${escapeHtml(shortName(ad.ad_name))}</div>
      <div class="small muted">${ad.market} · ${ad.format_guess}</div>
    </td>
    <td><span class="pill ${v.color}">${v.label}</span><div class="small muted" style="margin-top:2px;">${escapeHtml(v.why)}</div></td>
    <td class="num">₹${fmt(ad.total_spend)}</td>
    <td class="num"><strong>${funnel.td || 0}</strong></td>
    <td class="num">${cptd > 0 ? '₹' + fmt(cptd) : '<span class="dim">—</span>'}</td>
    <td><button class="btn small ${actionBtnClass}" data-action-btn data-action="${escapeAttr(v.action)}" data-ad="${escapeAttr(ad.ad_name)}" data-reason="${escapeAttr(v.why)}">${escapeHtml(v.action_label)}</button></td>
  </tr>`;
}

function shortName(name) {
  if (!name) return '';
  const parts = name.split('_');
  if (parts.length > 5) return parts.slice(-3).join('_');
  return name.length > 80 ? name.slice(0, 80) + '…' : name;
}
function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }
