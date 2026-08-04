import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Loads the live CadetMate web app inside a native Android shell.
 * Override with CADETMATE_WEB_URL for local/staging (e.g. http://10.0.2.2:3000).
 * App id / scheme must stay in sync with @cadet-mate/shared/config.
 */
const webUrl = process.env.CADETMATE_WEB_URL || 'https://cadetmate.co.uk';

const config: CapacitorConfig = {
  appId: 'uk.co.cadetmate.app',
  appName: 'CadetMate',
  webDir: 'www',
  server: {
    url: webUrl,
    cleartext: webUrl.startsWith('http://'),
    allowNavigation: [
      'cadetmate.co.uk',
      '*.cadetmate.co.uk',
      'localhost',
      '10.0.2.2',
      '*.supabase.co',
      'checkout.stripe.com',
      'js.stripe.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0B1F3A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B1F3A',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0B1F3A',
  },
};

export default config;
