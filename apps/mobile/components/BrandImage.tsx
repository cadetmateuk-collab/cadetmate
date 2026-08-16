import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { avatarPresetXml } from '../lib/avatar';
import { BRAND_SOURCES, publicAssetUri, type BrandImageName } from '../lib/brandAssets';

export function BrandImage({
  name,
  style,
  resizeMode = 'contain',
  ...props
}: Omit<ImageProps, 'source'> & {
  name: BrandImageName;
  style?: StyleProp<ImageStyle>;
}) {
  return <Image source={BRAND_SOURCES[name]} resizeMode={resizeMode} style={style} {...props} />;
}

/** SVG presets bundled with the app — same artwork as `public/avatars`. */
export function PresetAvatar({
  presetId,
  size = 40,
}: {
  presetId: string;
  size?: number;
}) {
  const xml = avatarPresetXml(presetId);
  if (!xml) return null;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function PublicImage({
  path,
  style,
  resizeMode = 'cover',
  ...props
}: Omit<ImageProps, 'source'> & {
  path: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image source={{ uri: publicAssetUri(path) }} resizeMode={resizeMode} style={style} {...props} />
  );
}
