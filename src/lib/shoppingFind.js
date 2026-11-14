import { nameFromUrl, parseCapture } from './shoppingCapture.js';

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function findQuery(raw) {
  const text = clean(raw);
  if (!text) return '';
  const parsed = parseCapture(text);
  if (!parsed?.url) return text;

  const derived = nameFromUrl(parsed.url);
  const typedName = parsed.name && parsed.name.toLowerCase() !== derived.toLowerCase();
  if (typedName) return parsed.name;

  const withoutUrl = text
    .replace(parsed.url, '')
    .replace(/^https?:\/\//i, '')
    .trim();
  if (withoutUrl) return withoutUrl;
  return '';
}

export function matchSavedItems(items, query) {
  const q = findQuery(query).toLowerCase();
  if (!q) return [];

  const scored = [];
  for (const item of items || []) {
    const name = clean(item?.name);
    const fields = [
      name,
      item?.location,
      item?.remarks,
      item?.url,
      ...(Array.isArray(item?.tags) ? item.tags : [])
    ].map((value) => clean(value).toLowerCase()).filter(Boolean);
    if (!fields.some((field) => field.includes(q))) continue;

    const lower = name.toLowerCase();
    let score = 5;
    if (lower === q) score = 100;
    else if (lower.startsWith(q)) score = 50;
    else if (lower.includes(q)) score = 20;
    if (!item.isBought) score += 3;
    scored.push({ item, score, name });
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, 6).map((entry) => entry.item);
}
