// Surface 4: Pattern matrix — what works where.
// Two matrices: (hook × market) and (format × market). Cells show avg CPTD when computable.
import { filterByWindow, joinFunnel } from '../lib/data.js';
import { computeVerdict, fmt } from '../lib/verdict.js';

const MATRIX_SPECS = [
  { rowKey: 'hook_frame', rowLabel: 'Hook frame', colKey: 'market', colLabel: 'Market' },
  { rowKey: 'format_guess', rowLabel: 'Format', colKey: 'market', colLabel: 'Market' },
  { rowKey: 'pain_target', rowLabel: 'Pain target', colKey: 'market', colLabel: 'Market' },
  { rowKey: 'master_frame', rowLabel: 'Master / theme', colKey: 'market', colLabel: 'Market' },
];

const MARKET_ORDER = ['IND', 'US', 'AU', 'MEA', 'NZ', 'UK'];

export async function render(container, state) {
  if (!state.ads) {
    container.innerHTML = '<div class="loading">Ad summary still loading…</div>';
    return;
  }
  if (!state.funnel) {
    container.innerHTML = `
      <div class="surface-header"><h2>Pattern matrix</h2></div>
      <div class="empty">CRM funnel data still loading. Patterns need TD counts to compute CPTD per cell. Wait or hit Refresh.</div>
    `;
    return;
  }

  const days = state.windowDays;
  let rows = filterByWindow(state.ads, days);
  // Compute funnel + verdict per row
  const enriched = rows.map(ad => {
    const funnel = joinFunnel(ad, state.funnel.byAd);
    const cptd = funnel.td > 0 ? +ad.total_spend / funnel.td : null;
    return { ad, funnel, cptd };
  });

  const sections = MATRIX_SPECS.map(spec => buildMatrix(enriched, spec)).join('');

  container.innerHTML = `
    <div class="surface-header">
      <h2>Pattern matrix</h2>
      <div class="desc">CPTD per cell · last ${days === 'all' ? 'all-time' : days + 'd'} · cells with &lt; 3 TDs grayed</div>
    </div>
    <div class="small muted" style="margin-bottom:14px;">
      Lower is better. <span class="trust verified">green</span> = CPTD below target. <span class="trust script-based">amber</span> = above target, below ceiling. Red = above ceiling.
      Empty cells = no ads in that combination this window.
    </div>
    ${sections}
  `;
}

function buildMatrix(rows, spec) {
  // Group by (row, col) → avg CPTD, td count, ad count
  const grid = {};
  rows.forEach(r => {
    const rowVals = String(r.ad[spec.rowKey] || '').split(',').map(s => s.trim()).filter(Boolean);
    const col = r.ad[spec.colKey] || 'ROW';
    if (!rowVals.length) return;
    rowVals.forEach(rv => {
      const key = `${rv}|||${col}`;
      if (!grid[key]) grid[key] = { rv, col, spend: 0, td: 0, ads: 0 };
      const g = grid[key];
      g.spend += +r.ad.total_spend || 0;
      g.td += r.funnel.td || 0;
      g.ads++;
    });
  });

  // Unique row + col values
  const rowVals = [...new Set(Object.values(grid).map(g => g.rv))].sort();
  const colVals = MARKET_ORDER.filter(m => Object.values(grid).some(g => g.col === m));

  if (!rowVals.length || !colVals.length) {
    return `<div class="card"><h3 style="font-size:13px;">${spec.rowLabel} × ${spec.colLabel}</h3><div class="empty">No data in this window.</div></div>`;
  }

  let html = `<div class="card"><h3 style="font-size:13px;margin-bottom:10px;">${spec.rowLabel} × ${spec.colLabel}</h3>`;
  html += '<table class="matrix"><thead><tr><th></th>';
  colVals.forEach(c => { html += `<th>${escapeHtml(c)}</th>`; });
  html += '</tr></thead><tbody>';
  rowVals.forEach(rv => {
    html += `<tr><td class="row-label">${escapeHtml(rv)}</td>`;
    colVals.forEach(c => {
      const g = grid[`${rv}|||${c}`];
      if (!g || g.td < 3) {
        html += `<td class="cell empty">${g ? '<span class="small">' + g.ads + ' ads</span>' : '—'}</td>`;
      } else {
        const cptd = g.spend / g.td;
        // Use US thresholds as default-ish ceiling for color
        const cls = cptd <= 35000 ? 'good' : cptd <= 50000 ? 'mid' : 'bad';
        html += `<td class="cell ${cls}" title="${g.ads} ads · ${g.td} TDs · ₹${fmt(g.spend)} spend">₹${fmt(cptd)}</td>`;
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
