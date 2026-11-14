import assert from 'node:assert/strict';
import test from 'node:test';
import { isPrivateAddress, publicUrlProblem, readPreview } from '../shared/shopping/preview.js';
import { handlePreview, loadPreview } from '../server/shopping/preview.js';

test('readPreview uses the page title and image and ignores prices', () => {
  const html = `
    <html><head>
      <meta property="og:title" content="Wool coat &amp; scarf">
      <meta property="product:price:amount" content="120">
      <meta property="og:price:amount" content="120">
      <meta property="og:image" content="/images/coat.jpg">
      <title>Ignored title</title>
    </head></html>
  `;
  const preview = readPreview(html, 'https://shop.example.com/products/coat');
  assert.deepEqual(preview, {
    title: 'Wool coat & scarf',
    image: 'https://shop.example.com/images/coat.jpg'
  });
  assert.equal(JSON.stringify(preview).includes('120'), false);
});

test('readPreview skips login walls and keeps a normal title tag', () => {
  assert.deepEqual(readPreview('<title>Instagram</title><meta property="og:image" content="https://cdn.example.com/a.jpg">', 'https://instagram.com/p/abc'), {
    title: '',
    image: 'https://cdn.example.com/a.jpg'
  });
  assert.equal(readPreview('<title>Ceramic lamp</title>', 'https://shop.example.com/lamp').title, 'Ceramic lamp');
});

test('preview urls reject private and non-http targets', () => {
  assert.equal(publicUrlProblem('https://shop.example.com/products/coat'), '');
  assert.equal(publicUrlProblem('http://169.254.169.254/latest/meta-data/'), 'blocked');
  assert.equal(publicUrlProblem('http://127.0.0.1/'), 'blocked');
  assert.equal(publicUrlProblem('http://10.1.2.3/'), 'blocked');
  assert.equal(publicUrlProblem('http://192.168.0.8/secret'), 'blocked');
  assert.equal(publicUrlProblem('http://localhost/shopping'), 'blocked');
  assert.equal(publicUrlProblem('file:///etc/passwd'), 'invalid');
  assert.equal(publicUrlProblem('http://user:pass@shop.example.com/'), 'invalid');
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
});

test('loadPreview reads a page and stops a redirect to a private address', async () => {
  const html = '<html><head><meta property="og:title" content="Wool coat"><meta property="og:image" content="https://cdn.example.com/c.jpg"></head></html>';
  const preview = await loadPreview('http://1.1.1.1/coat', async () => new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html' }
  }));
  assert.equal(preview.title, 'Wool coat');
  assert.equal(preview.image, 'https://cdn.example.com/c.jpg');

  let calls = 0;
  const blocked = await loadPreview('http://1.1.1.1/go', async () => {
    calls += 1;
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secret' } });
  });
  assert.equal(calls, 1);
  assert.deepEqual(blocked, { title: '', image: '' });
});

test('preview endpoint rejects a private url without fetching it', async () => {
  const res = {
    statusCode: 0,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    end(body) { this.body = body; }
  };
  await handlePreview({ method: 'GET', url: '/api/shopping/preview?url=http://169.254.169.254/' }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(JSON.parse(res.body), { title: '', image: '' });
});
