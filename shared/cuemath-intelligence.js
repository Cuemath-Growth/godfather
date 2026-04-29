// ─────────────────────────────────────────────────────────────────────────────
// cuemath-intelligence.js — Shared intelligence chassis for Godfather + Google.
//
// What this is:
//   The skeleton verdict-driven engine. Verdicts are registered with a contract
//   (detect/score/guardrails/action), the chassis runs them, applies guardrails,
//   ranks by priority, and emits an Action Queue.
//
// What changed in v0.2.0 (Week 2 Day 1):
//   - Supabase wire-up via cuemathIntelligence.configure({ supabaseUrl, supabaseKey })
//   - dismiss() persists to recommendation_dismissals table (localStorage stays as
//     offline fallback)
//   - not_recently_dismissed guardrail consults an in-memory cache primed from
//     Supabase, falls back to localStorage when cache hasn't loaded yet
//   - Every surfaced recommendation is logged to recommendation_log (fire-and-forget,
//     deduped within a session by verdict_id|entity_id)
//
// What changed in v0.3.0 (Week 2 Day 2):
//   - Real implementations of cohort_matured, volume_floor, historical_winner_check,
//     market_priority_check (replace skeleton stubs)
//   - _runGuardrails passes ctx.verdict so market_priority_check can read action.type
//   - Verdict-author contract: required signal fields throw at detect-time if missing,
//     surfacing wiring bugs early instead of silently passing
//
// What this is NOT (yet):
//   - Real verdict migrations (Week 2 Day 3+)
//   - 21-day outcome measurement job (Week 2 Day 2 — placeholder)
//   - "Why now?" diff engine (Week 2 Day 2)
//   - brand_defense_exception (Week 5 with Google work)
//
// Markets are silos. Severity is computed in-market. The "all markets" queue
// interleaves top-N from each market — never ranks across markets.
// See 02-skills/intelligence-chassis-spec.md.
// ─────────────────────────────────────────────────────────────────────────────

(function (global) {
  'use strict';

  const CHASSIS_VERSION = '0.3.0';
  const PARSER_VERSION = '1.0.0';

  // ─── Enum constants ─────────────────────────────────────────────────────────
  const CONFIDENCE = Object.freeze({ CONFIDENT: 'CONFIDENT', LIKELY: 'LIKELY', LOW: 'LOW' });
  const EFFORT = Object.freeze({ ONE_CLICK: '1_CLICK', FIVE_MIN: '5_MIN', INVESTIGATE: 'INVESTIGATE' });

  const _CONFIDENCE_WEIGHT = { CONFIDENT: 1.0, LIKELY: 0.7, LOW: 0.4 };
  const _EFFORT_DIVISOR = { '1_CLICK': 1.0, '5_MIN': 1.5, 'INVESTIGATE': 3.0 };

  // ─── Guardrail thresholds (markets are silos; mirror VERDICT_SPEND_FLOOR in index.html) ─
  const COHORT_MATURITY_DAYS = 14;
  const VOLUME_FLOORS_INR = Object.freeze({
    US: 15000,
    India: 3000,
    AUS: 8000,
    APAC: 8000,
    MEA: 5000,
    UK: 10000,
    EU: 10000,
    ROW: 5000,
  });
  const VOLUME_FLOOR_DEFAULT = 15000; // unknown market → conservative (US ceiling)

  // ─── Supabase config (set via configure()) ─────────────────────────────────
  let _config = { supabaseUrl: null, supabaseKey: null, userId: null };
  // In-memory cache of active dismissals: key = `${verdict_id}|${entity_id}`, val = expires_at ms (Number.MAX_SAFE_INTEGER for never_again)
  const _dismissalsCache = new Map();
  let _dismissalsCacheLoadedAt = 0;
  const _DISMISSALS_CACHE_TTL_MS = 60 * 1000; // refresh every minute
  // Per-session dedup: avoid re-logging same (verdict_id, entity_id) on every render
  const _loggedThisSession = new Set();

  function configure(opts) {
    _config = { ..._config, ...(opts || {}) };
    if (_config.supabaseUrl && _config.supabaseKey) {
      // Prime the dismissals cache once configured
      _refreshDismissalsCache().catch(e =>
        console.warn('[chassis] initial dismissals refresh failed:', e.message)
      );
    }
  }

  // ─── Verdict registry ──────────────────────────────────────────────────────
  const _verdicts = new Map();

  function registerVerdict(verdict) {
    const required = ['id', 'tool', 'detect', 'scoreSeverity', 'scoreConfidence', 'scoreEffort', 'action'];
    for (const k of required) {
      if (verdict[k] === undefined) {
        throw new Error(`registerVerdict: missing required field "${k}" on ${verdict.id || '<unnamed>'}`);
      }
    }
    if (_verdicts.has(verdict.id)) {
      console.warn(`[chassis] verdict "${verdict.id}" re-registered (overwriting)`);
    }
    verdict.guardrails = verdict.guardrails || [];
    verdict.outcomeWindow = verdict.outcomeWindow || 21;
    _verdicts.set(verdict.id, verdict);
    return verdict;
  }

  function getVerdicts(filter) {
    const all = [..._verdicts.values()];
    if (!filter) return all;
    return all.filter(v => {
      if (filter.tool && v.tool !== filter.tool) return false;
      if (filter.channel && v.channel !== filter.channel) return false;
      return true;
    });
  }

  // ─── Supabase helpers ──────────────────────────────────────────────────────
  async function _supabaseFetch(path, init) {
    if (!_config.supabaseUrl || !_config.supabaseKey) {
      throw new Error('Supabase not configured — call cuemathIntelligence.configure({ supabaseUrl, supabaseKey })');
    }
    const url = `${_config.supabaseUrl}/rest/v1/${path}`;
    const headers = {
      'apikey': _config.supabaseKey,
      'Authorization': `Bearer ${_config.supabaseKey}`,
      ...((init && init.headers) || {}),
    };
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function _refreshDismissalsCache() {
    if (!_config.supabaseUrl) return;
    try {
      const nowIso = new Date().toISOString();
      // Active = expires_at IS NULL (never_again) OR expires_at > now
      const query = `select=verdict_id,entity_id,expires_at,reason&or=(expires_at.is.null,expires_at.gt.${encodeURIComponent(nowIso)})`;
      const rows = await _supabaseFetch(`recommendation_dismissals?${query}`, { method: 'GET' });
      _dismissalsCache.clear();
      (rows || []).forEach(r => {
        const expiresMs = r.expires_at == null ? Number.MAX_SAFE_INTEGER : new Date(r.expires_at).getTime();
        const key = `${r.verdict_id}|${r.entity_id}`;
        // If multiple rows for same key, keep the longest-running dismissal
        const prev = _dismissalsCache.get(key) || 0;
        if (expiresMs > prev) _dismissalsCache.set(key, expiresMs);
      });
      _dismissalsCacheLoadedAt = Date.now();
      console.log(`[chassis] dismissals cache: ${_dismissalsCache.size} active`);
    } catch (e) {
      console.warn('[chassis] dismissals cache refresh failed:', e.message);
    }
  }

  function _maybeRefreshDismissalsCache() {
    if (Date.now() - _dismissalsCacheLoadedAt > _DISMISSALS_CACHE_TTL_MS) {
      _refreshDismissalsCache();
    }
  }

  // ─── Guardrails ─────────────────────────────────────────────────────────────
  // Each guardrail returns { passed: bool, reason?: string }.
  // Verdict-author contract (v0.3.0+): required signal fields THROW if missing,
  // surfacing wiring bugs early instead of silently passing.
  // Tests live in shared/tests/guardrails.test.js — run before editing.
  const _guardrails = {
    cohort_matured: (signal, ctx) => {
      if (signal.cohort_age_days === undefined || signal.cohort_age_days === null) {
        throw new Error(`cohort_matured: verdict ${signal.verdict_id || '<unknown>'} did not supply signal.cohort_age_days`);
      }
      const age = Number(signal.cohort_age_days);
      if (!isFinite(age) || age < 0) {
        return { passed: false, reason: `invalid cohort_age_days=${signal.cohort_age_days}` };
      }
      if (age < COHORT_MATURITY_DAYS) {
        return { passed: false, reason: `cohort ${age}d < ${COHORT_MATURITY_DAYS}d minimum` };
      }
      return { passed: true };
    },
    volume_floor: (signal, ctx) => {
      if (signal.spend === undefined || signal.spend === null) {
        throw new Error(`volume_floor: verdict ${signal.verdict_id || '<unknown>'} did not supply signal.spend`);
      }
      const spend = Number(signal.spend);
      if (!isFinite(spend) || spend < 0) {
        return { passed: false, reason: `invalid spend=${signal.spend}` };
      }
      const market = signal.market || null;
      const floor = (market && VOLUME_FLOORS_INR[market] !== undefined) ? VOLUME_FLOORS_INR[market] : VOLUME_FLOOR_DEFAULT;
      if (spend < floor) {
        return { passed: false, reason: `spend ₹${Math.round(spend)} below ${market || 'unknown-market'} floor ₹${floor}` };
      }
      return { passed: true };
    },
    not_recently_dismissed: (signal, ctx) => {
      const verdictId = signal.verdict_id || '';
      const entityId = signal.entity_id || '';
      const cacheKey = `${verdictId}|${entityId}`;
      // 1. Supabase-backed cache (authoritative when populated)
      if (_dismissalsCache.has(cacheKey)) {
        const expiresAt = _dismissalsCache.get(cacheKey);
        if (Date.now() < expiresAt) {
          return { passed: false, reason: `dismissed until ${expiresAt === Number.MAX_SAFE_INTEGER ? 'never_again' : new Date(expiresAt).toISOString()}` };
        }
      }
      // 2. localStorage fallback (offline / cache not yet loaded)
      try {
        const lsKey = `_dismiss_${verdictId}_${entityId}`;
        const expiresAt = parseInt(global.localStorage?.getItem(lsKey) || '0', 10);
        if (expiresAt && Date.now() < expiresAt) {
          return { passed: false, reason: `dismissed (localStorage) until ${new Date(expiresAt).toISOString()}` };
        }
      } catch (_) {}
      return { passed: true };
    },
    brand_defense_exception: (signal, ctx) => ({ passed: true, reason: 'skeleton — brand list lands Week 5' }),
    market_priority_check: (signal, ctx) => {
      // Only blocks US-budget-reduction recs. Other markets and non-reallocate verdicts pass.
      const actionType = ctx?.verdict?.action?.type;
      if (actionType !== 'reallocate_budget') return { passed: true };
      if (signal.market !== 'US') return { passed: true };
      if (signal.delta_inr === undefined || signal.delta_inr === null) {
        throw new Error(`market_priority_check: verdict ${signal.verdict_id || '<unknown>'} on US reallocate did not supply signal.delta_inr`);
      }
      const delta = Number(signal.delta_inr);
      if (delta < 0) {
        return { passed: false, reason: `US is the primary market — cannot reduce US spend by ₹${Math.round(-delta)}/wk (annual plan §1)` };
      }
      return { passed: true };
    },
    historical_winner_check: (signal, ctx) => {
      if (signal.was_top_tier === undefined) {
        throw new Error(`historical_winner_check: verdict ${signal.verdict_id || '<unknown>'} did not supply signal.was_top_tier`);
      }
      if (signal.was_top_tier === true) {
        return { passed: false, reason: 'entity was a Tier-1/2 winner — chassis recommends Refresh path instead' };
      }
      return { passed: true };
    },
  };

  function registerGuardrail(name, fn) {
    if (typeof fn !== 'function') throw new Error(`registerGuardrail "${name}": fn must be a function`);
    _guardrails[name] = fn;
  }

  function _runGuardrails(signal, verdict, ctx) {
    const passed = [];
    const failed = [];
    // Pass verdict in ctx so guardrails like market_priority_check can read action.type
    const guardCtx = { ...ctx, verdict };
    for (const name of (verdict.guardrails || [])) {
      const fn = _guardrails[name];
      if (!fn) {
        failed.push({ name, reason: 'guardrail not registered' });
        continue;
      }
      try {
        const result = fn({ ...signal, verdict_id: verdict.id }, guardCtx);
        if (result && result.passed) passed.push(name);
        else failed.push({ name, reason: (result && result.reason) || 'unknown' });
      } catch (e) {
        failed.push({ name, reason: `threw: ${e.message}` });
      }
    }
    return { passed, failed };
  }

  // ─── Scoring ────────────────────────────────────────────────────────────────
  function computePriority(severityScore, confidence, effort) {
    const cw = _CONFIDENCE_WEIGHT[confidence] || 0.4;
    const ed = _EFFORT_DIVISOR[effort] || 3.0;
    return (severityScore || 0) * cw / ed;
  }

  // ─── Detection loop ─────────────────────────────────────────────────────────
  function runDetection(toolName, data, context) {
    context = context || {};
    _maybeRefreshDismissalsCache();
    const t0 = performance.now();
    const verdicts = getVerdicts({ tool: toolName });
    const recommendations = [];
    let detected = 0, skipped = 0;

    for (const verdict of verdicts) {
      let signals;
      try {
        signals = verdict.detect(data, context) || [];
      } catch (e) {
        console.error(`[chassis] detect() threw on ${verdict.id}:`, e);
        continue;
      }
      if (!Array.isArray(signals)) {
        console.warn(`[chassis] ${verdict.id}.detect() did not return array`);
        continue;
      }

      for (const signal of signals) {
        detected++;
        const guardrailResult = _runGuardrails(signal, verdict, context);
        if (guardrailResult.failed.length > 0) {
          skipped++;
          continue;
        }

        let severityRaw, confidence, effort;
        try {
          severityRaw = verdict.scoreSeverity(signal);
          confidence = verdict.scoreConfidence(signal);
          effort = verdict.scoreEffort(signal);
        } catch (e) {
          console.error(`[chassis] scoring threw on ${verdict.id}:`, e);
          continue;
        }

        const priority = computePriority(severityRaw, confidence, effort);

        recommendations.push({
          verdict_id: verdict.id,
          tool: verdict.tool,
          channel: verdict.channel,
          entity_type: signal.entity_type,
          entity_id: signal.entity_id,
          market: signal.market,
          signal: signal.signal,
          why: signal.why,
          why_now: typeof verdict.whyNow === 'function' ? safeWhyNow(verdict, signal) : null,
          action: verdict.action,
          severity_raw: severityRaw,
          confidence,
          effort,
          priority,
          guardrails_passed: guardrailResult.passed,
          raw_metrics: signal.raw_metrics,
          recommended_at: new Date().toISOString(),
        });
      }
    }

    const byMarket = {};
    for (const rec of recommendations) {
      const mkt = rec.market || 'unknown';
      (byMarket[mkt] = byMarket[mkt] || []).push(rec);
    }
    for (const mkt of Object.keys(byMarket)) {
      byMarket[mkt].sort((a, b) => b.priority - a.priority);
    }

    const t1 = performance.now();
    console.log(`[chassis] runDetection(${toolName}): ${verdicts.length} verdicts → ${detected} signals → ${recommendations.length} recommendations (${skipped} skipped by guardrails) in ${Math.round(t1 - t0)}ms`);

    // Fire-and-forget log to Supabase (deduped per session)
    if (recommendations.length && _config.supabaseUrl) {
      _logSurfacedRecommendations(recommendations).catch(e =>
        console.warn('[chassis] recommendation_log insert failed:', e.message)
      );
    }

    return { byMarket, all: recommendations.sort((a, b) => b.priority - a.priority), stats: { verdicts: verdicts.length, detected, skipped, surfaced: recommendations.length } };
  }

  function safeWhyNow(verdict, signal) {
    try { return verdict.whyNow(signal) || null; }
    catch (e) { console.warn(`[chassis] whyNow() threw on ${verdict.id}:`, e.message); return null; }
  }

  // ─── Recommendation logging ────────────────────────────────────────────────
  async function _logSurfacedRecommendations(recommendations) {
    const fresh = recommendations.filter(r => {
      const key = `${r.verdict_id}|${r.entity_id}`;
      if (_loggedThisSession.has(key)) return false;
      _loggedThisSession.add(key);
      return true;
    });
    if (!fresh.length) return;
    const rows = fresh.map(r => ({
      verdict_id: r.verdict_id,
      tool: r.tool || 'godfather',
      channel: r.channel || null,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      market: r.market || null,
      signal: r.signal,
      why: r.why || null,
      why_now: r.why_now || null,
      severity_raw: r.severity_raw,
      confidence: r.confidence,
      effort: r.effort,
      priority: r.priority,
      guardrails_passed: r.guardrails_passed || [],
      raw_metrics: r.raw_metrics || null,
      chassis_version: CHASSIS_VERSION,
      parser_version: PARSER_VERSION,
    }));
    await _supabaseFetch('recommendation_log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(rows),
    });
    console.log(`[chassis] logged ${rows.length} recommendation(s) to Supabase`);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  function renderActionQueue(detectionResult, container, opts) {
    opts = opts || {};
    const market = opts.market || 'all';
    const limit = opts.limit || 10;

    const list = (market === 'all')
      ? interleaveTopNPerMarket(detectionResult.byMarket, limit)
      : (detectionResult.byMarket[market] || []).slice(0, limit);

    console.log(`[chassis] Action Queue (${market}): ${list.length} recommendations`);
    list.forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.confidence}/${rec.effort}/₹${formatINR(rec.severity_raw)}/wk] ${rec.verdict_id} → ${rec.entity_id || '?'} (${rec.market}) | ${rec.signal}`);
    });

    if (container && container.innerHTML !== undefined) {
      container.innerHTML = `<div class="text-xs text-text-muted px-3 py-2">Action Queue (${market}): ${list.length} recommendations · skeleton render</div>`;
    }

    return list;
  }

  function interleaveTopNPerMarket(byMarket, totalLimit) {
    const markets = Object.keys(byMarket);
    if (!markets.length) return [];
    const perMarketLimit = Math.max(1, Math.ceil(totalLimit / markets.length));
    const queues = markets.map(m => byMarket[m].slice(0, perMarketLimit));
    const out = [];
    while (out.length < totalLimit) {
      let added = 0;
      for (const q of queues) {
        if (q.length) { out.push(q.shift()); added++; if (out.length >= totalLimit) break; }
      }
      if (!added) break;
    }
    return out;
  }

  // ─── Dismissal store (Supabase-backed; localStorage as offline fallback) ──
  const DISMISS_DURATIONS = { snooze_24h: 24*60*60*1000, skip_7d: 7*24*60*60*1000, never_again: null };

  async function dismiss(verdictId, entityId, reason) {
    const duration = DISMISS_DURATIONS[reason];
    if (duration === undefined) {
      console.warn(`[chassis] dismiss: unknown reason "${reason}"`);
      return;
    }
    const expiresMs = duration === null ? Number.MAX_SAFE_INTEGER : (Date.now() + duration);
    const expiresIso = duration === null ? null : new Date(expiresMs).toISOString();

    // 1. Update in-memory cache immediately so guardrail picks it up on next render
    _dismissalsCache.set(`${verdictId}|${entityId}`, expiresMs);

    // 2. localStorage write (offline fallback + sync read in guardrail)
    try {
      const key = `_dismiss_${verdictId}_${entityId}`;
      global.localStorage?.setItem(key, String(expiresMs));
    } catch (_) {}

    // 3. Supabase write (fire-and-forget; localStorage already covers persistence)
    if (_config.supabaseUrl) {
      try {
        await _supabaseFetch('recommendation_dismissals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            verdict_id: verdictId,
            entity_id: entityId,
            user_id: _config.userId || null,
            reason,
            expires_at: expiresIso,
          }),
        });
        console.log(`[chassis] dismissed ${verdictId}/${entityId} reason=${reason} → Supabase`);
      } catch (e) {
        console.warn(`[chassis] Supabase dismiss failed (localStorage still active):`, e.message);
      }
    } else {
      console.log(`[chassis] dismissed ${verdictId}/${entityId} reason=${reason} → localStorage only (Supabase not configured)`);
    }
  }

  // ─── Parser version cache invalidation ─────────────────────────────────────
  function checkParserVersion(cachedVersion) {
    if (cachedVersion === PARSER_VERSION) return { valid: true };
    return { valid: false, reason: `cached=${cachedVersion} current=${PARSER_VERSION}` };
  }

  // ─── INR formatter ─────────────────────────────────────────────────────────
  function formatINR(n) {
    if (n == null || isNaN(n)) return '?';
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return Math.round(n).toString();
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  global.cuemathIntelligence = Object.freeze({
    // config
    configure,
    // verdicts
    registerVerdict, getVerdicts,
    // guardrails
    registerGuardrail,
    // detection + render
    runDetection, renderActionQueue, interleaveTopNPerMarket,
    // dismissal
    dismiss, DISMISS_DURATIONS,
    // scoring
    computePriority,
    // versioning
    CHASSIS_VERSION, PARSER_VERSION, checkParserVersion,
    // enums
    CONFIDENCE, EFFORT,
    // diagnostics
    _refreshDismissalsCache,
  });

  global.__CUEMATH_INTELLIGENCE_VERSION = CHASSIS_VERSION;
})(window);
