// main.js — entry point. Router + global state + filter wiring.
import { loadAdSummary, loadFunnelFromSheets } from './data.js';

const state = {
  market: 'US',
  windowDays: '14',
  mode: 'cohort',
  ads: null,
  funnel: null,
  ready: false,
};

const ROUTES = {
  recent:    () => import('../surfaces/recent.js'),
  detail:    () => import('../surfaces/detail.js'),
  drivers:   () => import('../surfaces/drivers.js'),
  patterns:  () => import('../surfaces/patterns.js'),
  replicator: () => import('../surfaces/replicator.js'),
  optimise:  () => import('../surfaces/optimise.js'),
};

function readUrlState() {
  const hash = location.hash.replace(/^#\/?/, '') || 'recent';
  const [route, ...rest] = hash.split('/');
  return { route, args: rest };
}

function setStatus(text, kind = '') {
  const el = document.getElementById('statusPill');
  if (!el) return;
  el.textContent = text;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

function setActiveNav(route) {
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

async function navigate() {
  const { route, args } = readUrlState();
  setActiveNav(route);
  const content = document.getElementById('content');
  if (!ROUTES[route]) {
    content.innerHTML = '<div class="empty">Unknown route</div>';
    return;
  }
  content.innerHTML = '<div class="loading">Loading surface…</div>';
  try {
    const mod = await ROUTES[route]();
    await mod.render(content, state, args);
  } catch (e) {
    console.error('[v2] surface error:', e);
    content.innerHTML = `<div class="empty">Surface failed to load.<br /><small>${escapeHtml(e.message || String(e))}</small></div>`;
  }
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function boot() {
  // Restore filter state from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('gfv2_filters') || '{}');
    if (saved.market) state.market = saved.market;
    if (saved.windowDays) state.windowDays = saved.windowDays;
    if (saved.mode) state.mode = saved.mode;
  } catch (_) {}
  document.getElementById('filterMarket').value = state.market;
  document.getElementById('filterWindow').value = state.windowDays;
  document.getElementById('filterMode').value = state.mode;

  // Filter change handlers
  const persistFilters = () => {
    try { localStorage.setItem('gfv2_filters', JSON.stringify({ market: state.market, windowDays: state.windowDays, mode: state.mode })); } catch (_) {}
  };
  document.getElementById('filterMarket').addEventListener('change', e => { state.market = e.target.value; persistFilters(); navigate(); });
  document.getElementById('filterWindow').addEventListener('change', e => { state.windowDays = e.target.value; persistFilters(); navigate(); });
  document.getElementById('filterMode').addEventListener('change', e => { state.mode = e.target.value; persistFilters(); navigate(); });

  document.getElementById('btnRefresh').addEventListener('click', async () => {
    setStatus('Refreshing…');
    try {
      await Promise.all([loadAdSummary(true), loadFunnelFromSheets(true)]);
      const [ads, funnel] = [await loadAdSummary(), await loadFunnelFromSheets()];
      state.ads = ads; state.funnel = funnel;
      setStatus(`${ads.length} ads · ${Object.keys(funnel.byAd).length} CRM joined`, 'ok');
      navigate();
    } catch (e) {
      setStatus('Refresh failed', 'err');
      console.error(e);
    }
  });

  window.addEventListener('hashchange', navigate);

  // Load core data in parallel — ad summary blocks UI, funnel arrives later
  setStatus('Loading ad summary…');
  try {
    const ads = await loadAdSummary();
    state.ads = ads;
    setStatus(`${ads.length} ads · funnel loading…`);
  } catch (e) {
    setStatus('Ad summary failed', 'err');
    console.error(e);
    return;
  }

  // Funnel fetch is background — UI can show data without it, funnel-dependent
  // surfaces will trigger their own load if needed.
  loadFunnelFromSheets()
    .then(funnel => {
      state.funnel = funnel;
      const joined = Object.keys(funnel.byAd).length;
      setStatus(`${state.ads.length} ads · ${joined} CRM joined`, 'ok');
      // Re-render current surface if it cares about funnel
      navigate();
    })
    .catch(e => {
      console.warn('[v2] funnel fetch failed:', e);
      setStatus(`${state.ads.length} ads · CRM offline`, 'err');
    });

  state.ready = true;
  navigate();
}

// Kick off on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
