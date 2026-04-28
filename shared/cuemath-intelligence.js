// ─────────────────────────────────────────────────────────────────────────────
// cuemath-intelligence.js — Shared intelligence chassis for Godfather + Google.
//
// What this is:
//   The skeleton verdict-driven engine. Verdicts are registered with a contract
//   (detect/score/guardrails/action), the chassis runs them, applies guardrails,
//   ranks by priority, and emits an Action Queue.
//
// What this is NOT (yet):
//   - Outcome tracking with Supabase (Week 2 Day 1)
//   - Real verdict migrations (Week 2 Day 3+)
//   - UI tab integration (Week 1 Day 4-5)
//
// Markets are silos. Severity is computed in-market. The "all markets" queue
// interleaves top-N from each market — never ranks across markets.
// See 02-skills/intelligence-chassis-spec.md.
// ─────────────────────────────────────────────────────────────────────────────

(function (global) {
  'use strict';

  const CHASSIS_VERSION = '0.1.0';
  const PARSER_VERSION = '1.0.0';

  // ─── Enum constants ─────────────────────────────────────────────────────────
  const CONFIDENCE = Object.freeze({ CONFIDENT: 'CONFIDENT', LIKELY: 'LIKELY', LOW: 'LOW' });
  const EFFORT = Object.freeze({ ONE_CLICK: '1_CLICK', FIVE_MIN: '5_MIN', INVESTIGATE: 'INVESTIGATE' });

  const _CONFIDENCE_WEIGHT = { CONFIDENT: 1.0, LIKELY: 0.7, LOW: 0.4 };
  const _EFFORT_DIVISOR = { '1_CLICK': 1.0, '5_MIN': 1.5, 'INVESTIGATE': 3.0 };

  // ─── Verdict registry ──────────────────────────────────────────────────────
  // Map: verdict_id → verdict definition object
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
    // Defaults
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

  // ─── Guardrails ─────────────────────────────────────────────────────────────
  // Each guardrail returns { passed: bool, reason: string }.
  // Skeleton stubs always pass; real implementations land Week 2.
  const _guardrails = {
    cohort_matured: (signal, ctx) => ({ passed: true, reason: 'skeleton (Week 2)' }),
    volume_floor: (signal, ctx) => ({ passed: true, reason: 'skeleton (Week 2)' }),
    not_recently_dismissed: (signal, ctx) => {
      // localStorage-backed skeleton — Supabase migration in Week 2
      try {
        const key = `_dismiss_${signal.verdict_id || ''}_${signal.entity_id || ''}`;
        const expiresAt = parseInt(global.localStorage?.getItem(key) || '0', 10);
        if (expiresAt && Date.now() < expiresAt) {
          return { passed: false, reason: `dismissed until ${new Date(expiresAt).toISOString()}` };
        }
      } catch (_) {}
      return { passed: true };
    },
    brand_defense_exception: (signal, ctx) => ({ passed: true, reason: 'skeleton — brand list lands Week 5' }),
    market_priority_check: (signal, ctx) => ({ passed: true, reason: 'skeleton (Week 2)' }),
    historical_winner_check: (signal, ctx) => ({ passed: true, reason: 'skeleton (Week 2)' }),
  };

  function registerGuardrail(name, fn) {
    if (typeof fn !== 'function') throw new Error(`registerGuardrail "${name}": fn must be a function`);
    _guardrails[name] = fn;
  }

  function _runGuardrails(signal, verdict, ctx) {
    const passed = [];
    const failed = [];
    for (const name of (verdict.guardrails || [])) {
      const fn = _guardrails[name];
      if (!fn) {
        failed.push({ name, reason: 'guardrail not registered' });
        continue;
      }
      try {
        const result = fn({ ...signal, verdict_id: verdict.id }, ctx);
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
  // Call after data is loaded. Returns array of recommendations sorted by priority
  // within each market (markets are silos — no cross-market ranking).
  function runDetection(toolName, data, context) {
    context = context || {};
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
          // identification
          verdict_id: verdict.id,
          tool: verdict.tool,
          channel: verdict.channel,
          entity_type: signal.entity_type,
          entity_id: signal.entity_id,
          market: signal.market,
          // contract fields
          signal: signal.signal,
          why: signal.why,
          why_now: typeof verdict.whyNow === 'function' ? safeWhyNow(verdict, signal) : null,
          action: verdict.action,
          // scoring
          severity_raw: severityRaw,
          confidence,
          effort,
          priority,
          guardrails_passed: guardrailResult.passed,
          // bookkeeping
          raw_metrics: signal.raw_metrics,
          recommended_at: new Date().toISOString(),
        });
      }
    }

    // Sort by priority within market (markets are silos — never compared across)
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

    return { byMarket, all: recommendations.sort((a, b) => b.priority - a.priority), stats: { verdicts: verdicts.length, detected, skipped, surfaced: recommendations.length } };
  }

  function safeWhyNow(verdict, signal) {
    try { return verdict.whyNow(signal) || null; }
    catch (e) { console.warn(`[chassis] whyNow() threw on ${verdict.id}:`, e.message); return null; }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  // Skeleton: console + optional DOM container injection.
  // Real Action Queue UI lands Week 1 Day 4-5.
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
      // Skeleton placeholder — Day 4-5 will replace with real card UI
      container.innerHTML = `<div class="text-xs text-text-muted px-3 py-2">Action Queue (${market}): ${list.length} recommendations · skeleton render · UI lands Week 1 Day 4-5</div>`;
    }

    return list;
  }

  // ─── Top-N-per-market interleave (markets are silos) ──────────────────────
  // For "All markets" view: take top N from each market in priority order,
  // then interleave round-robin so no single market dominates the screen.
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

  // ─── Dismissal store (skeleton — localStorage; Supabase in Week 2) ─────────
  const DISMISS_DURATIONS = { snooze_24h: 24*60*60*1000, skip_7d: 7*24*60*60*1000, never_again: null };

  function dismiss(verdictId, entityId, reason) {
    const duration = DISMISS_DURATIONS[reason];
    if (duration === undefined) {
      console.warn(`[chassis] dismiss: unknown reason "${reason}"`);
      return;
    }
    try {
      const key = `_dismiss_${verdictId}_${entityId}`;
      const expiresAt = duration === null ? Number.MAX_SAFE_INTEGER : (Date.now() + duration);
      global.localStorage?.setItem(key, String(expiresAt));
      console.log(`[chassis] dismissed ${verdictId}/${entityId} reason=${reason} until=${duration === null ? 'forever' : new Date(expiresAt).toISOString()}`);
    } catch (e) {
      console.error('[chassis] dismiss failed:', e);
    }
  }

  // ─── _PARSER_VERSION cache invalidation ────────────────────────────────────
  // When a parser/format changes, bump PARSER_VERSION. Cached values stamped
  // with an older version get invalidated on next boot.
  function checkParserVersion(cachedVersion) {
    if (cachedVersion === PARSER_VERSION) return { valid: true };
    return { valid: false, reason: `cached=${cachedVersion} current=${PARSER_VERSION}` };
  }

  // ─── INR formatter (helper, since shared/cuemath-data.js doesn't export one yet) ─
  function formatINR(n) {
    if (n == null || isNaN(n)) return '?';
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return Math.round(n).toString();
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  global.cuemathIntelligence = Object.freeze({
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
  });

  global.__CUEMATH_INTELLIGENCE_VERSION = CHASSIS_VERSION;
})(window);
