import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { nameFromUrl, parseCapture } from '../src/lib/shoppingCapture.js';
import { buildShoppingView } from '../src/lib/shoppingView.js';

test('parseCapture keeps a typed name and ignores blank input', () => {
  assert.equal(parseCapture('   '), null);
  assert.equal(parseCapture(null), null);
  assert.deepEqual(parseCapture('  Wool coat  '), { name: 'Wool coat', url: '' });
});

test('parseCapture stores a pasted url and derives a name', () => {
  const parsed = parseCapture('https://www.nike.com/t/air-max-90-mens-shoes/ABC1234567');
  assert.equal(parsed.url, 'https://www.nike.com/t/air-max-90-mens-shoes/ABC1234567');
  assert.equal(parsed.name, 'Air max 90 mens shoes');
});

test('parseCapture prefers a name typed before a link', () => {
  const parsed = parseCapture('Linen shirt https://shop.example.com/products/linen-shirt');
  assert.equal(parsed.name, 'Linen shirt');
  assert.equal(parsed.url, 'https://shop.example.com/products/linen-shirt');
});

test('parseCapture names amazon search links and bare product urls', () => {
  assert.equal(
    nameFromUrl('https://www.amazon.com/s?k=ceramic+lamp'),
    'Ceramic lamp'
  );
  assert.equal(
    parseCapture('https://www.amazon.com/dp/B0CHWRXH8B').name,
    'amazon.com'
  );

  const bare = parseCapture('aesop.com/p/resolute-hydrating-body-balm');
  assert.equal(bare.url, 'https://aesop.com/p/resolute-hydrating-body-balm');
  assert.equal(bare.name, 'Resolute hydrating body balm');
});

test('parseCapture does not treat ordinary words or filenames as links', () => {
  assert.deepEqual(parseCapture('Dr. Martens boots'), { name: 'Dr. Martens boots', url: '' });
  assert.deepEqual(parseCapture('notes.txt'), { name: 'notes.txt', url: '' });
  assert.equal(parseCapture('hello@nike.com').url, '');
});

test('buildShoppingView shows a new item immediately and drops it once the server has it', () => {
  const server = [{ id: 'a', name: 'Lamp', isBought: false, tags: [], createdAt: '2026-01-01' }];
  const optimistic = [{ id: 'b', name: 'Coat', isBought: false, tags: [], pending: true }];
  const first = buildShoppingView({ serverItems: server, optimisticItems: optimistic });
  assert.deepEqual(first.filteredItems.map((item) => item.id), ['b', 'a']);

  const saved = buildShoppingView({
    serverItems: [...server, { id: 'b', name: 'Coat', isBought: false, tags: [] }],
    optimisticItems: optimistic
  });
  assert.deepEqual(saved.filteredItems.map((item) => item.id), ['a', 'b']);
});

test('buildShoppingView hides bought items, deleted items, and applies tag filters', () => {
  const server = [
    { id: 'a', name: 'Lamp', isBought: false, tags: ['home'] },
    { id: 'b', name: 'Soap', isBought: true, tags: ['home'] },
    { id: 'c', name: 'Book', isBought: false, tags: ['read'] }
  ];

  const hiddenBought = buildShoppingView({ serverItems: server });
  assert.deepEqual(hiddenBought.filteredItems.map((item) => item.name), ['Lamp', 'Book']);
  assert.equal(hiddenBought.boughtCount, 1);

  const shown = buildShoppingView({ serverItems: server, showBoughtItems: true });
  assert.equal(shown.filteredItems.length, 3);

  const tagged = buildShoppingView({ serverItems: server, selectedFilterTags: ['home'] });
  assert.deepEqual(tagged.filteredItems.map((item) => item.name), ['Lamp']);

  const removed = buildShoppingView({ serverItems: server, hiddenIds: new Set(['a']) });
  assert.deepEqual(removed.items.map((item) => item.id), ['b', 'c']);

  const boughtNow = buildShoppingView({
    serverItems: server,
    overrides: { a: { isBought: true } }
  });
  assert.deepEqual(boughtNow.filteredItems.map((item) => item.id), ['c']);
});

test('shopping page copy and surfaces stay flat', () => {
  const files = [
    'src/pages/Shopping.jsx',
    ...readdirSync('src/components/Shopping').map((name) => join('src/components/Shopping', name))
  ];
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.equal(source.includes('No items found'), false);
  assert.equal(source.includes('window.alert'), false);
  assert.equal(source.includes('bg-gradient'), false);
  assert.equal(source.includes('backdrop-blur'), false);
  assert.equal(source.includes('from-emerald'), false);
  assert.equal(source.includes('italic'), false);
  assert.equal(source.includes('Save it before you forget.'), true);
});
