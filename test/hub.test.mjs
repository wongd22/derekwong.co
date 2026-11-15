import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launches, projects } from '../src/data/hub.js';
import { pwaProfile } from '../src/pwa/profiles.js';

test('homepage cards are in daily order', () => {
  assert.deepEqual(
    projects.map((project) => project.title),
    [
      'Log an expense',
      'Spending',
      'Capture',
      'Trading Rituals',
      'Scorelab Admin',
      'Home chores',
      'Place Calculator',
    ]
  );
});

test('expense is one card with both forms', () => {
  const expense = projects[0];
  assert.equal(expense.link, undefined);
  assert.deepEqual(
    expense.actions.map((action) => action.link),
    ['https://forms.gle/KQuSFhzTKtXgf98k8', 'https://forms.gle/5J55inBAGSwi6wrD8']
  );
  assert.ok(expense.actions.every((action) => action.external));
});

test('capture stays on /shopping and is not a buy list', () => {
  const capture = projects.find((project) => project.link === '/shopping');
  assert.equal(capture.title, 'Capture');
  assert.match(capture.description, /two seconds/i);
  assert.doesNotMatch(`${capture.title} ${capture.description}`, /grocery|to buy|shopping list/i);
});

test('home chores opens the TickTick list', () => {
  const chores = projects.find((project) => project.title === 'Home chores');
  assert.equal(
    chores.link,
    'https://ticktick.com/webapp/#p/6af00d888f0899596f105bb4/tasks'
  );
  assert.equal(chores.external, true);
  assert.match(chores.description, /TickTick/);
  assert.equal(
    projects.some((project) => String(project.link || '').includes('home-routine')),
    false
  );
});

test('launch strip is three always-on links', () => {
  assert.deepEqual(
    launches.map((item) => [item.label, item.href, item.external]),
    [
      ['Trading ritual', '/trading-rituals', false],
      [
        "How's your day",
        'https://app.notion.com/p/scorelab2025/Journal-2854deb190518067a6e4d2299d6195c7',
        true,
      ],
      ['Scorelab Admin', 'https://admin.scorelab.tech/login', true],
    ]
  );
});

test('the first HTML paint picks the same app as the router', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /path === '\/shopping'/);
  assert.match(html, /\/shopping\.webmanifest/);
  assert.match(html, /path === '\/trading-rituals'/);
  assert.match(html, /\/rituals\.webmanifest/);
});

test('installed app follows the page', () => {
  assert.equal(pwaProfile('/').manifest, '/manifest.webmanifest');
  assert.equal(pwaProfile('/place').manifest, '/manifest.webmanifest');
  assert.equal(pwaProfile('/spending').manifest, '/manifest.webmanifest');
  assert.equal(pwaProfile('/trading-rituals').manifest, '/rituals.webmanifest');
  assert.equal(pwaProfile('/trading-rituals').title, 'Rituals');
  assert.equal(pwaProfile('/shopping').manifest, '/shopping.webmanifest');
  assert.equal(pwaProfile('/shopping/share').manifest, '/shopping.webmanifest');
  assert.equal(pwaProfile('/shopping').icon, '/shopping-icon-192.png');
});

function readManifest(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf.toString('ascii', 1, 4), 'PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test('shopping manifest and share worker are unchanged in contract', () => {
  const manifest = readManifest('public/shopping.webmanifest');
  assert.equal(manifest.id, '/shopping');
  assert.equal(manifest.start_url, '/shopping');
  assert.equal(manifest.scope, '/shopping');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.share_target.action, '/shopping/share');
  assert.equal(manifest.share_target.method, 'POST');
  assert.equal(manifest.share_target.enctype, 'multipart/form-data');
  assert.equal(manifest.share_target.params.title, 'title');
  assert.equal(manifest.share_target.params.text, 'text');
  assert.equal(manifest.share_target.params.url, 'url');
  assert.equal(manifest.share_target.params.files[0].name, 'media');

  const sw = fs.readFileSync('public/share-sw.js', 'utf8');
  assert.match(sw, /pathname === '\/shopping\/share'/);
  const hook = fs.readFileSync('src/hooks/useCaptureInbox.js', 'utf8');
  assert.match(hook, /register\('\/share-sw\.js', \{ scope: '\/shopping' \}\)/);
  assert.doesNotMatch(hook, /webmanifest/);
});

test('hub and rituals manifests install without a share target', () => {
  const hub = readManifest('public/manifest.webmanifest');
  const rituals = readManifest('public/rituals.webmanifest');
  for (const manifest of [hub, rituals]) {
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.share_target, undefined);
    assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
    assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
    const start = new URL(manifest.start_url, 'https://derekwong.co').pathname;
    assert.ok(start === manifest.scope || start.startsWith(`${manifest.scope.replace(/\/$/, '')}/`));
  }
  assert.equal(hub.id, '/');
  assert.equal(hub.start_url, '/');
  assert.equal(hub.scope, '/');
  assert.equal(rituals.id, '/trading-rituals');
  assert.equal(rituals.start_url, '/trading-rituals');
  assert.equal(rituals.scope, '/trading-rituals');
  assert.notEqual(rituals.id, hub.id);

  for (const manifest of [hub, rituals]) {
    for (const icon of manifest.icons) {
      const size = Number(icon.sizes.split('x')[0]);
      assert.deepEqual(pngSize(`public${icon.src}`), { width: size, height: size });
    }
  }
  assert.deepEqual(pngSize('public/icon-180.png'), { width: 180, height: 180 });
  assert.deepEqual(pngSize('public/rituals-icon-180.png'), { width: 180, height: 180 });
});
