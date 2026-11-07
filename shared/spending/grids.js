import { parseMoney, parseTimestamp } from './parse.js';

function headerMap(row) {
  return (row || []).map((cell) => String(cell || '').trim().toLowerCase());
}

function findColumn(header, names) {
  for (const name of names) {
    const index = header.indexOf(name);
    if (index !== -1) return index;
  }
  return -1;
}

function cell(row, index) {
  if (index < 0) return '';
  return row?.[index] ?? '';
}

export function parseLedgerGrid(grid, source) {
  const rows = [];
  let skipped = 0;
  if (!Array.isArray(grid) || grid.length === 0) return { rows, skipped };

  const header = headerMap(grid[0]);
  const hasHeader = header.some((item) => item.includes('timestamp') || item === 'date' || item === 'category');
  const start = hasHeader ? 1 : 0;
  const index = {
    timestamp: findColumn(header, ['timestamp', 'date']),
    category: findColumn(header, ['category']),
    amount: findColumn(header, ['amount']),
    payer: findColumn(header, ['pay by', 'payer', 'paid by']),
    remarks: findColumn(header, ['remarks', 'remark', 'note', 'notes']),
  };

  if (!hasHeader || index.timestamp < 0) index.timestamp = 0;
  if (!hasHeader || index.category < 0) index.category = 1;
  if (!hasHeader || index.amount < 0) index.amount = 2;
  if (source === 'wellOn' && index.payer < 0) index.payer = 3;
  if (index.remarks < 0) index.remarks = source === 'wellOn' ? 4 : 3;

  for (let i = start; i < grid.length; i += 1) {
    const line = grid[i] || [];
    const rawStamp = cell(line, index.timestamp);
    const rawAmount = cell(line, index.amount);
    const category = String(cell(line, index.category) || '').trim();
    const remarks = String(cell(line, index.remarks) || '').trim();
    const payer = index.payer >= 0 ? String(cell(line, index.payer) || '').trim() : '';
    const blank = [rawStamp, rawAmount, category, remarks, payer].every((value) => String(value || '').trim() === '');
    if (blank) continue;

    const at = parseTimestamp(rawStamp);
    const amount = parseMoney(rawAmount);
    if (!at || amount == null) {
      skipped += 1;
      continue;
    }

    rows.push({
      source,
      at,
      category: category || 'Uncategorized',
      amount,
      payer: payer || null,
      remarks,
    });
  }

  return { rows, skipped };
}

function looksLikeDecember(label, year) {
  const loose = String(label || '').trim().toLowerCase();
  if (!loose) return false;
  if (loose === 'dec' || loose === 'december') return true;
  if (loose === `${year}-dec` || loose === `${year}-december`) return true;
  if (loose.endsWith('-dec')) return true;
  return false;
}

/**
 * Read the Expenses `2026` tab and look for a December tax or big money cell.
 * Income in that column is ignored. A missing tab is `read: false`.
 */
export function parsePlanGrid(grid, year) {
  if (!Array.isArray(grid) || grid.length === 0) {
    return { read: false, foundHeader: false, amount: null };
  }

  let headerRow = -1;
  let decCol = -1;
  for (let r = 0; r < Math.min(grid.length, 12); r += 1) {
    const row = grid[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      if (looksLikeDecember(row[c], year)) {
        headerRow = r;
        decCol = c;
      }
    }
  }

  if (decCol < 0) return { read: true, foundHeader: false, amount: null };

  let amount = null;
  for (let r = headerRow + 1; r < grid.length; r += 1) {
    const row = grid[r] || [];
    const label = [0, 1, 2].map((i) => String(row[i] || '')).join(' ');
    if (!/tax|big money|provisional/i.test(label)) continue;
    const parsed = parseMoney(row[decCol]);
    if (parsed == null || parsed === 0) continue;
    const abs = Math.abs(parsed);
    if (amount == null || abs > amount) amount = abs;
  }

  return { read: true, foundHeader: true, amount };
}
