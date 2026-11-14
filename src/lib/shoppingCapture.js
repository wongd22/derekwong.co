import { isGenericTitle } from '../../shared/shopping/preview.js';

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

export function isPlaceholderName(name, url) {
  if (!name || !url) return false;
  if (name === 'Saved link' || name === 'Photo') return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '');
    if (name.toLowerCase() === host.toLowerCase()) return true;
  } catch {
    return false;
  }
  return name === nameFromUrl(url);
}

function hostOf(link) {
  try {
    return new URL(link).hostname.replace(/^www\./i, '') || 'Saved link';
  } catch {
    return 'Saved link';
  }
}

function firstLink(value) {
  if (typeof value !== 'string') return '';
  return parseCapture(value)?.url || '';
}

function opaqueName(name) {
  return Boolean(name) && /^[A-Za-z0-9_-]{8,}$/.test(name) && !name.includes(' ');
}

export function captureFromShare({ title = '', text = '', url = '' } = {}) {
  const link = firstLink(url) || firstLink(text) || firstLink(title);
  const titled = typeof title === 'string' ? title.replace(/\s+/g, ' ').trim() : '';
  const body = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  const caption = link ? body.replace(link, ' ').replace(/\s+/g, ' ').trim() : body;

  let name = '';
  if (titled && titled !== link && !isGenericTitle(titled)) name = titled;
  else if (caption && !firstLink(caption) && !isGenericTitle(caption)) name = caption;
  else if (link) {
    const derived = nameFromUrl(link);
    name = opaqueName(derived) || isGenericTitle(derived) ? hostOf(link) : derived;
  } else if (titled) name = titled;
  else if (caption) name = caption;

  name = clampName(name || '');
  if (!name && !link) return null;
  return { name: name || 'Saved link', url: link };
}

export function captureFromPaste(draft, pasted) {
  const incoming = typeof pasted === 'string' ? pasted.trim() : '';
  if (!incoming) return null;
  const parsed = parseCapture(incoming);
  if (!parsed?.url) return null;

  const typed = typeof draft === 'string' ? draft.trim() : '';
  if (!typed) return parsed;
  const typedParsed = parseCapture(typed);
  if (!typedParsed?.url) return parseCapture(`${typed} ${incoming}`);
  return parsed;
}

export function captureFromDrop(draft, dropped) {
  const incoming = typeof dropped === 'string' ? dropped.trim() : '';
  if (!incoming) return null;
  const lines = incoming.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
  const text = lines[0] || incoming;
  const parsed = parseCapture(text);
  if (!parsed?.url) return null;
  return captureFromPaste(draft, text);
}

export function nameFromFile(file) {
  const raw = String(file?.name || '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw || /^(image|img|photo|picture|pasted image|capture)$/i.test(raw)) return 'Photo';
  return clampName(raw.charAt(0).toUpperCase() + raw.slice(1));
}

const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export function prepareCaptureFile(file) {
  if (!file) return { file: null, problem: '' };
  const type = file.type === 'image/jpg' ? 'image/jpeg' : (file.type || '');
  if (!ALLOWED_IMAGE.has(type)) return { file: null, problem: 'photo' };
  if (file.size > 5 * 1024 * 1024) return { file: null, problem: 'size' };
  const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1];
  const rawName = file.name && /\.[a-z0-9]+$/i.test(file.name) ? file.name : `photo.${ext}`;
  const safeName = rawName.replace(/[^\w.\-]+/g, '_');
  if (typeof File !== 'function') return { file, problem: '' };
  if (safeName === file.name && type === file.type) return { file, problem: '' };
  try {
    return { file: new File([file], safeName, { type }), problem: '' };
  } catch {
    return { file, problem: '' };
  }
}

export function shareRecordToCaptures(record) {
  const shared = captureFromShare({
    title: record?.title || '',
    text: record?.text || '',
    url: record?.url || ''
  });
  const incoming = Array.isArray(record?.files) ? record.files.filter(Boolean) : [];
  if (!shared && incoming.length === 0) return [];

  const prepared = incoming.map((file) => ({
    source: file,
    ...prepareCaptureFile(file)
  }));
  const usable = prepared.filter((entry) => entry.file);
  const problem = prepared.find((entry) => entry.problem)?.problem || '';

  if (usable.length === 0) {
    if (!shared?.name && !shared?.url) return [];
    return [{ name: shared.name, url: shared.url, file: null, problem }];
  }

  const name = shared?.name || nameFromFile(usable[0].source);
  const url = shared?.url || '';
  return [
    { name, url, file: usable[0].file, problem: '' },
    ...usable.slice(1, 4).map((entry) => ({
      name: nameFromFile(entry.source),
      url: '',
      file: entry.file,
      problem: ''
    }))
  ];
}
