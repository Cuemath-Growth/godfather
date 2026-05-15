// verdict.js — given an ad summary row + funnel join, return verdict + action.
// Thresholds mirror v1 SENTINEL_THRESHOLDS (preserved in [[reference_market_operational_models]]).

const THRESHOLDS = {
  IND: { cptd: { green: 25000, amber: 40000 }, cpql: { green: 8000, amber: 12000 } },
  US:  { cptd: { green: 35000, amber: 50000 }, cpql: { green: 10000, amber: 15000 } },
  AU:  { cptd: { green: 35000, amber: 50000 }, cpql: { green: 10000, amber: 15000 } },
  MEA: { cptd: { green: 35000, amber: 50000 }, cpql: { green: 10000, amber: 15000 } },
  NZ:  { cptd: { green: 35000, amber: 50000 }, cpql: { green: 10000, amber: 15000 } },
  UK:  { cptd: { green: 35000, amber: 50000 }, cpql: { green: 10000, amber: 15000 } },
  ROW: { cptd: { green: 35000, amber: 50000 }, cpql: { green: 10000, amber: 15000 } },
};

const MIN_MATURE_DAYS = 14;
const SPEND_FLOOR = { IND: 5000, US: 5000, AU: 5000, MEA: 5000, NZ: 3000, UK: 3000, ROW: 5000 };

// Given an ad row from v2_ad_summary + funnel join, return verdict.
// verdict = { key, label, color, why, action, action_label }
export function computeVerdict(ad, funnel) {
  const market = ad.market || 'US';
  const t = THRESHOLDS[market] || THRESHOLDS.US;
  const floor = SPEND_FLOOR[market] || 5000;
  const spend = +ad.total_spend || 0;
  const td = funnel?.td || 0;
  const ql = funnel?.ql || 0;
  const tb = funnel?.tb || 0;
  const cptd = td > 0 ? spend / td : 0;
  const cpql = ql > 0 ? spend / ql : 0;
  const days = +ad.days_active || 0;
  const mature = days >= MIN_MATURE_DAYS;

  // Brand-awareness exclusion — campaigns that never targeted TDs
  if (/brand[_-]?awareness|awareness[_-]?traffic/i.test(ad.ad_name || '')) {
    return { key: 'brand', label: 'Brand-Awareness', color: 'too-early', why: 'Optimizing reach, not TDs', action: 'monitor', action_label: 'Monitor' };
  }

  if (spend < floor) {
    return { key: 'too-early', label: 'Too early', color: 'too-early', why: `Only ₹${fmt(spend)} spent · need ≥ ₹${fmt(floor)}`, action: 'monitor', action_label: 'Monitor' };
  }

  // Scale: 3+ TDs at green CPTD
  if (td >= 3 && cptd > 0 && cptd <= t.cptd.green) {
    return { key: 'scale', label: 'Scale', color: 'scale', why: `${td} TDs at ₹${fmt(cptd)} CPTD · below ₹${fmt(t.cptd.green)} target`, action: 'scale', action_label: 'Scale + replicate' };
  }
  // Working: 1+ TD at amber CPTD
  if (td >= 1 && cptd > 0 && cptd <= t.cptd.amber) {
    return { key: 'working', label: 'Working', color: 'working', why: `${td} TD${td > 1 ? 's' : ''} at ₹${fmt(cptd)} CPTD · in amber band`, action: 'monitor', action_label: 'Hold' };
  }
  // Kill: heavy spend, 0 TDs
  if (spend > 5 * floor && td === 0) {
    return { key: 'kill', label: 'Kill', color: 'kill', why: `₹${fmt(spend)} spent, 0 TDs · pause + reallocate`, action: 'pause', action_label: 'Pause now' };
  }
  // Funnel break: leads but no trials
  if (spend > 3 * floor && ql >= 5 && td === 0) {
    return { key: 'pause', label: 'Funnel break', color: 'pause', why: `${ql} QLs but 0 TDs · audience or scheduler issue`, action: 'pause', action_label: 'Pause + investigate' };
  }
  // Weak: small spend with weak QL
  if (spend > 2 * floor && ql <= 1 && td === 0) {
    return { key: 'pause', label: 'Weak', color: 'pause', why: `₹${fmt(spend)} spent, ${ql} QL · hook not landing`, action: 'refresh', action_label: 'Refresh hook' };
  }
  // Fatigued: was working, now declining (proxy: spent a lot, no recent TDs)
  if (mature && spend > 5 * floor && td > 0 && cptd > t.cptd.amber) {
    return { key: 'watch', label: 'Fatigued', color: 'watch', why: `${td} TDs but CPTD ₹${fmt(cptd)} > amber · refresh creative`, action: 'refresh', action_label: 'Refresh hook' };
  }
  // Promising: clicks + QLs but not mature yet
  if (ql >= 3 && td === 0 && !mature) {
    return { key: 'watch', label: 'Promising', color: 'watch', why: `${ql} QLs, cohort ${days}d (need ${MIN_MATURE_DAYS}d to judge TDs)`, action: 'monitor', action_label: 'Monitor — let cohort mature' };
  }

  return { key: 'monitor', label: 'Monitoring', color: 'monitor', why: `${days}d active · ${ql} QLs · ${td} TDs · CPTD ₹${fmt(cptd)}`, action: 'monitor', action_label: 'Monitor' };
}

export function fmt(n) {
  if (!n || isNaN(n)) return '0';
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toLocaleString('en-IN');
}

export function pct(num, den) {
  if (!den) return null;
  return (num / den) * 100;
}

export function thresholdsFor(market) {
  return THRESHOLDS[market] || THRESHOLDS.US;
}
