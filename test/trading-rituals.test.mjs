import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('src/pages/trading-rituals.jsx', 'utf8');

function at(needle) {
  const index = page.indexOf(needle);
  assert.ok(index >= 0, `missing: ${needle}`);
  return index;
}

test('the interactive gate and its ledger are gone', () => {
  assert.equal(fs.existsSync('src/lib/ritualGate.js'), false);
  assert.equal(fs.existsSync('test/ritual-gate.test.mjs'), false);
  assert.doesNotMatch(page, /ritualGate|evaluateGate|localStorage|ptr-state|useRitualGate/);
  assert.doesNotMatch(page, /<input\b|<textarea\b|<select\b|onChange=/);
  assert.doesNotMatch(page, /Permission now|GOOD TRADE|BAD TRADE|kind="win"|kind="loss"|is-good|is-bad/);
  assert.doesNotMatch(page, /New day|New week|\+1R|−1R|-1R|\+2R/);
  assert.doesNotMatch(page, />\s*Pass\s*</);
  assert.doesNotMatch(page, />\s*Fail\s*</);
  assert.doesNotMatch(page, />\s*Mid-zone\s*</);
  assert.doesNotMatch(page, /Gate closed|Gate clear|mapped 禁區, or mid-zone/);
  assert.doesNotMatch(page, /ATR|pip value|Stop distance|lotSize|DAILY_STOP|−2R|-2R/);
  assert.doesNotMatch(page, /\$5,000|\$10,000|\$15,000|\$20,000|0\.004/);
  assert.doesNotMatch(page, /setInterval|auto-advance|autoAdvance|setChecks/);
  assert.match(page, /\$\{className\}/);
  assert.match(page, /<Deck \/>/);
  assert.doesNotMatch(page, /mode === ["']session["']|useState\(["']session["']\)/);
});

test('the deck still swipes, and does not grow a skip', () => {
  assert.match(page, /onTouchStart/);
  assert.match(page, /ArrowRight/);
  assert.match(page, /ArrowLeft/);
  assert.match(page, /prefers-reduced-motion:reduce/);
  assert.match(page, /dx \* 0\.3/);
  assert.doesNotMatch(page, /setInterval|requestAnimationFrame/);
});

test('the guidebook opens on the same sequence, with the stand-aside close', () => {
  const deck = page.slice(page.indexOf('const slides = ['));
  const sequence = [
    'Read before every trade',
    'Structure first.',
    'The small timeframe is a scalpel',
    '順勢 → 擇地 → 擇時後動',
    'Four steps. Never start in the middle.',
    '15m · the entry / decision timeframe',
    '1m / 5m — fine-tune only',
    'Zero decision power',
    'you are gambling, not trading',
    'Five of seven, or no trade.',
    'tone="held"',
    'tone="break"',
    '沒有答案，只有合理的行為',
    'Sitting out is executing the plan — if you cannot name bias, invalidation, and the 禁區 out loud, there is no trade.',
  ];
  let cursor = -1;
  for (const line of sequence) {
    const next = deck.indexOf(line, cursor + 1);
    assert.ok(next > cursor, `out of order: ${line}`);
    cursor = next;
  }

  const held = [
    'Correct size and a calm mind',
    '15m decides, 1m only fine-tunes',
    'Wait for the 禁區 and close at the plan, no revenge re-entry',
  ];
  const breaks = [
    'Ticking the list to justify FOMO',
    'Rushing to 1m to win it back',
    'Buying mid-channel',
    'Deciding on 5m against the move',
  ];
  const heldBlock = page.slice(page.indexOf('const HELD'), page.indexOf('const BREAKS'));
  const breakBlock = page.slice(page.indexOf('const BREAKS'), page.indexOf('function Example'));
  cursor = -1;
  for (const line of held) {
    const next = heldBlock.indexOf(line, cursor + 1);
    assert.ok(next > cursor, line);
    cursor = next;
  }
  cursor = -1;
  for (const line of breaks) {
    const next = breakBlock.indexOf(line, cursor + 1);
    assert.ok(next > cursor, line);
    cursor = next;
  }

  assert.equal(page.split('沒有答案，只有合理的行為').length - 1, 1);
  assert.doesNotMatch(page, /The decision happens here|Entry timeframe 1m/);
  assert.doesNotMatch(page, /Entry right, TP right|Entry right and TP right|take profit when hit milestone/);
});

test('reminder copy stays, including the daily loss rule and the weekly −4R stop', () => {
  const reminders = [
    '1R = 0.5% — never think in USD',
    'Need 5 of 7 to fire',
    '10R buffer · 12R to pass',
    'Stop and target must live on the same timeframe. No exceptions.',
    'Both set at entry. Never manage from memory.',
    'Move SL to breakeven. 食半留半.',
    'Add exposure to save a losing idea.',
    'Mid-zone does not pass 禁區.',
    '2–5pm and 7–9pm HKT on weekdays (2–5 is London, 7–9 is New York)',
    'One loss, then review',
    'One loss per day, then review.',
    'Weekly stop (−4R)',
    '−4R.',
  ];
  for (const line of reminders) at(line);

  const labels = ['順勢', '原生段破慣性', '禁區', '黃金比率', '止蝕盤觸發', '時間配合', '錢'];
  let cursor = page.indexOf('Entry checklist');
  for (const label of labels) {
    const next = page.indexOf(label, cursor + 1);
    assert.ok(next > cursor, label);
    cursor = next;
  }
  assert.doesNotMatch(page, /EU 2–5pm|Tue\/Wed/);
});

test('journal images and historical notes stay with the same charts', () => {
  const images = ['good-1.jpg', 'good-2.jpg', 'good-3.jpg', 'bad-1.jpg', 'bad-2.jpg', 'bad-3.jpg', 'bad-4.jpg'];
  let cursor = -1;
  for (const image of images) {
    const next = page.indexOf(image, cursor + 1);
    assert.ok(next > cursor, image);
    cursor = next;
  }

  const notes = [
    ['27 Feb 2026', '4H entry aligned with bias, 15m fine-tuned'],
    ['27 Feb 2026', 'W/D bias marked before anything else'],
    ['27 Feb 2026', 'TP taken at the milestone, not at hope'],
    ['4 Mar 2026', 'Decision timeframe 15m, TP at the targeted price of that timeframe. Did not over-leverage.'],
    ['4 Mar 2026', 'Structure came from W/D → 4H → 15m'],
    ['4 Mar 2026', '1m only refined the trigger, size stayed small'],
    ['4 Mar 2026', 'Target was defined before entry'],
    ['3 Mar 2026', 'Zone was marked in the morning, not in the moment'],
    ['3 Mar 2026', 'Waited for price to come to the 禁區'],
    ['3 Mar 2026', 'Closed at plan, no re-entry revenge'],
    ['26 Feb 2026', 'FOMO to believe it is upward trend, but maybe it destroyed the upward 禁區 — so it is not strong upwards yet.'],
    ['26 Feb 2026', 'Checklist ticked to justify the trade, not to test it'],
    ['20 Feb 2026', 'Over traded today, rush into 1m timeframe, lose discipline, urgent to win... Gamble into it. Remember what consistent means and it will compound.'],
    ['20 Feb 2026', '1m used as the decision timeframe — the cardinal sin'],
    ['11 Nov 2025', 'No review written — that silence is part of the lesson.'],
    ['11 Nov 2025', 'Entry sat right on the black S/R line, mid-channel'],
    ['7 Oct 2025', 'No review written — that silence is part of the lesson.'],
    ['7 Oct 2025', 'Decision made on 5m, not a fine-tune of a higher-TF idea'],
  ];
  for (const [anchor, note] of notes) {
    const start = page.indexOf(anchor);
    assert.ok(start >= 0, anchor);
    assert.ok(page.slice(start, start + 700).includes(note), `${note} should stay with ${anchor}`);
  }
  assert.equal(page.split('No review written — that silence is part of the lesson.').length - 1, 2);
});
