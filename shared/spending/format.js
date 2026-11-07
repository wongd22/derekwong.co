const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthTitle(month) {
  return MONTH_LABELS[month - 1] || '';
}

export function formatHkd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0 HKD';
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const cents = Math.round(abs * 100) % 100;
  const body = abs.toLocaleString('en-US', {
    minimumFractionDigits: cents === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${body} HKD`;
}

export function formatShortDate(isoOrDate) {
  if (!isoOrDate) return '';
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Hong_Kong',
    day: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const bag = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${Number(bag.day)} ${SHORT_MONTHS[Number(bag.month) - 1]}`;
}

export function formatMonthOption(year, month) {
  return `${monthTitle(month)} ${year}`;
}
