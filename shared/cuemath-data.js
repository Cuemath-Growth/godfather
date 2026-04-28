// ─────────────────────────────────────────────────────────────────────────────
// cuemath-data.js — Shared data layer for Godfather (Meta) + Google Creative Dashboard.
//
// Loaded BEFORE any inline app script in both index.html and google.html.
// All exports are attached to window so the rest of the codebase finds them as globals
// (matches existing call patterns; no module imports needed).
//
// Phase 1a (Apr 28, 2026): pure utility functions only — no state coupling.
// Subsequent phases will extract market filters, flow filters, and metric primitives.
// See 02-skills/intelligence-chassis-spec.md for the full migration plan.
// ─────────────────────────────────────────────────────────────────────────────

(function (global) {
  'use strict';

  // ── Number parsing — strips commas, dollar/percent signs, returns 0 on bad input ──
  function parseNumber(val) {
    if (!val) return 0;
    return parseFloat(String(val).replace(/[,$%]/g, '')) || 0;
  }

  // ── Safe division — returns null on divide-by-zero so callers can render "—" ──
  function safeDivide(num, den) { return den > 0 ? num / den : null; }

  // ── Google Sheet URL → spreadsheet ID ──
  function extractSheetId(url) {
    if (!url) return null;
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  }

  // ── Google Sheets API "values" array → array of row objects keyed by header ──
  function parseSheetValues(values) {
    if (!values || values.length < 2) return [];
    const headers = values[0];
    return values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
      return obj;
    });
  }

  // ── CSV text → array of row objects keyed by header. Handles quoted fields with commas/newlines. ──
  function parseCSV(text) {
    const lines = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') { if (inQuotes && text[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
      else if (ch === '\n' && !inQuotes) { lines.push(current); current = ''; }
      else current += ch;
    }
    if (current) lines.push(current);
    const splitRow = (row) => {
      const cols = []; let col = '', q = false;
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === '"') q = !q;
        else if (c === ',' && !q) { cols.push(col.trim()); col = ''; }
        else col += c;
      }
      cols.push(col.trim()); return cols;
    };
    if (!lines.length) return [];
    const headers = splitRow(lines[0]);
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = splitRow(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
      result.push(obj);
    }
    return result;
  }

  // ── PLA/Eval campaign-name detection (substring heuristic). ──
  // ⚠️ Will be deprecated in Week 4 in favor of canonical `lead_type` column from CRM.
  // Kept here for backwards-compat during chassis migration.
  function _isPLACampaignName(name) {
    const camp = (name || '').toLowerCase();
    if (camp.includes('_pla_') || camp.includes('pla_') || camp.includes('_pla ') || camp.endsWith('_pla')) return true;
    if (camp.includes('_eval_') || camp.includes('eval_') || camp.includes('_eval ') || camp.endsWith('_eval')) return true;
    return false;
  }

  // Expose as globals (matches existing call sites in index.html)
  global.parseNumber = parseNumber;
  global.safeDivide = safeDivide;
  global.extractSheetId = extractSheetId;
  global.parseSheetValues = parseSheetValues;
  global.parseCSV = parseCSV;
  global._isPLACampaignName = _isPLACampaignName;

  // Sentinel so the boot-time check in index.html can confirm shared module loaded
  global.__CUEMATH_DATA_VERSION = '1.0.0';
})(window);
