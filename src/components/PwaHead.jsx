import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pwaProfile } from '../pwa/profiles';

function ensureLink(rel) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  return link;
}

function ensureMeta(name) {
  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  return meta;
}

export default function PwaHead() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const profile = pwaProfile(pathname);
    ensureLink('manifest').href = profile.manifest;
    ensureLink('apple-touch-icon').href = profile.icon;
    ensureMeta('theme-color').setAttribute('content', '#000000');
    ensureMeta('apple-mobile-web-app-title').setAttribute('content', profile.title);
    ensureMeta('apple-mobile-web-app-capable').setAttribute('content', 'yes');
    ensureMeta('mobile-web-app-capable').setAttribute('content', 'yes');
  }, [pathname]);

  return null;
}
