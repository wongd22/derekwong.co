export function isStoredShoppingImage(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl) return false;
  try {
    const url = new URL(imageUrl);
    const path = decodeURIComponent(`${url.pathname}${url.search}`);
    return url.hostname === 'firebasestorage.googleapis.com' && path.includes('shopping_images');
  } catch {
    return imageUrl.includes('shopping_images/');
  }
}
