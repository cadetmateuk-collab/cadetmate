import {
  SITE_URL,
  absoluteWebUrl,
  isWebOnlyPath,
} from '@cadet-mate/shared/config';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

const webBase = process.env.EXPO_PUBLIC_WEB_URL ?? SITE_URL;

/** Open a CadetMate web path — WebView route for in-app, or external browser for payments. */
export function webPath(path: string): string {
  return absoluteWebUrl(path, webBase);
}

export async function openWebFeature(path: string, mode: 'browser' | 'inapp' = 'inapp') {
  const url = webPath(path);
  if (mode === 'browser') {
    await Linking.openURL(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

export function shouldOpenOnWeb(pathname: string): boolean {
  return isWebOnlyPath(pathname);
}
