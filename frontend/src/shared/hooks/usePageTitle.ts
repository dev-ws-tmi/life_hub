import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Map routes to page names for the browser tab title
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':     'Tauler',
  '/assignatures':  'Estudis',
  '/tasques':       'Tasques',
  '/pomodoro':      'Pomodoro',
  '/calendari':     'Calendari',
  '/finances':      'Finances',
  '/habits':        'Hàbits',
  '/compres':       'Compres',
  '/salut':         'Salut',
  '/documents':     'Documents',
  '/objectius':     'Objectius',
  '/estadistiques': 'Estadístiques',
  '/configuracio':  'Configuració',
};

const APP_NAME = 'LifeHub';
const BRAND_SUFFIX = 'NodeBridge';

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    // Find matching route (prefix match for nested routes)
    const matchedKey = Object.keys(ROUTE_TITLES).find(key =>
      location.pathname === key || location.pathname.startsWith(key + '/')
    );

    if (matchedKey) {
      document.title = `${ROUTE_TITLES[matchedKey]} — ${APP_NAME}`;
    } else {
      document.title = `${APP_NAME} — ${BRAND_SUFFIX}`;
    }
  }, [location.pathname]);
}
