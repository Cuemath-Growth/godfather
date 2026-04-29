// Integration test: exercises real guardrails THROUGH the chassis
// (not the standalone impls in guardrails.test.js).
// Run: node shared/tests/guardrails-integration.test.js

'use strict';

global.window = global;
global.localStorage = { _s:{}, getItem(k){return this._s[k]||null}, setItem(k,v){this._s[k]=String(v)}, removeItem(k){delete this._s[k]} };
global.performance = { now: () => Date.now() };
global.fetch = async () => ({ ok: true, status: 200, text: async () => '[]' });

require('../cuemath-intelligence.js');
const ci = window.cuemathIntelligence;

console.log(`Loaded chassis v${ci.CHASSIS_VERSION}`);

let pass = 0, fail = 0;
const fails = [];
function check(name, expected, actual) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; fails.push(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); console.log(`  ✗ ${name}`); }
}

// Helper: register a verdict that emits ONE signal and uses given guardrails;
// run detection, return the resulting recommendation (or null) + skipped count.
function runWith(signal, guardrails, action) {
  // Clear previous verdict
  const id = 'test_' + Math.random().toString(36).slice(2);
  ci.registerVerdict({
    id,
    tool: 'godfather',
    detect: () => [signal],
    scoreSeverity: () => signal.severity || 100,
    scoreConfidence: () => ci.CONFIDENCE.CONFIDENT,
    scoreEffort: () => ci.EFFORT.ONE_CLICK,
    guardrails,
    action: action || { label: 'Test', type: 'pause' },
  });
  const result = ci.runDetection('godfather', {}, {});
  // Filter to only this verdict's results (since registry accumulates)
  const mine = result.all.find(r => r.verdict_id === id);
  return { surfaced: !!mine, rec: mine || null, all: result };
}

console.log('\ncohort_matured (through chassis)');
{
  // 5d cohort → guardrail fails → skipped
  const r = runWith({ entity_type: 'ad', entity_id: 'a1', market: 'US', signal: 's', cohort_age_days: 5 }, ['cohort_matured']);
  check('5d cohort skipped', false, r.surfaced);
}
{
  // 14d cohort → passes
  const r = runWith({ entity_type: 'ad', entity_id: 'a2', market: 'US', signal: 's', cohort_age_days: 14 }, ['cohort_matured']);
  check('14d cohort surfaced', true, r.surfaced);
  check('14d cohort guardrails_passed', ['cohort_matured'], r.rec.guardrails_passed);
}
{
  // missing field → guardrail throws → caught → skipped
  const r = runWith({ entity_type: 'ad', entity_id: 'a3', market: 'US', signal: 's' }, ['cohort_matured']);
  check('missing cohort_age_days surfaces nothing', false, r.surfaced);
}

console.log('\nvolume_floor (through chassis)');
{
  const r = runWith({ entity_type: 'ad', entity_id: 'a4', market: 'India', signal: 's', spend: 2000 }, ['volume_floor']);
  check('India 2K skipped', false, r.surfaced);
}
{
  const r = runWith({ entity_type: 'ad', entity_id: 'a5', market: 'India', signal: 's', spend: 5000 }, ['volume_floor']);
  check('India 5K surfaced', true, r.surfaced);
}
{
  const r = runWith({ entity_type: 'ad', entity_id: 'a6', market: 'US', signal: 's', spend: 50000 }, ['volume_floor']);
  check('US 50K surfaced', true, r.surfaced);
}

console.log('\nhistorical_winner_check (through chassis)');
{
  const r = runWith({ entity_type: 'ad', entity_id: 'a7', market: 'US', signal: 's', was_top_tier: true }, ['historical_winner_check']);
  check('top-tier blocks', false, r.surfaced);
}
{
  const r = runWith({ entity_type: 'ad', entity_id: 'a8', market: 'US', signal: 's', was_top_tier: false }, ['historical_winner_check']);
  check('not top-tier passes', true, r.surfaced);
}

console.log('\nmarket_priority_check (reads ctx.verdict — chassis must pass it)');
{
  const r = runWith(
    { entity_type: 'campaign', entity_id: 'c1', market: 'US', signal: 's', delta_inr: -50000 },
    ['market_priority_check'],
    { label: 'Reallocate', type: 'reallocate_budget' }
  );
  check('US reallocate -50K blocked', false, r.surfaced);
}
{
  const r = runWith(
    { entity_type: 'campaign', entity_id: 'c2', market: 'US', signal: 's', delta_inr: 50000 },
    ['market_priority_check'],
    { label: 'Reallocate', type: 'reallocate_budget' }
  );
  check('US reallocate +50K passes', true, r.surfaced);
}
{
  const r = runWith(
    { entity_type: 'campaign', entity_id: 'c3', market: 'India', signal: 's', delta_inr: -50000 },
    ['market_priority_check'],
    { label: 'Reallocate', type: 'reallocate_budget' }
  );
  check('India reallocate -50K passes (not US)', true, r.surfaced);
}
{
  // Pause verdict in US → not a reallocate, guardrail should pass
  const r = runWith(
    { entity_type: 'ad', entity_id: 'a9', market: 'US', signal: 's' },
    ['market_priority_check'],
    { label: 'Pause', type: 'pause' }
  );
  check('US pause passes (not reallocate)', true, r.surfaced);
}

console.log('\nMulti-guardrail composition');
{
  const r = runWith(
    { entity_type: 'ad', entity_id: 'a10', market: 'US', signal: 's', cohort_age_days: 30, spend: 50000, was_top_tier: false },
    ['cohort_matured', 'volume_floor', 'historical_winner_check']
  );
  check('all 3 guardrails pass', true, r.surfaced);
  check('all 3 names in guardrails_passed', ['cohort_matured', 'volume_floor', 'historical_winner_check'], r.rec.guardrails_passed);
}
{
  // Same signal but cohort too young → skipped despite spend OK
  const r = runWith(
    { entity_type: 'ad', entity_id: 'a11', market: 'US', signal: 's', cohort_age_days: 5, spend: 50000, was_top_tier: false },
    ['cohort_matured', 'volume_floor', 'historical_winner_check']
  );
  check('young cohort blocks even with healthy spend', false, r.surfaced);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('Failures:');
  fails.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
