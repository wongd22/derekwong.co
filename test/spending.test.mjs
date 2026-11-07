import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { classifyPersonal, classifyWellOn } from '../shared/spending/categories.js';
import { buildDashboard } from '../shared/spending/compute.js';
import { parseLedgerGrid, parsePlanGrid } from '../shared/spending/grids.js';
import { hongKongParts, parseTimestamp } from '../shared/spending/parse.js';
import { buildFixture } from '../server/spending/fixture.js';
import { handleLogin, handleSummary, resetSpendingState } from '../server/spending/handler.js';

const NOW = new Date('2026-11-07T04:00:00.000Z');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function copyFields(value, found = []) {
  if (typeof value === 'string') {
    found.push(value);
    return found;
  }
  if (!value || typeof value !== 'object') return found;
  for (const [key, item] of Object.entries(value)) {
    if (key === 'at' || key === 'lastLogged' || key === 'asOf' || key === 'key' || key === 'id') continue;
    copyFields(item, found);
  }
  return found;
}

function dashboardFor(rows, extra = {}) {
  return buildDashboard({
    rows,
    year: 2026,
    month: 11,
    now: NOW,
    taxInfo: { read: true, foundHeader: true, amount: 72562 },
    ...extra,
  });
}

test('parses day/month/year timestamps in Hong Kong', () => {
  const parsed = parseTimestamp('25/10/2026 11:48:49');
  const parts = hongKongParts(parsed);
  assert.equal(parts.year, 2026);
  assert.equal(parts.month, 10);
  assert.equal(parts.day, 25);
  assert.equal(parts.hour, 11);
  assert.equal(parts.minute, 48);
  assert.equal(parseTimestamp('11/05/2026 00:00:00') && hongKongParts(parseTimestamp('11/05/2026 00:00:00')).month, 5);
  assert.equal(hongKongParts(parseTimestamp('05/11/2026 09:00:00')).month, 11);
});

test('November 7 readout matches the plan rules', () => {
  const ledger = buildFixture({ year: 2026, month: 11, scenario: 'november' });
  const view = dashboardFor(ledger.rows, { taxInfo: ledger.taxInfo });

  assert.equal(view.personalSpent, 1181);
  assert.equal(view.wellOnSpent, 165);
  assert.equal(view.wellOnHalf, 82.5);
  assert.equal(view.hisSpend, 1263.5);
  assert.equal(view.everydayTarget, 12227);
  assert.equal(view.planCap, 14412);
  assert.equal(view.remainingAverage, 10963.5);
  assert.equal(view.remainingPlan, 13148.5);
  assert.equal(view.projectedMonthEnd, 5415);
  assert.equal(view.evenPaceAverage, 2852.97);
  assert.equal(view.evenPaceCap, 3362.8);
  assert.equal(view.status.code, 'on_track');
  assert.equal(view.underLogged.active, true);
  assert.equal(view.offerRoom, false);
  assert.equal(view.headline, 'Well On looks thin');
  assert.equal(view.taxMonth, false);
  assert.equal(view.lines.find((line) => line.id === 'combined').amount, 1263.5);

  const karen = view.envelopes.find((item) => item.id === 'karen');
  const special = view.envelopes.find((item) => item.id === 'special');
  const trip = view.envelopes.find((item) => item.id === 'trip');
  assert.ok(karen);
  assert.ok(trip);
  assert.equal(special.spent >= karen.spent, true);
  assert.equal(view.yearly.find((item) => item.id === 'special').state, 'over');
  assert.equal(view.yearly.find((item) => item.id === 'trip').state, 'close');
});

test('Well On is halved without splitting by payer', () => {
  const rows = [
    {
      source: 'wellOn',
      at: parseTimestamp('02/11/2026 10:00:00'),
      category: 'Grocery',
      amount: 100,
      payer: 'Karen',
      remarks: 'ParknShop',
    },
    {
      source: 'wellOn',
      at: parseTimestamp('03/11/2026 10:00:00'),
      category: 'Meal',
      amount: 100,
      payer: 'Derek',
      remarks: 'Lunch',
    },
  ];
  const view = dashboardFor(rows);
  assert.equal(view.wellOnSpent, 200);
  assert.equal(view.wellOnHalf, 100);
  assert.equal(view.hisSpend, 100);
});

test('status boundaries for tighten, stop, and discretionary overage', () => {
  const tighten = buildDashboard({
    ...buildFixture({ year: 2026, month: 11, scenario: 'tighten' }),
    year: 2026,
    month: 11,
    now: NOW,
  });
  assert.equal(tighten.status.code, 'tighten');
  assert.equal(tighten.underLogged.active, false);
  assert.equal(tighten.offerRoom, true);
  assert.ok(tighten.projectedMonthEnd > 12227 && tighten.projectedMonthEnd <= 14412);

  const stop = buildDashboard({
    ...buildFixture({ year: 2026, month: 11, scenario: 'stop' }),
    year: 2026,
    month: 11,
    now: NOW,
  });
  assert.equal(stop.status.code, 'stop');
  assert.match(stop.status.detail, /No more coffee/);

  const late = new Date('2026-11-28T04:00:00.000Z');
  const overage = dashboardFor([
    {
      source: 'personal',
      at: parseTimestamp('20/11/2026 12:00:00'),
      category: 'Meal',
      amount: 13000,
      payer: null,
      remarks: 'Dining',
    },
  ], { now: late });
  assert.equal(overage.month.day, 28);
  assert.ok(overage.projectedMonthEnd <= 14412);
  assert.equal(overage.status.code, 'stop');
  assert.equal(overage.status.overageIsDiscretionary, true);

  const familyOnly = dashboardFor([
    {
      source: 'personal',
      at: parseTimestamp('02/11/2026 12:00:00'),
      category: 'Family',
      amount: 20000,
      payer: null,
      remarks: 'Family',
    },
    {
      source: 'wellOn',
      at: parseTimestamp('06/11/2026 12:00:00'),
      category: 'Grocery',
      amount: 4000,
      payer: 'Derek',
      remarks: 'ParknShop',
    },
  ]);
  assert.equal(familyOnly.status.code, 'stop');
  assert.equal(familyOnly.status.overageIsDiscretionary, false);
  assert.match(familyOnly.status.detail, /Do not cut family/);
});

test('December tax month offers no everyday room, later Decembers do not invent tax', () => {
  const rows = [{
    source: 'personal',
    at: parseTimestamp('02/12/2026 12:00:00'),
    category: 'Meal',
    amount: 100,
    payer: null,
    remarks: 'Coffee',
  }];
  const december = buildDashboard({
    rows,
    year: 2026,
    month: 12,
    now: new Date('2026-12-02T04:00:00.000Z'),
    taxInfo: { read: true, foundHeader: true, amount: 72562 },
  });
  assert.equal(december.taxMonth, true);
  assert.equal(december.taxAmount, 72562);
  assert.equal(december.status.code, 'tax_month');
  assert.equal(december.remainingAverage, null);
  assert.equal(december.remainingPlan, null);
  assert.equal(december.offerRoom, false);

  const blankSheet = buildDashboard({
    rows,
    year: 2026,
    month: 12,
    now: new Date('2026-12-02T04:00:00.000Z'),
    taxInfo: { read: true, foundHeader: true, amount: null },
  });
  assert.equal(blankSheet.taxMonth, false);

  const unread = buildDashboard({
    rows,
    year: 2026,
    month: 12,
    now: new Date('2026-12-02T04:00:00.000Z'),
    taxInfo: { read: false, foundHeader: false, amount: null },
  });
  assert.equal(unread.taxMonth, true);
  assert.equal(unread.taxSource, 'december_2026_plan');

  const later = buildDashboard({
    rows: [{
      source: 'personal',
      at: parseTimestamp('02/12/2027 12:00:00'),
      category: 'Meal',
      amount: 100,
      payer: null,
      remarks: 'Coffee',
    }],
    year: 2027,
    month: 12,
    now: new Date('2027-12-02T04:00:00.000Z'),
    taxInfo: { read: true, foundHeader: false, amount: null },
  });
  assert.equal(later.taxMonth, false);
  assert.notEqual(later.everydayTarget, 12227);
});

test('trip stays inside the average and deposit rules stay distinct', () => {
  const withTrip = dashboardFor([{
    source: 'personal',
    at: parseTimestamp('04/11/2026 12:00:00'),
    category: 'Trip',
    amount: 3000,
    payer: null,
    remarks: 'Flights',
  }]);
  assert.equal(withTrip.hisSpend, 3000);
  assert.equal(withTrip.envelopes.find((item) => item.id === 'trip').spent, 3000);

  assert.equal(classifyWellOn('lunch deposit').role, 'discretionary');
  assert.equal(classifyWellOn('deposit').role, 'ignore');
  assert.equal(classifyWellOn('Buy house fee').role, 'ignore');
  assert.equal(classifyWellOn('差餉').role, 'fixed');
  assert.equal(classifyWellOn('Partnshop').role, 'necessary');
  assert.equal(classifyWellOn('Hkt').role, 'fixed');
  assert.equal(classifyWellOn('洗冷氣').role, 'necessary');
  assert.equal(classifyWellOn('Appliances/Furnitures').role, 'discretionary');
  assert.equal(classifyWellOn('mystery spa').role, 'unknown');
  assert.equal(classifyPersonal('Karen').role, 'protected');
  assert.equal(classifyPersonal('Clothes, shoes etc').envelope, 'special');
  assert.equal(classifyPersonal('Transportation').role, 'mixed');
});

test('sheet grids keep remarks and do not treat pay by as a split', () => {
  const personal = parseLedgerGrid([
    ['Timestamp', 'Category', 'Amount', 'Remarks'],
    ['25/10/2026 11:48:49', 'Meal', 'HK$1,234.50', 'Coffee with a note'],
    ['', '', '', ''],
  ], 'personal');
  assert.equal(personal.rows.length, 1);
  assert.equal(personal.rows[0].amount, 1234.5);
  assert.equal(personal.rows[0].remarks, 'Coffee with a note');
  assert.equal(hongKongParts(personal.rows[0].at).month, 10);

  const wellOn = parseLedgerGrid([
    ['Timestamp', 'Category', 'Amount', 'Pay by', 'Remarks'],
    ['01/11/2026 10:00:00', 'Grocery', '200', 'Karen', 'ParknShop'],
  ], 'wellOn');
  const view = dashboardFor(wellOn.rows);
  assert.equal(view.hisSpend, 100);
  assert.equal(view.recent[0].payer, 'Karen');
  assert.equal(view.recent[0].remarks, 'ParknShop');

  const plan = parsePlanGrid([
    ['Line', '2026-Jan', '2026-Nov', '2026-Dec'],
    ['Income', '77580', '77580', '77580'],
    ['Tax', '0', '0', '72562'],
  ], 2026);
  assert.equal(plan.amount, 72562);
  assert.equal(plan.foundHeader, true);
});

test('empty month reports zero instead of a broken target', () => {
  const view = dashboardFor([]);
  assert.equal(view.personalSpent, 0);
  assert.equal(view.wellOnSpent, 0);
  assert.equal(view.hisSpend, 0);
  assert.equal(view.notices.personalEmpty, true);
  assert.equal(view.notices.wellOnEmpty, true);
  assert.equal(view.underLogged.active, true);
});

test('user facing copy has no hyphen characters', () => {
  const samples = [
    dashboardFor(buildFixture({ year: 2026, month: 11 }).rows),
    buildDashboard({
      ...buildFixture({ year: 2026, month: 11, scenario: 'stop' }),
      year: 2026,
      month: 11,
      now: NOW,
    }),
    buildDashboard({
      rows: [],
      year: 2026,
      month: 12,
      now: new Date('2026-12-07T04:00:00.000Z'),
      taxInfo: { read: true, foundHeader: true, amount: 72562 },
    }),
  ];
  for (const sample of samples) {
    for (const text of copyFields(sample)) {
      assert.equal(text.includes('-'), false, text);
    }
  }
});

test('the frontend bundle sources do not contain secrets or sheet ids', () => {
  const forbidden = [
    '1svycG2C2mr6Rr7CCndBkVHG33BY2Gme49farwFbzc4I',
    '1xxg6TsEhj69e7Y2fNxPhz47E_qstISJEwDu6Zugn7JI',
    'SPENDING_GATE_PASSWORD',
    'PRIVATE KEY',
    'GOOGLE_SERVICE_ACCOUNT',
    '12227',
    '14412',
  ];
  const files = walk('src').filter((file) => /\.(jsx?|tsx?|css)$/.test(file));
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const needle of forbidden) {
    assert.equal(source.includes(needle), false, needle);
  }
});

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    end(payload) {
      this.body = payload;
      this.json = JSON.parse(payload);
    },
  };
}

test('the summary API stays closed until the gate cookie is set', async () => {
  const previous = {
    password: process.env.SPENDING_GATE_PASSWORD,
    fixture: process.env.SPENDING_FIXTURE,
    vercel: process.env.VERCEL_ENV,
    json: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  };
  process.env.SPENDING_GATE_PASSWORD = 'test-gate-secret';
  process.env.SPENDING_FIXTURE = '1';
  delete process.env.VERCEL_ENV;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  delete process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  resetSpendingState();

  try {
    const closed = mockRes();
    await handleSummary({ method: 'GET', url: '/api/spending/summary?month=2026-11', headers: {} }, closed);
    assert.equal(closed.statusCode, 401);
    assert.equal(JSON.stringify(closed.json).includes('1181'), false);

    const bad = mockRes();
    await handleLogin({
      method: 'POST',
      url: '/api/spending/login',
      headers: {},
      body: { password: 'nope' },
    }, bad);
    assert.equal(bad.statusCode, 401);

    const good = mockRes();
    await handleLogin({
      method: 'POST',
      url: '/api/spending/login',
      headers: {},
      body: { password: 'test-gate-secret' },
    }, good);
    assert.equal(good.statusCode, 200);
    const cookie = good.headers['set-cookie'];
    assert.match(cookie, /HttpOnly/);
    assert.equal(cookie.includes('test-gate-secret'), false);

    const open = mockRes();
    await handleSummary({
      method: 'GET',
      url: '/api/spending/summary?month=2026-11',
      headers: { cookie },
    }, open);
    assert.equal(open.statusCode, 200);
    assert.equal(open.json.fixture, true);
    assert.equal(open.json.hisSpend, 1263.5);
    assert.equal(open.json.everydayTarget, 12227);

    delete process.env.SPENDING_FIXTURE;
    const setup = mockRes();
    await handleSummary({
      method: 'GET',
      url: '/api/spending/summary?month=2026-11',
      headers: { cookie },
    }, setup);
    assert.equal(setup.statusCode, 200);
    assert.equal(setup.json.code, 'setup');
    assert.equal(setup.json.hisSpend, undefined);
  } finally {
    for (const [key, value] of Object.entries({
      SPENDING_GATE_PASSWORD: previous.password,
      SPENDING_FIXTURE: previous.fixture,
      VERCEL_ENV: previous.vercel,
      GOOGLE_SERVICE_ACCOUNT_JSON: previous.json,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: previous.email,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: previous.key,
    })) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
