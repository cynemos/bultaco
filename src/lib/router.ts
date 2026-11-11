import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

// Petit routeur maison : une adresse par page, boutons « précédent / suivant »
// du navigateur, liens partageables. Netlify renvoie toutes les adresses vers
// index.html (voir netlify.toml).

export type Section = 'home' | 'gallery' | 'timeline' | 'technical' | 'costs' | 'admin';

export const SECTION_PATHS: Record<Section, string> = {
  home: '/',
  gallery: '/galerie',
  timeline: '/chronologie',
  technical: '/technique',
  costs: '/couts',
  admin: '/admin'
};

export const SECTION_TITLES: Record<Section, string> = {
  home: 'Accueil',
  gallery: 'Galerie',
  timeline: 'Chronologie',
  technical: 'Fiche technique',
  costs: 'Coûts',
  admin: 'Administration'
};

export const sectionFromPath = (pathname: string): Section => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const found = (Object.entries(SECTION_PATHS) as [Section, string][]).find(([, path]) => path === clean);
  return found ? found[0] : 'home';
};

const ROUTE_EVENT = 'bultaco:navigate';

export const navigate = (to: string, options: { replace?: boolean; keepScroll?: boolean } = {}) => {
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (to !== current) {
    if (options.replace) window.history.replaceState(null, '', to);
    else window.history.pushState(null, '', to);
    window.dispatchEvent(new Event(ROUTE_EVENT));
  }
  if (!options.keepScroll && !to.includes('#')) window.scrollTo({ top: 0 });
};

export const useRoute = () => {
  const read = () => ({
    section: sectionFromPath(window.location.pathname),
    search: new URLSearchParams(window.location.search),
    hash: window.location.hash.replace(/^#/, '')
  });
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const update = () => setRoute(read());
    window.addEventListener('popstate', update);
    window.addEventListener(ROUTE_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(ROUTE_EVENT, update);
    };
  }, []);

  const goTo = useCallback((section: Section) => navigate(SECTION_PATHS[section]), []);
  return { ...route, goTo };
};

// Pour les liens <a href> : clic normal = navigation interne, Ctrl/clic milieu = nouvel onglet
export const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, to: string, after?: () => void) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(to);
  after?.();
};
