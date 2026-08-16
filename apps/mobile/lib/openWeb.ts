import { SITE_URL, absoluteWebUrl } from '@cadet-mate/shared/config';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

const webBase = process.env.EXPO_PUBLIC_WEB_URL ?? SITE_URL;

export function webPath(path: string): string {
  return absoluteWebUrl(path, webBase);
}

/** Open Stripe Checkout / Customer Portal in the system browser (PCI). */
export async function openCheckoutUrl(url: string) {
  await WebBrowser.openBrowserAsync(url);
}

export async function openExternal(url: string) {
  await Linking.openURL(url);
}
