import type { ImageSourcePropType } from 'react-native';
import { webPath } from './openWeb';

/**
 * Same files as the website `public/` folder.
 * The premium bar is bundled so it shows in Expo Go without a reachable website URL.
 * Logo still loads from the public site.
 */
export const BRAND_SOURCES = {
  logo: { uri: webPath('/images/logo.webp') },
  logoOnDark: { uri: webPath('/images/c2.webp') },
  backgroundBar: require('../assets/images/background-bar.png') as ImageSourcePropType,
} as const;

export type BrandImageName = keyof typeof BRAND_SOURCES;

export function publicAssetUri(publicPath: string) {
  return webPath(publicPath.startsWith('/') ? publicPath : `/${publicPath}`);
}

export function avatarPresetUri(presetId: string) {
  return publicAssetUri(`/avatars/${presetId}.svg`);
}
