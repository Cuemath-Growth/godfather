// Guardrail unit tests — Week 2 Day 2 chassis-real-guardrails branch
// Run: node shared/tests/guardrails.test.js
// Tests are written BEFORE implementation. Implementation lives in
// shared/cuemath-intelligence.js once these pass.
//
// Guardrail contract: fn(signal, ctx) → { passed: bool, reason?: string }
// Throws if a required signal field is missing — surfaces verdict-author bugs early.

'use strict';

// ── Per-market volume floors. Mirror the values used by the unified verdict
// in index.html (search: VERDICT_SPEND_FLOOR / VOLUME_FLOORS). Markets are silos.
const VOLUME_FLOORS_INR = {
  US: 15000,
  India: 3000,
  AUS: 8000,
  APAC: 8000,
  MEA: 5000,
  UK: 10000,
  EU: 10000,
  ROW: 5000,
};
const VOLUME_FLOOR_DEFAULT = 15000; // unknown market → conservative (US ceiling)

const COHORT_MATURITY_DAYS = 14;

// ── Implementations under test ──────────────────────────────────────────────
function cohort_matured(signal, ctx) {
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
}

function volume_floor(signal, ctx) {
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
}

function historical_winner_check(signal, ctx) {
  if (signal.was_top_tier === undefined) {
    throw new Error(`historical_winner_check: verdict ${signal.verdict_id || '<unknown>'} did not supply signal.was_top_tier`);
  }
  if (signal.was_top_tier === true) {
    return { passed: false, reason: 'entity was a Tier-1/2 winner — chassis recommends Refresh path instead' };
  }
  return { passed: true };
}

function market_priority_check(signal, ctx) {
  // Only blocks US-budget-reduction recs. Other markets and non-reallocate verdicts pass through.
  // Reads action type from ctx.verdict (chassis _runGuardrails will be updated to pass verdict in ctx).
  const actionType = ctx?.verdict?.action?.type;
  if (actionType !== 'reallocate_budget') return { passed: true };
  if (signal.market !== 'US') return { passed: true };
  // For US reallocate: block if the action would reduce US spend
  if (signal.delta_inr === undefined || signal.delta_inr === null) {
    throw new Error(`market_priority_check: verdict ${signal.verdict_id || '<unknown>'} on US reallocate did not supply signal.delta_inr`);
  }
  const delta = Number(signal.delta_inr);
  if (delta < 0) {
    return { passed: false, reason: `US is the primary market — cannot reduce US spend by ₹${Math.round(-delta)}/wk (annual plan §1)` };
  }
  return { passed: true };
}

// ── Tiny test runner ────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];

function assert(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      failures.push(`${name}: ${result}`);
      console.log(`  ✗ ${name}: ${result}`);
    }
  } catch (e) {
    failed++;
    failures.push(`${name}: threw ${e.message}`);
    console.log(`  ✗ ${name}: threw ${e.message}`);
  }
}

function eq(actual, expected, label) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return true;
  return `${label || 'expected'} ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
}

function throws(fn, msgFragment) {
  try { fn(); return `expected throw, got return`; }
  catch (e) { return msgFragment && !e.message.includes(msgFragment) ? `expected throw containing "${msgFragment}", got "${e.message}"` : true; }
}

// ── Tests ──────────────────────────────────────────────────────────────────
console.log('\ncohort_matured');
assert('5d cohort fails', () => eq(cohort_matured({ cohort_age_days: 5 }), { passed: false, reason: 'cohort 5d < 14d minimum' }));
assert('exactly 14d cohort passes', () => eq(cohort_matured({ cohort_age_days: 14 }), { passed: true }));
assert('30d cohort passes', () => eq(cohort_matured({ cohort_age_days: 30 }), { passed: true }));
assert('0d cohort fails', () => eq(cohort_matured({ cohort_age_days: 0 }), { passed: false, reason: 'cohort 0d < 14d minimum' }));
assert('negative age returns invalid', () => eq(cohort_matured({ cohort_age_days: -3 }), { passed: false, reason: 'invalid cohort_age_days=-3' }));
assert('missing field throws', () => throws(() => cohort_matured({}), 'did not supply signal.cohort_age_days'));
assert('null field throws', () => throws(() => cohort_matured({ cohort_age_days: null }), 'did not supply signal.cohort_age_days'));

console.log('\nvolume_floor');
assert('US 10K below floor', () => eq(volume_floor({ market: 'US', spend: 10000 }), { passed: false, reason: 'spend ₹10000 below US floor ₹15000' }));
assert('US 15K at floor passes', () => eq(volume_floor({ market: 'US', spend: 15000 }), { passed: true }));
assert('US 50K above floor passes', () => eq(volume_floor({ market: 'US', spend: 50000 }), { passed: true }));
assert('India 2K below floor', () => eq(volume_floor({ market: 'India', spend: 2000 }), { passed: false, reason: 'spend ₹2000 below India floor ₹3000' }));
assert('India 5K above floor', () => eq(volume_floor({ market: 'India', spend: 5000 }), { passed: true }));
assert('MEA 4K below floor', () => eq(volume_floor({ market: 'MEA', spend: 4000 }), { passed: false, reason: 'spend ₹4000 below MEA floor ₹5000' }));
assert('unknown market falls back to 15K floor (10K fails)', () => eq(volume_floor({ market: 'Mars', spend: 10000 }), { passed: false, reason: 'spend ₹10000 below Mars floor ₹15000' }));
assert('null market falls back to 15K floor (15K passes)', () => eq(volume_floor({ market: null, spend: 15000 }), { passed: true }));
assert('missing spend throws', () => throws(() => volume_floor({ market: 'US' }), 'did not supply signal.spend'));
assert('negative spend invalid', () => eq(volume_floor({ market: 'US', spend: -100 }), { passed: false, reason: 'invalid spend=-100' }));

console.log('\nhistorical_winner_check');
assert('top tier blocks', () => eq(historical_winner_check({ was_top_tier: true }), { passed: false, reason: 'entity was a Tier-1/2 winner — chassis recommends Refresh path instead' }));
assert('not top tier passes', () => eq(historical_winner_check({ was_top_tier: false }), { passed: true }));
assert('missing field throws', () => throws(() => historical_winner_check({}), 'did not supply signal.was_top_tier'));

console.log('\nmarket_priority_check');
const reallocVerdict = { action: { type: 'reallocate_budget' } };
const pauseVerdict = { action: { type: 'pause' } };
assert('US reallocate -50K fails', () => eq(market_priority_check({ market: 'US', delta_inr: -50000 }, { verdict: reallocVerdict }), { passed: false, reason: 'US is the primary market — cannot reduce US spend by ₹50000/wk (annual plan §1)' }));
assert('US reallocate +50K passes', () => eq(market_priority_check({ market: 'US', delta_inr: 50000 }, { verdict: reallocVerdict }), { passed: true }));
assert('India reallocate -50K passes (not US)', () => eq(market_priority_check({ market: 'India', delta_inr: -50000 }, { verdict: reallocVerdict }), { passed: true }));
assert('US pause passes (not reallocate)', () => eq(market_priority_check({ market: 'US', delta_inr: -50000 }, { verdict: pauseVerdict }), { passed: true }));
assert('US reallocate without delta throws', () => throws(() => market_priority_check({ market: 'US' }, { verdict: reallocVerdict }), 'did not supply signal.delta_inr'));
assert('non-US reallocate without delta passes (delta not required)', () => eq(market_priority_check({ market: 'AUS', delta_inr: -1000 }, { verdict: reallocVerdict }), { passed: true }));
assert('no ctx.verdict → safe pass', () => eq(market_priority_check({ market: 'US', delta_inr: -50000 }, {}), { passed: true }));

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log('  - ' + f));
  process.exit(1);
}

// Export for chassis integration
module.exports = { cohort_matured, volume_floor, historical_winner_check, market_priority_check, VOLUME_FLOORS_INR, COHORT_MATURITY_DAYS };
