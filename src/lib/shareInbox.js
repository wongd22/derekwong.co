// Schema shared with public/share-sw.js: database "shopping-share", store "inbox".
const DB_NAME = 'shopping-share';
const STORE = 'inbox';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
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

export function listShares() {
  return openDb().then((db) => new Promise((resolve) => {
    if (!db.objectStoreNames.contains(STORE)) {
      resolve([]);
      return;
    }
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  })).catch(() => []);
}

export function deleteShare(id) {
  return openDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  })).catch(() => {});
}
