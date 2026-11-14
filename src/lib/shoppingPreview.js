import { publicUrlProblem } from '../../shared/shopping/preview.js';

export async function fetchLinkPreview(url, { fetchImpl = fetch, signal } = {}) {
  if (publicUrlProblem(url)) return null;
  let response;
  try {
    response = await fetchImpl(`/api/shopping/preview?url=${encodeURIComponent(url)}`, {
      signal,
      headers: { Accept: 'application/json' }
    });
  } catch {
    return null;
  }
  if (!response?.ok) return null;
  let data;
  try {
    data = await response.json();
  } catch {
    return null;
  }
  const title = typeof data?.title === 'string' ? data.title.replace(/\s+/g, ' ').trim() : '';
  const image = typeof data?.image === 'string' && /^https?:\/\//i.test(data.image) ? data.image.trim() : '';
  if (!title && !image) return null;
  return { title, image };
}

export function previewUpdates({ name, imageUrl, autoName, preview, keepImage = false }) {
  if (!preview) return null;
  const updates = {};
  const title = String(preview.title || '').replace(/\s+/g, ' ').trim();
  if (title && name === autoName && title !== name) {
    updates.name = title.length > 120 ? `${title.slice(0, 117).trimEnd()}…` : title;
  }
  const image = String(preview.image || '').trim();
  if (!keepImage && !imageUrl && /^https?:\/\//i.test(image)) {
    updates.imageUrl = image;
  }
  return Object.keys(updates).length ? updates : null;
}

export function followUpUpdates(written, after) {
  const diff = {};
  for (const key of ['name', 'url', 'imageUrl']) {
    if (typeof after?.[key] === 'string' && after[key] && after[key] !== written?.[key]) {
      diff[key] = after[key];
    }
  }
  if (Boolean(after?.isBought) !== Boolean(written?.isBought)) {
    diff.isBought = Boolean(after?.isBought);
  }
  return diff;
}
