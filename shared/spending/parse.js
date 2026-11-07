const TIMEZONE = 'Asia/Hong_Kong';

export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = String(value).trim();
  if (!text || text === '-' || text === '—') return null;
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  text = text.replace(/hk\$/ig, '').replace(/\$/g, '').replace(/,/g, '').replace(/\s/g, '');
  if (text.startsWith('+')) text = text.slice(1);
  if (text.startsWith('-')) {
    negative = !negative;
    text = text.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const amount = Number(text);
  return negative ? -amount : amount;
}

function fromHongKongParts(year, month, day, hour = 0, minute = 0, second = 0) {
  const utc = Date.UTC(year, month - 1, day, hour - 8, minute, second);
  return new Date(utc);
}

function fromSerial(serial) {
  const wholeDays = Math.floor(serial);
  const fraction = serial - wholeDays;
  const epochMs = Date.UTC(1899, 11, 30);
  const ms = epochMs + wholeDays * 86400000 + Math.round(fraction * 86400000);
  return new Date(ms);
}

const MONTH_INDEX = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * Sheet timestamps are day/month/year in Hong Kong, for example 25/10/2026 11:48:49.
 * Returns a Date for that Hong Kong instant, or null when the cell is not a date.
 */
export function parseTimestamp(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 20000 || value > 80000) return null;
    return fromSerial(value);
  }
  const text = String(value).trim();
  if (!text) return null;

  const slash = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    const hour = Number(slash[4] || 0);
    const minute = Number(slash[5] || 0);
    const second = Number(slash[6] || 0);
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
      return null;
    }
    const date = fromHongKongParts(year, month, day, hour, minute, second);
    const parts = hongKongParts(date);
    if (parts.year !== year || parts.month !== month || parts.day !== day) return null;
    return date;
  }

  const iso = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (iso) {
    return fromHongKongParts(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
      Number(iso[4] || 0),
      Number(iso[5] || 0),
      Number(iso[6] || 0),
    );
  }

  const named = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (named) {
    const month = MONTH_INDEX[named[2].slice(0, 3).toLowerCase()];
    if (!month) return null;
    return fromHongKongParts(Number(named[3]), month, Number(named[1]));
  }

  return null;
}

export function hongKongParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const bag = {};
  for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}
