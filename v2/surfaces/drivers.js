// Surface 3: Driver attribution — for winners, which tag values correlate with the win?
import { filterByMarket, filterByWindow, joinFunnel } from '../lib/data.js';
import { computeVerdict, fmt } from '../lib/verdict.js';

const TAG_FIELDS = [
  { key: 'hook_frame',   label: 'Hook frame' },
  { key: 'master_frame', label: 'Master / theme' },
  { key: 'pain_target',  label: 'Pain target' },
  { key: 'close_type',   label: 'Close type' },
  { key: 'format_guess', label: 'Format' },
  { key: 'language',     label: 'Language' },
];

export async function render(container, state) {
  if (!state.ads) {
    container.innerHTML = '<div class="loading">Ad summary still loading…</div>';
    return;
  }
  if (!state.funnel) {
    container.innerHTML = `
      <div class="surface-header"><h2>Driver attribution</h2></div>
      <div class="empty">CRM funnel data still loading. Driver attribution needs TD counts. Wait or hit Refresh.</div>
    `;
    return;
  }

  const market = state.market;
  const days = state.windowDays;
  let rows = filterByMarket(state.ads, market);
  if (days !== 'all') rows = filterByWindow(rows, days);

  // Compute verdict for each row, keep winners (scale + working)
  const all = rows.map(ad => {
    const funnel = joinFunnel(ad, state.funnel.byAd);
    const v = computeVerdict(ad, funnel);
    return { ad, funnel, v };
  });
  const winners = all.filter(r => r.v.key === 'scale' || r.v.key === 'working');
  const losers = all.filter(r => r.v.key === 'pause' || r.v.key === 'kill');

  if (winners.length === 0) {
    container.innerHTML = `
      <div class="surface-header"><h2>Driver attribution</h2><div class="desc">${market} · last ${days}d</div></div>
      <div class="empty">No winners in this filter. Widen the window or pick a different market.</div>
    `;
    return;
  }

  // For each tag field, rank values by winner share (and contrast vs loser share)
  const sections = TAG_FIELDS.map(field => {
    const winCounts = countBy(winners, r => r.ad[field.key]);
    const loseCounts = countBy(losers, r => r.ad[field.key]);
    const winTotal = winners.length;
    const loseTotal = losers.length || 1;
    const allValues = new Set([...Object.keys(winCounts), ...Object.keys(loseCounts)]);
    const ranked = [...allValues].filter(v => v && v !== 'null' && v !== '—').map(value => {
      const winN = winCounts[value] || 0;
      const loseN = loseCounts[value] || 0;
      const winRate = winN / winTotal;
      const loseRate = loseN / loseTotal;
      const lift = winRate - loseRate;
      return { value, winN, loseN, winRate, loseRate, lift };
    }).filter(x => x.winN > 0).sort((a, b) => b.lift - a.lift);

    if (!ranked.length) return '';

    const rowsHtml = ranked.slice(0, 8).map(r => {
      const liftClass = r.lift > 0.1 ? 'good' : r.lift > 0.02 ? 'mid' : r.lift < -0.05 ? 'bad' : 'empty';
      const liftPct = Math.round(r.lift * 100);
      return `<tr>
        <td>${escapeHtml(r.value)}</td>
        <td class="num">${r.winN} (${Math.round(r.winRate * 100)}%)</td>
        <td class="num">${r.loseN} (${Math.round(r.loseRate * 100)}%)</td>
        <td class="num cell ${liftClass}" style="font-weight:600;">${liftPct > 0 ? '+' : ''}${liftPct}%</td>
      </tr>`;
    }).join('');

    return `
      <div class="card">
        <h3 style="font-size:13px;margin-bottom:10px;">${field.label}</h3>
        <table class="gf">
          <thead><tr><th>Value</th><th class="num">In winners</th><th class="num">In losers</th><th class="num">Lift</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }).filter(Boolean).join('');

  container.innerHTML = `
    <div class="surface-header">
      <h2>Driver attribution</h2>
      <div class="desc">${market === 'all' ? 'All markets' : market} · last ${days === 'all' ? 'all-time' : days + 'd'} · ${winners.length} winners vs ${losers.length} losers</div>
    </div>
    <div class="small muted" style="margin-bottom:12px;">
      Lift = winners' share with this tag value MINUS losers' share. Positive lift = element correlated with winning.
      Counts ≤ 3 are noisy — treat as suggestive, not conclusive.
    </div>
    ${sections}
  `;
}

function countBy(list, fn) {
  const out = {};
  for (const item of list) {
    const k = fn(item);
    if (!k) continue;
    // pain_target can be multi-value comma-separated
    String(k).split(',').map(s => s.trim()).filter(Boolean).forEach(v => {
      out[v] = (out[v] || 0) + 1;
    });
  }
  return out;
}

function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
