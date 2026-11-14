import { lookup } from 'node:dns/promises';
import {
  isPrivateAddress,
  looksLikeIp,
  publicUrlProblem,
  readPreview
} from '../../shared/shopping/preview.js';

const MAX_BYTES = 400_000;
const TIMEOUT_MS = 4500;
const MAX_HOPS = 4;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function resolvesPrivate(urlString) {
  if (publicUrlProblem(urlString)) return true;
  const host = new URL(urlString).hostname.replace(/^\[|\]$/g, '');
  if (looksLikeIp(host)) return isPrivateAddress(host);
  try {
    const records = await lookup(host, { all: true });
    if (!records.length) return true;
    return records.some((record) => isPrivateAddress(record.address));
  } catch {
    return true;
  }
}

async function readLimited(response) {
  if (!response.body?.getReader) {
    const text = await response.text();
    return text.slice(0, MAX_BYTES);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
    size += value.byteLength;
    const text = Buffer.concat(chunks).toString('utf8');
    if (size > 2048 && text.toLowerCase().includes('</head>')) {
      await reader.cancel().catch(() => {});
      return text.slice(0, MAX_BYTES);
    }
  }
  await reader.cancel().catch(() => {});
  return Buffer.concat(chunks).toString('utf8').slice(0, MAX_BYTES);
}

export async function loadPreview(rawUrl, fetchImpl = globalThis.fetch) {
  if (publicUrlProblem(rawUrl)) return { title: '', image: '' };
  let current = new URL(rawUrl).href;

  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    if (await resolvesPrivate(current)) return { title: '', image: '' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response;
    try {
      response = await fetchImpl(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
      });
    } catch {
      return { title: '', image: '' };
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) return { title: '', image: '' };
      try {
        current = new URL(location, current).href;
      } catch {
        return { title: '', image: '' };
      }
      continue;
    }

    if (!response.ok) return { title: '', image: '' };
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type.startsWith('image/')) {
      return { title: '', image: current };
    }
    if (type && !/html|xml/.test(type)) return { title: '', image: '' };
    const html = await readLimited(response);
    return readPreview(html, current);
  }

  return { title: '', image: '' };
}

export async function handlePreview(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }

  let target = '';
  try {
    target = new URL(req.url || '/', 'http://localhost').searchParams.get('url') || '';
  } catch {
    target = '';
  }

  if (publicUrlProblem(target)) {
    send(res, 400, { title: '', image: '' });
    return;
  }

  try {
    const preview = await loadPreview(target);
    send(res, 200, {
      title: preview.title || '',
      image: preview.image || ''
    });
  } catch {
    send(res, 200, { title: '', image: '' });
  }
}
