import crypto from 'node:crypto';
import { parseLedgerGrid, parsePlanGrid } from '../../shared/spending/grids.js';

const PERSONAL_SHEET_ID = '1svycG2C2mr6Rr7CCndBkVHG33BY2Gme49farwFbzc4I';
const WELLON_SHEET_ID = '1xxg6TsEhj69e7Y2fNxPhz47E_qstISJEwDu6Zugn7JI';
const CACHE_MS = 20000;

let cache = null;

function materialize(cached, year) {
  const personal = parseLedgerGrid(cached.personalGrid, 'personal');
  const wellOn = parseLedgerGrid(cached.wellOnGrid, 'wellOn');
  const taxInfo = cached.planGrid
    ? parsePlanGrid(cached.planGrid, year)
    : { read: false, foundHeader: false, amount: null };
  return {
    rows: [...personal.rows, ...wellOn.rows],
    skipped: personal.skipped + wellOn.skipped,
    taxInfo,
    email: cached.email,
  };
}

function normalizeKey(key) {
  let text = String(key || '').trim();
  if (
    (text.startsWith('"') && text.endsWith('"'))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1);
  }
  return text.replace(/\\n/g, '\n');
}

export function loadServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) {
    const trimmed = raw.trim();
    const text = trimmed.startsWith('{')
      ? trimmed
      : Buffer.from(trimmed, 'base64').toString('utf8');
    const parsed = JSON.parse(text);
    if (!parsed.client_email || !parsed.private_key) return null;
    return {
      email: parsed.client_email,
      key: normalizeKey(parsed.private_key),
    };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) return null;
  return { email: email.trim(), key: normalizeKey(key) };
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function fetchAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: creds.email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(creds.key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) {
    throw new Error('Google token exchange failed');
  }
  const json = await response.json();
  if (!json.access_token) throw new Error('Google token missing');
  return json.access_token;
}

async function getValues(token, spreadsheetId, range) {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
  url.searchParams.set('valueRenderOption', 'FORMATTED_VALUE');
  url.searchParams.set('dateTimeRenderOption', 'FORMATTED_STRING');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = new Error(`Sheet read failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  const body = await response.json();
  return body.values || [];
}

export async function loadLedgers(creds, { fresh = false, year = 2026 } = {}) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return materialize(cache, year);

  const token = await fetchAccessToken(creds);
  const personalGrid = await getValues(token, PERSONAL_SHEET_ID, "'Expense data'!A:D");
  const wellOnGrid = await getValues(token, WELLON_SHEET_ID, "'WellOnExpense'!A:E");
  let planGrid = null;
  try {
    planGrid = await getValues(token, PERSONAL_SHEET_ID, "'2026'!A1:Z80");
  } catch {
    planGrid = null;
  }

  cache = {
    at: Date.now(),
    personalGrid,
    wellOnGrid,
    planGrid,
    email: creds.email,
  };
  return materialize(cache, year);
}

export function clearLedgerCache() {
  cache = null;
}
