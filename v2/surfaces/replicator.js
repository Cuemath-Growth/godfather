// Surface 5: Brief replicator — given a winner, draft the brief inline.
// Naina rule (May 16): brief lives in the tool, no Notion export. Pure read+copy.
import { filterByMarket, filterByWindow, joinFunnel } from '../lib/data.js';
import { computeVerdict, fmt } from '../lib/verdict.js';

export async function render(container, state, args) {
  if (!state.ads) {
    container.innerHTML = '<div class="loading">Ad summary still loading…</div>';
    return;
  }

  const explicitAd = args && args[0] ? decodeURIComponent(args[0]) : null;

  // If no specific winner: show list of current winners to pick from
  if (!explicitAd) {
    return renderWinnerPicker(container, state);
  }

  const ad = state.ads.find(a => a.ad_name === explicitAd);
  if (!ad) {
    container.innerHTML = `<div class="empty">Ad not found in summary. <a href="#/replicator" class="btn">← Back</a></div>`;
    return;
  }

  const funnel = joinFunnel(ad, state.funnel?.byAd);
  const verdict = computeVerdict(ad, funnel);
  const brief = draftBrief(ad, funnel, verdict);

  container.innerHTML = `
    <div class="surface-header">
      <h2>Brief replicator</h2>
      <div class="desc">DNA of <strong>${escapeHtml(shortName(ad.ad_name))}</strong></div>
      <div class="surface-meta"><a class="btn small" href="#/replicator">← Pick another</a></div>
    </div>
    <div class="card">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;">
        <span class="pill ${verdict.color}">${verdict.label}</span>
        <span class="small muted">${ad.market} · ${ad.format_guess} · ${funnel.td || 0} TDs · ₹${fmt(funnel.td > 0 ? +ad.total_spend / funnel.td : 0)} CPTD</span>
        <button id="copyBriefBtn" class="btn primary small" style="margin-left:auto;">Copy brief</button>
      </div>
      <pre id="briefText" style="background:var(--surface-2);padding:16px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;border:1px solid var(--border);">${escapeHtml(brief)}</pre>
    </div>
    <div class="small muted" style="margin-top:8px;">
      This brief is the DNA of one winner. Hand it to a creator and ask for a NEW concept that hits the same hook frame + master frame + pain + format. Don't rewrite the literal hook line — the creator's job is to find a fresh execution of the same emotional pattern.
    </div>
  `;

  document.getElementById('copyBriefBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(brief).then(() => {
      const btn = document.getElementById('copyBriefBtn');
      const old = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = old; }, 1500);
    });
  });
}

function renderWinnerPicker(container, state) {
  if (!state.funnel) {
    container.innerHTML = `
      <div class="surface-header"><h2>Brief replicator</h2></div>
      <div class="empty">CRM funnel data still loading — need TD counts to identify winners. Wait or hit Refresh.</div>
    `;
    return;
  }

  let rows = filterByMarket(state.ads, state.market);
  if (state.windowDays !== 'all') rows = filterByWindow(rows, state.windowDays);

  const winners = rows.map(ad => {
    const funnel = joinFunnel(ad, state.funnel.byAd);
    const v = computeVerdict(ad, funnel);
    return { ad, funnel, v };
  }).filter(r => r.v.key === 'scale' || r.v.key === 'working')
    .sort((a, b) => {
      const aCptd = a.funnel.td > 0 ? +a.ad.total_spend / a.funnel.td : Infinity;
      const bCptd = b.funnel.td > 0 ? +b.ad.total_spend / b.funnel.td : Infinity;
      return aCptd - bCptd;
    });

  if (!winners.length) {
    container.innerHTML = `
      <div class="surface-header"><h2>Brief replicator</h2></div>
      <div class="empty">No winners in this filter. Widen the window or change market.</div>
    `;
    return;
  }

  const cards = winners.slice(0, 24).map(w => {
    const cptd = w.funnel.td > 0 ? +w.ad.total_spend / w.funnel.td : 0;
    return `
      <a class="card" href="#/replicator/${encodeURIComponent(w.ad.ad_name)}" style="display:block;text-decoration:none;color:inherit;">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <span class="pill ${w.v.color}">${w.v.label}</span>
          <span class="trust ${w.ad.tag_trust || 'untagged'}">${w.ad.tag_trust || 'untagged'}</span>
          <span class="small muted" style="margin-left:auto;">${w.ad.market} · ${w.ad.format_guess}</span>
        </div>
        <div style="font-weight:600;font-size:12px;line-height:1.3;">${escapeHtml(shortName(w.ad.ad_name))}</div>
        <div class="small muted" style="margin-top:6px;">${w.funnel.td} TDs · ₹${fmt(cptd)} CPTD · ${escapeHtml(w.ad.hook_frame || 'no hook tag')}</div>
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <div class="surface-header">
      <h2>Brief replicator</h2>
      <div class="desc">Pick a winner → I'll draft a brief that captures its DNA</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">${cards}</div>
  `;
}

function draftBrief(ad, funnel, verdict) {
  const cptd = funnel.td > 0 ? +ad.total_spend / funnel.td : 0;
  const fields = [
    ['Source ad', shortName(ad.ad_name)],
    ['Market', ad.market],
    ['Format', ad.format_guess],
    ['Result', `${funnel.td || 0} TDs at ₹${fmt(cptd)} CPTD over ${ad.days_active}d`],
    ['Verdict', `${verdict.label} — ${verdict.why}`],
  ];
  const dna = [
    ['Hook frame', ad.hook_frame || '—'],
    ['Master / theme', ad.master_frame || '—'],
    ['Pain target', ad.pain_target || '—'],
    ['Close type', ad.close_type || '—'],
    ['Specificity', ad.specificity || '—'],
    ['Production cue', ad.production_cue || '—'],
    ['Language', ad.language || '—'],
  ];
  const lines = [
    '# Brief: replicate winner DNA',
    '',
    '## Source',
    ...fields.map(([k, v]) => `- **${k}:** ${v}`),
    '',
    '## DNA to preserve',
    ...dna.map(([k, v]) => `- **${k}:** ${v}`),
    '',
    '## Reference lines from the winning creative',
  ];
  if (ad.evidence_hook) lines.push(`- **Hook line:** "${ad.evidence_hook}"`);
  if (ad.evidence_pain) lines.push(`- **Pain line:** "${ad.evidence_pain}"`);
  if (ad.evidence_close) lines.push(`- **CTA line:** "${ad.evidence_close}"`);
  lines.push('');
  lines.push('## What to ask the creator');
  lines.push('1. Build a NEW execution that hits the same hook frame + pain target.');
  lines.push('2. Keep the master/theme — change the surface details (characters, settings, examples).');
  lines.push('3. Match the format (' + (ad.format_guess === 'video' ? 'video, similar length' : 'static, similar layout density') + ').');
  lines.push('4. Same close type — do not switch from "Free-Class" to "Offer-led" or vice versa.');
  lines.push('');
  lines.push('## What to verify before shipping');
  lines.push('- Reads as a different creative — not a recolor of this one.');
  lines.push('- Stays in the market voice (' + ad.market + ').');
  lines.push('- Tagging will mark it as the same hook frame; that is intentional.');
  lines.push('');
  lines.push(`Generated by Godfather v2 · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  return lines.join('\n');
}

function shortName(name) {
  if (!name) return '';
  const parts = name.split('_');
  if (parts.length > 5) return parts.slice(-3).join('_');
  return name.length > 80 ? name.slice(0, 80) + '…' : name;
}
function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
