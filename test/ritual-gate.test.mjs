import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACTIVE_STEP,
  CHECKLIST,
  CHECKS_REQUIRED,
  SESSION_WINDOW,
  STEPS,
  WEEKLY_STOP_R,
  applyRecord,
  checklistPasses,
  emptyLedger,
  evaluateGate,
  lossRecorded,
  newDay,
  newWeek,
  normalizeLedger,
  planReady,
} from '../src/lib/ritualGate.js';

const page = fs.readFileSync('src/pages/trading-rituals.jsx', 'utf8');

function ready(overrides = {}) {
  return {
    step: STEPS[ACTIVE_STEP],
    ledger: emptyLedger(),
    stopTf: '15m',
    targetTf: '15m',
    passes: 5,
    stopPips: '10',
    atr: '10',
    plan: { bias: 'Long with the daily', invalidation: 'Below the 1H zone', target: 'Prior high' },
    ...overrides,
  };
}

test('risk numbers and the active step stay put', () => {
  assert.equal(ACTIVE_STEP, 'step1');
  assert.equal(WEEKLY_STOP_R, 4);
  assert.equal(CHECKS_REQUIRED, 5);
  assert.deepEqual(STEPS, {
    step1: { label: 'Step 1 · $5,000', balance: 5000, rPct: 0.005, buffer: 10, target: 12 },
    step2: { label: 'Step 2 · $10,000', balance: 10000, rPct: 0.005, buffer: 10, target: 12 },
    step3: { label: 'Step 3 · $15,000', balance: 15000, rPct: 0.005, buffer: 10, target: 12 },
    funded: { label: 'Funded · $20,000', balance: 20000, rPct: 0.004, buffer: 10, target: 12.5 },
  });
  assert.match(page, /STEPS\[ACTIVE_STEP\]/);
  assert.doesNotMatch(page, /ACTIVE_STEP\s*=/);
  assert.doesNotMatch(page, /DAILY_STOP|−2R|-2R|day over/);
});

test('the seven checklist items are unchanged, and time uses the session window', () => {
  assert.deepEqual(
    CHECKLIST.map((item) => item.label),
    ['順勢', '原生段破慣性', '禁區', '黃金比率', '止蝕盤觸發', '時間配合', '錢']
  );
  assert.equal(
    SESSION_WINDOW,
    '2–5pm and 7–9pm HKT on weekdays (2–5 is London, 7–9 is New York)'
  );
  assert.equal(CHECKLIST.find((item) => item.id === 'time').hint, SESSION_WINDOW);
  assert.equal(CHECKLIST.find((item) => item.id === 'zone').zone, true);
  assert.match(page, /SESSION_WINDOW/);
  assert.doesNotMatch(page, /EU 2–5pm|Tue\/Wed/);
});

test('confirmed copy stays on the page, and the 1m entry example does not', () => {
  assert.match(page, /Read before every trade/);
  assert.match(page, /The small timeframe is a scalpel/);
  assert.match(page, /順勢 → 擇地 → 擇時後動/);
  assert.match(page, /Four steps\. Never start in the middle\./);
  assert.match(page, /you are gambling, not trading/);
  assert.match(page, /沒有答案，只有合理的行為/);
  assert.match(page, /1m \/ 5m — fine-tune only/);
  assert.match(page, /Zero decision power/);
  assert.match(page, /15m · the entry \/ decision timeframe/);
  assert.doesNotMatch(page, /The decision happens here/);
  assert.match(
    page,
    /Decision timeframe 15m, TP at the targeted price of that timeframe\. Did not over-leverage\./
  );
  assert.doesNotMatch(page, /Entry timeframe 1m/);
  assert.match(page, /One loss per day, then review/);
  assert.match(page, /Stand aside/);
  assert.match(page, /Gate closed — DO NOT TRADE\./);
  assert.match(page, /mapped 禁區, or mid-zone\?/);
  assert.doesNotMatch(page, /setChecks|max="7"|Checklist ticked \(of 7\)/);
  assert.doesNotMatch(page, /setInterval|auto-advance|autoAdvance/);
});

test('ticks auto-sum, and mid-zone cannot pass 禁區', () => {
  const marks = {
    trend: 'pass',
    impulse: 'pass',
    zone: 'mid',
    fib: 'pass',
    sweep: 'pass',
    time: null,
    flow: null,
  };
  assert.equal(checklistPasses(marks), 4);
  assert.equal(checklistPasses({ ...marks, zone: 'pass' }), 4);
  assert.equal(checklistPasses({ ...marks, zone: 'fail' }), 4);
  assert.equal(checklistPasses({ ...marks, zone: 'mapped' }), 5);
  assert.equal(checklistPasses({ trend: 5, impulse: '5', zone: '5', fib: 'yes' }), 0);

  const fiveElsewhere = checklistPasses({ ...marks, time: 'pass' });
  assert.equal(fiveElsewhere, 5);
  const blocked = evaluateGate(ready({ passes: checklistPasses(marks) }));
  assert.equal(blocked.gates.find((gate) => gate.key === 'check').ok, false);
  assert.equal(blocked.cleared, false);
});

test('blank plan text cannot open the gate', () => {
  assert.equal(planReady({ bias: 'a', invalidation: 'b', target: 'c' }), true);
  assert.equal(planReady({ bias: '  a  ', invalidation: 'b', target: 'c' }), true);
  assert.equal(planReady({ bias: '   ', invalidation: 'b', target: 'c' }), false);
  assert.equal(planReady({ bias: 'a', invalidation: '\n\t ', target: 'c' }), false);
  assert.equal(planReady({ bias: 'a', invalidation: 'b', target: '' }), false);
  assert.equal(planReady(null), false);

  const open = evaluateGate(ready());
  assert.equal(open.cleared, true);
  const blank = evaluateGate(ready({ plan: { bias: ' ', invalidation: 'below', target: 'high' } }));
  assert.equal(blank.gates.find((gate) => gate.key === 'plan').ok, false);
  assert.equal(blank.cleared, false);
});

test('one logged loss closes the day even when net R is back to zero', () => {
  let ledger = applyRecord(emptyLedger(), -1);
  assert.equal(ledger.dayR, -1);
  assert.equal(ledger.usedR, 1);
  assert.equal(ledger.lostToday, true);
  assert.equal(ledger.dayR > -2, true);

  let verdict = evaluateGate(ready({ ledger }));
  assert.equal(verdict.gates.find((gate) => gate.key === 'day').ok, false);
  assert.equal(verdict.cleared, false);
  assert.equal(verdict.gates.find((gate) => gate.key === 'day').label, 'One loss, then review');

  ledger = applyRecord(ledger, 1);
  assert.equal(ledger.dayR, 0);
  assert.equal(ledger.lostToday, true);
  assert.equal(lossRecorded(ledger), true);
  verdict = evaluateGate(ready({ ledger }));
  assert.equal(verdict.gates.find((gate) => gate.key === 'day').ok, false);

  ledger = newDay(ledger);
  assert.equal(ledger.lostToday, false);
  assert.equal(ledger.dayR, 0);
  assert.equal(ledger.usedR, 1);
  verdict = evaluateGate(ready({ ledger }));
  assert.equal(verdict.gates.find((gate) => gate.key === 'day').ok, true);
  assert.equal(verdict.cleared, true);
});

test('a saved negative day still counts as a loss, and the week stop stays −4R', () => {
  const saved = normalizeLedger({ usedR: 3, dayR: -1, weekR: -2 });
  assert.equal(saved.lostToday, true);
  assert.equal(saved.usedR, 3);
  assert.equal(evaluateGate(ready({ ledger: saved })).gates.find((gate) => gate.key === 'day').ok, false);

  const weekHit = evaluateGate(ready({ ledger: { ...emptyLedger(), weekR: -4 } }));
  assert.equal(weekHit.gates.find((gate) => gate.key === 'week').ok, false);
  assert.match(weekHit.gates.find((gate) => gate.key === 'week').label, /−4R/);

  const weekOpen = evaluateGate(ready({ ledger: { ...emptyLedger(), weekR: -3 } }));
  assert.equal(weekOpen.gates.find((gate) => gate.key === 'week').ok, true);

  const reset = newWeek({ usedR: 4, dayR: -1, weekR: -4, lostToday: true });
  assert.deepEqual(
    { dayR: reset.dayR, weekR: reset.weekR, lostToday: reset.lostToday, usedR: reset.usedR },
    { dayR: 0, weekR: 0, lostToday: false, usedR: 4 }
  );
});

test('timeframe, ATR, bullets, and a 4 of 7 checklist still hold the gate', () => {
  assert.equal(evaluateGate(ready({ stopTf: '5m' })).cleared, false);
  assert.equal(evaluateGate(ready({ stopTf: '', targetTf: '' })).cleared, false);
  assert.equal(evaluateGate(ready({ stopPips: '4', atr: '10' })).cleared, false);
  assert.equal(evaluateGate(ready({ atr: '' })).cleared, false);
  assert.equal(evaluateGate(ready({ passes: 4 })).cleared, false);
  const spent = evaluateGate(ready({ ledger: { ...emptyLedger(), usedR: 10 } }));
  assert.equal(spent.bulletsLeft, 0);
  assert.equal(spent.gates.find((gate) => gate.key === 'bullets').ok, false);
  assert.equal(evaluateGate(ready()).cleared, true);
});
