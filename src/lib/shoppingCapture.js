const URL_IN_TEXT = /https?:\/\/[^\s<>]+/i;
const BARE_HOST = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#]\S*)?$/i;
const FILE_EXT = new Set([
  'txt', 'md', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
  'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'zip', 'html', 'htm'
]);
const SKIP_SEGMENT = new Set([
  'dp', 'gp', 'p', 't', 'pd', 'ip', 'b', 'd', 's', 'c',
  'item', 'items', 'product', 'products', 'shop', 'store', 'stores',
  'ref', 'buy', 'www', 'index', 'home', 'category', 'categories',
  'collection', 'collections'
]);

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function clampName(name) {
  const clean = name.replace(/\s+/g, ' ').trim();
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 117).trimEnd()}…`;
}

function humanize(segment) {
  let text = safeDecode(segment).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  text = text.replace(/\.(?:html?|php|aspx|jpe?g|png|webp|gif)$/i, '').trim();
  if (!text) return '';
  if (text === text.toLowerCase()) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return text;
}

function isSkippable(segment) {
  const lower = segment.toLowerCase();
  if (SKIP_SEGMENT.has(lower)) return true;
  if (/^\d+$/.test(segment)) return true;
  if (/^(?=.*\d)[a-z0-9]{10}$/i.test(segment) && !segment.includes('-')) return true;
  if (/^[a-f0-9]{16,}$/i.test(segment)) return true;
  return false;
}

export function nameFromUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return 'Saved link';
  }

  const host = url.hostname.replace(/^www\./i, '');
  const segments = url.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => safeDecode(segment));
  const useful = segments.filter((segment) => !isSkippable(segment) && /[a-z]/i.test(segment));
  const pick = useful[useful.length - 1];

  if (pick) {
    const name = humanize(pick);
    if (name) return clampName(name);
  }

  for (const key of ['k', 'q', 'query', 'keywords', 'search']) {
    const value = url.searchParams.get(key);
    if (value && value.trim()) return clampName(humanize(value.trim()));
  }

  return host || 'Saved link';
}

function normalizeUrl(raw) {
  const trimmed = raw.trim().replace(/[),.;]+$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function looksLikeBareUrl(text) {
  if (/\s/.test(text) || text.includes('@')) return false;
  if (!BARE_HOST.test(text)) return false;
  const host = text.split(/[/:?#]/)[0];
  const tld = host.split('.').pop()?.toLowerCase();
  if (tld && FILE_EXT.has(tld) && !text.includes('/')) return false;
  return true;
}

export function parseCapture(raw) {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  const match = text.match(URL_IN_TEXT);
  if (match) {
    const url = normalizeUrl(match[0]);
    const before = text.slice(0, match.index).trim();
    const after = text.slice(match.index + match[0].length).trim();
    const typed = before.length >= 2 ? before : after.length >= 2 ? after : '';
    return {
      name: clampName(typed.replace(/\s+/g, ' ').trim() || nameFromUrl(url)),
      url
    };
  }

  if (looksLikeBareUrl(text)) {
    const url = normalizeUrl(text);
    return { name: nameFromUrl(url), url };
  }

  return { name: clampName(text), url: '' };
}
