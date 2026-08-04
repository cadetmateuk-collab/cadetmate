/**
 * Native shell helpers for Capacitor.
 * When server.url points at the live site, most UX runs in the remote WebView;
 * this file still registers back-button + deep-link handling for the shell itself.
 */
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

async function init() {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0B1F3A' });
  } catch {
    /* web preview */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* web preview */
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  App.addListener('appUrlOpen', ({ url }) => {
    // cadetmate://reset-password?... or https://cadetmate.co.uk/...
    try {
      const parsed = new URL(url.replace(/^cadetmate:\//, 'https://cadetmate.local/'));
      const path = parsed.pathname + parsed.search + parsed.hash;
      if (path && path !== '/') {
        window.location.href = path.startsWith('http')
          ? url
          : `${window.location.origin}${path}`;
      }
    } catch {
      console.warn('[CadetMate shell] Unhandled deep link', url);
    }
  });
}

init();
