// Which installed app a page belongs to.
// Shopping keeps its own manifest (id /shopping, scope /shopping) so its
// share target and home-screen start URL stay put. The hub covers the rest
// of the site. Rituals is a separate entry point so Add to Home Screen from
// that page opens /trading-rituals. No site-wide service worker: a worker
// scoped to / could take /shopping/share away from share-sw.js.

const SHOPPING = {
  manifest: '/shopping.webmanifest',
  title: 'Shopping',
  icon: '/shopping-icon-192.png',
};

const RITUALS = {
  manifest: '/rituals.webmanifest',
  title: 'Rituals',
  icon: '/rituals-icon-180.png',
};

const HUB = {
  manifest: '/manifest.webmanifest',
  title: 'Derek',
  icon: '/icon-180.png',
};

export function pwaProfile(pathname) {
  if (pathname === '/shopping' || pathname.startsWith('/shopping/')) return SHOPPING;
  if (pathname === '/trading-rituals') return RITUALS;
  return HUB;
}
