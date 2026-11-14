import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { nameFromUrl, parseCapture, captureFromShare, captureFromPaste, captureFromDrop, shareRecordToCaptures } from '../src/lib/shoppingCapture.js';
import { findQuery, matchSavedItems } from '../src/lib/shoppingFind.js';
import { followUpUpdates, previewUpdates } from '../src/lib/shoppingPreview.js';
import { isStoredShoppingImage } from '../src/lib/shoppingImage.js';
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

test('captureFromShare keeps a title or caption and still saves a bare link', () => {
  const titled = captureFromShare({
    title: 'Leather chair',
    url: 'https://shop.example.com/products/leather-chair'
  });
  assert.equal(titled.name, 'Leather chair');
  assert.equal(titled.url, 'https://shop.example.com/products/leather-chair');

  const instagram = captureFromShare({
    title: 'Instagram',
    text: 'Cool chair https://www.instagram.com/p/CxYzAb12wxyz/'
  });
  assert.equal(instagram.name, 'Cool chair');
  assert.match(instagram.url, /instagram\.com\/p\/CxYzAb12wxyz/);

  const bare = captureFromShare({
    url: 'https://www.nike.com/t/air-max-90-mens-shoes/ABC1234567'
  });
  assert.equal(bare.name, 'Air max 90 mens shoes');
  assert.equal(captureFromShare({ title: '   ', text: '' }), null);
});

test('paste saves a link immediately and leaves a plain name for Enter', () => {
  assert.equal(captureFromPaste('Wool coat', 'https://shop.example.com/products/linen-shirt').name, 'Wool coat');
  assert.equal(captureFromPaste('', 'https://aesop.com/p/resolute-hydrating-body-balm').url, 'https://aesop.com/p/resolute-hydrating-body-balm');
  assert.equal(captureFromPaste('Wool coat', 'another coat'), null);
  assert.equal(captureFromDrop('Lamp', 'https://shop.example.com/products/ceramic-lamp').name, 'Lamp');
  assert.equal(captureFromDrop('', 'ceramic lamp'), null);
});

test('a typed name still saves when saved items already match it', () => {
  const items = [
    { id: '1', name: 'Wool coat', isBought: false, tags: ['winter'], location: 'Aesop' },
    { id: '2', name: 'Wool socks', isBought: true, tags: [] },
    { id: '3', name: 'Lamp', isBought: false, url: 'https://shop.example.com/lamp' }
  ];
  assert.equal(findQuery('https://www.nike.com/t/air-max-90'), '');
  assert.deepEqual(matchSavedItems(items, 'https://www.nike.com/t/air-max-90'), []);
  assert.deepEqual(matchSavedItems(items, 'wool').map((item) => item.id), ['1', '2']);
  assert.deepEqual(matchSavedItems(items, 'aesop').map((item) => item.name), ['Wool coat']);
  assert.equal(parseCapture('Wool coat').name, 'Wool coat');
  assert.equal(parseCapture('Wool coat').url, '');
});

test('link preview fills a blank title and photo without overwriting an edit', () => {
  assert.deepEqual(previewUpdates({
    name: 'shop.example.com',
    imageUrl: '',
    autoName: 'shop.example.com',
    preview: { title: 'Wool coat', image: 'https://cdn.example.com/coat.jpg' }
  }), { name: 'Wool coat', imageUrl: 'https://cdn.example.com/coat.jpg' });

  assert.deepEqual(previewUpdates({
    name: 'My coat',
    imageUrl: '',
    autoName: 'shop.example.com',
    preview: { title: 'Wool coat', image: 'https://cdn.example.com/coat.jpg' }
  }), { imageUrl: 'https://cdn.example.com/coat.jpg' });

  assert.deepEqual(previewUpdates({
    name: 'Air max 90 mens shoes',
    imageUrl: 'https://cdn.example.com/mine.jpg',
    autoName: 'Air max 90 mens shoes',
    preview: { title: 'Nike Air Max 90', image: 'https://cdn.example.com/other.jpg' },
    keepImage: true
  }), { name: 'Nike Air Max 90' });

  assert.equal(previewUpdates({
    name: 'Wool coat',
    imageUrl: 'https://cdn.example.com/mine.jpg',
    autoName: '',
    preview: { title: 'Other', image: 'https://cdn.example.com/other.jpg' },
    keepImage: true
  }), null);

  assert.deepEqual(followUpUpdates(
    { name: 'shop.example.com', imageUrl: '', isBought: false },
    { name: 'Wool coat', imageUrl: 'https://cdn.example.com/coat.jpg', isBought: true }
  ), {
    name: 'Wool coat',
    imageUrl: 'https://cdn.example.com/coat.jpg',
    isBought: true
  });
});

test('shared photos become captures and remote preview urls are not storage files', () => {
  const saved = shareRecordToCaptures({
    title: 'Lamp',
    url: 'https://shop.example.com/lamp',
    files: [{ name: 'lamp.jpg', type: 'image/jpeg', size: 1200 }]
  });
  assert.equal(saved[0].name, 'Lamp');
  assert.equal(saved[0].url, 'https://shop.example.com/lamp');
  assert.equal(saved[0].file.name, 'lamp.jpg');

  assert.equal(isStoredShoppingImage('https://cdn.example.com/coat.jpg'), false);
  assert.equal(isStoredShoppingImage('https://firebasestorage.googleapis.com/v0/b/app/o/shopping_images%2Fitem%2Fphoto.jpg?alt=media'), true);
});

test('the shopping manifest accepts a share target and the worker does not cache the site', () => {
  const manifest = JSON.parse(readFileSync('public/shopping.webmanifest', 'utf8'));
  assert.equal(manifest.share_target.action, '/shopping/share');
  assert.equal(manifest.share_target.method, 'POST');
  assert.equal(manifest.share_target.params.files[0].name, 'media');
  assert.equal(manifest.start_url, '/shopping');

  const worker = readFileSync('public/share-sw.js', 'utf8');
  assert.equal(worker.includes('/shopping/share'), true);
  assert.equal(worker.includes('caches'), false);
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
