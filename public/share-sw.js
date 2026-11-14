// Share-target receiver for the shopping list.
// iOS does not deliver Web Share Target requests. Android and desktop
// installed apps POST here, and this worker stores the payload for /shopping.
const DB_NAME = 'shopping-share';
const STORE = 'inbox';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/shopping/share') {
    event.respondWith(receiveShare(event.request));
  }
});

async function receiveShare(request) {
  try {
    const form = await request.formData();
    const files = [];
    for (const value of form.getAll('media')) {
      if (!value || typeof value.arrayBuffer !== 'function' || !value.size) continue;
      if (!String(value.type || '').startsWith('image/')) continue;
      files.push({
        name: value.name || 'photo.jpg',
        type: value.type || 'image/jpeg',
        blob: value
      });
    }
    const record = {
      id: (self.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      title: String(form.get('title') || ''),
      text: String(form.get('text') || ''),
      url: String(form.get('url') || ''),
      files,
      createdAt: Date.now()
    };
    if (record.title || record.text || record.url || files.length) {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        if (new URL(client.url).pathname.startsWith('/shopping')) {
          client.postMessage({ type: 'shopping-share' });
        }
      }
    }
  } catch {
    // Open the list anyway. The page can still take a paste or drop.
  }
  return Response.redirect(new URL('/shopping', self.location.origin).href, 303);
}
