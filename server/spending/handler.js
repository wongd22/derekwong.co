import { buildDashboard } from '../../shared/spending/compute.js';
import { hongKongParts } from '../../shared/spending/parse.js';
import {
  clearSessionCookie,
  gatePassword,
  passwordsMatch,
  readSession,
  sessionCookie,
  signSession,
} from './auth.js';
import { buildFixture } from './fixture.js';
import { clearLedgerCache, loadLedgers, loadServiceAccount } from './sheets.js';

const SCENARIOS = new Set(['november', 'tighten', 'stop', 'tax']);

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  if (raw.length > 20000) {
    const error = new Error('too_large');
    throw error;
  }
  return JSON.parse(raw);
}

function requestUrl(req) {
  return new URL(req.url || '/', 'http://localhost');
}

export function handleSession(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Use GET.' });
  return sendJson(res, 200, {
    ok: true,
    authenticated: Boolean(readSession(req)),
    gateConfigured: Boolean(gatePassword()),
  });
}

export async function handleLogin(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Use POST.' });
  const password = gatePassword();
  if (!password) {
    return sendJson(res, 503, {
      ok: false,
      code: 'setup',
      message: 'The gate password is not set on the server.',
    });
  }
  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: 'Could not read that request.' });
  }
  const attempt = body?.password;
  if (typeof attempt !== 'string' || attempt.length === 0 || attempt.length > 200) {
    return sendJson(res, 401, { error: 'That password does not match.' });
  }
  if (!passwordsMatch(attempt, password)) {
    return sendJson(res, 401, { error: 'That password does not match.' });
  }
  res.setHeader('Set-Cookie', sessionCookie(signSession(), req));
  return sendJson(res, 200, { ok: true });
}

export function handleLogout(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Use POST.' });
  res.setHeader('Set-Cookie', clearSessionCookie(req));
  return sendJson(res, 200, { ok: true });
}

function allowFixture(url) {
  if (process.env.VERCEL_ENV === 'production') return false;
  if (url.searchParams.get('fixture') === '1') return true;
  return process.env.SPENDING_FIXTURE === '1';
}

export async function handleSummary(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Use GET.' });
  if (!readSession(req)) return sendJson(res, 401, { error: 'Sign in required.' });

  const url = requestUrl(req);
  const hk = hongKongParts(new Date());
  let year = hk.year;
  let month = hk.month;
  const monthParam = url.searchParams.get('month');
  if (monthParam) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthParam);
    if (!match) return sendJson(res, 400, { error: 'Month must look like 2026-11.' });
    year = Number(match[1]);
    month = Number(match[2]);
    if (month < 1 || month > 12 || year < 2020 || year > 2100) {
      return sendJson(res, 400, { error: 'Month is out of range.' });
    }
    if (year * 12 + month > hk.year * 12 + hk.month) {
      return sendJson(res, 400, { error: 'That month has not started.' });
    }
  }

  const creds = safeCreds();
  const fixtureOn = allowFixture(url);
  const forceFixture = fixtureOn && url.searchParams.get('fixture') === '1';
  if (!creds && !fixtureOn) {
    return sendJson(res, 200, {
      ok: false,
      code: 'setup',
      message: 'The ledgers are not connected yet. Set the Google service account on the server. No live totals are shown.',
    });
  }

  try {
    let ledger;
    let fixture = false;
    if (fixtureOn && (!creds || forceFixture)) {
      const requested = url.searchParams.get('scenario') || 'november';
      const scenario = SCENARIOS.has(requested) ? requested : 'november';
      ledger = buildFixture({ year, month, scenario });
      fixture = true;
    } else {
      ledger = await loadLedgers(creds, {
        fresh: url.searchParams.get('fresh') === '1',
        year,
      });
    }

    const dashboard = buildDashboard({
      rows: ledger.rows,
      skipped: ledger.skipped,
      taxInfo: ledger.taxInfo,
      year,
      month,
      now: new Date(),
    });

    return sendJson(res, 200, {
      ok: true,
      fixture,
      ...dashboard,
    });
  } catch (error) {
    console.error('spending summary failed', error?.status || error?.message || 'unknown');
    return sendJson(res, 502, {
      ok: false,
      code: 'read_failed',
      message: 'The server could not read the ledgers.',
      hint: creds?.email
        ? `Share both spreadsheets with ${creds.email} as a viewer.`
        : undefined,
    });
  }
}

function safeCreds() {
  try {
    return loadServiceAccount();
  } catch (error) {
    console.error('spending credentials could not be read');
    return null;
  }
}

export async function routeSpending(req, res) {
  const url = requestUrl(req);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (path === '/api/spending/session') {
    handleSession(req, res);
    return true;
  }
  if (path === '/api/spending/login') {
    await handleLogin(req, res);
    return true;
  }
  if (path === '/api/spending/logout') {
    handleLogout(req, res);
    return true;
  }
  if (path === '/api/spending/summary') {
    await handleSummary(req, res);
    return true;
  }
  if (path.startsWith('/api/spending')) {
    sendJson(res, 404, { error: 'Not found.' });
    return true;
  }
  return false;
}

export function resetSpendingState() {
  clearLedgerCache();
}
