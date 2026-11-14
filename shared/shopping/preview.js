const GENERIC_TITLE = /^(instagram|facebook|fb|tiktok|twitter|pinterest|youtube|log ?in|login|sign in|just a moment\.{0,3}|attention required|access denied|please wait|robot check|captcha)$/i;

const TITLE_KEYS = ['og:title', 'twitter:title'];
const IMAGE_KEYS = ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'];

export function isGenericTitle(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim();
  if (!clean) return true;
  if (/^https?:\/\//i.test(clean)) return true;
  return GENERIC_TITLE.test(clean);
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, digits) => {
      const code = Number(digits);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0*39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i'));
  if (!match) return '';
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
}

function meta(html, keys) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = (attr(tag, 'property') || attr(tag, 'name') || attr(tag, 'itemprop')).toLowerCase();
    if (!wanted.has(key)) continue;
    if (key.includes('price') || key.includes('amount') || key.includes('currency')) continue;
    const content = attr(tag, 'content').replace(/\s+/g, ' ').trim();
    if (content) return content;
  }
  return '';
}

function clampTitle(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim();
  if (!clean || isGenericTitle(clean)) return '';
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 117).trimEnd()}…`;
}

function absoluteHttp(value, base) {
  if (!value) return '';
  try {
    const url = new URL(value.trim(), base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    if (url.username || url.password) return '';
    return url.href;
  } catch {
    return '';
  }
}

export function readPreview(html, pageUrl) {
  const source = String(html || '');
  const title = clampTitle(
    meta(source, TITLE_KEYS)
    || decodeEntities((source.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '')
  );
  const image = absoluteHttp(meta(source, IMAGE_KEYS), pageUrl);
  return { title, image };
}

export function looksLikeIp(host) {
  const value = String(host || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!value) return false;
  if (value.includes(':')) return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

export function isPrivateAddress(host) {
  const value = String(host || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!value) return true;
  if (value === '::1' || value === '::') return true;
  if (value.startsWith('fe80:') || value.startsWith('fc') || value.startsWith('fd')) return true;
  if (value.startsWith('::ffff:')) return isPrivateAddress(value.slice('::ffff:'.length));

  const parts = value.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127 || a === 255) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

export function publicUrlProblem(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch {
    return 'invalid';
  }
  if (url.username || url.password) return 'invalid';
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'invalid';
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) return 'invalid';
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
  ) return 'blocked';
  if (/^\d+$/.test(host)) return 'blocked';
  if (looksLikeIp(host) && isPrivateAddress(host)) return 'blocked';
  return '';
}
