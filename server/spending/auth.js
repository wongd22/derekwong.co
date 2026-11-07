import crypto from 'node:crypto';

export const SESSION_COOKIE = 'spending_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function gatePassword() {
  const value = process.env.SPENDING_GATE_PASSWORD;
  if (!value || !value.trim()) return null;
  return value;
}

function sessionSecret() {
  const dedicated = process.env.SPENDING_SESSION_SECRET;
  if (dedicated && dedicated.trim()) return dedicated;
  return gatePassword();
}

export function passwordsMatch(input, expected) {
  const left = Buffer.from(String(input));
  const right = Buffer.from(String(expected));
  if (left.length !== right.length) {
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export function signSession() {
  const secret = sessionSecret();
  const payload = {
    purpose: 'spending',
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const actual = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !crypto.timingSafeEqual(actual, wanted)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.purpose !== 'spending') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCookie(req, name) {
  const header = req.headers?.cookie || '';
  const parts = String(header).split(/;\s*/);
  for (const part of parts) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index) === name) return decodeURIComponent(part.slice(index + 1));
  }
  return null;
}

export function readSession(req) {
  return verifySessionToken(readCookie(req, SESSION_COOKIE));
}

function cookieSecure(req) {
  const proto = req.headers?.['x-forwarded-proto'];
  if (proto) return String(proto).split(',')[0].trim() === 'https';
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
}

export function sessionCookie(token, req) {
  const secure = cookieSecure(req) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie(req) {
  const secure = cookieSecure(req) ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}
