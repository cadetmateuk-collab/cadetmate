import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  avatarPresetXml,
  contrastTextOn,
  getInitials,
  normalizeAvatarColor,
  normalizeAvatarKind,
  type AvatarKind,
} from '../lib/avatar';
import { fonts } from '../theme';

type Props = {
  fullName?: string | null;
  avatarKind?: AvatarKind | string | null;
  avatarPreset?: string | null;
  avatarColor?: string | null;
  size?: number;
};

export function UserAvatar({
  fullName,
  avatarKind,
  avatarPreset,
  avatarColor,
  size = 64,
}: Props) {
  const kind = normalizeAvatarKind(avatarKind);
  const xml = kind === 'preset' ? avatarPresetXml(avatarPreset) : null;
  const color = normalizeAvatarColor(avatarColor);
  const fg = contrastTextOn(color);
  const initials = getInitials(fullName || 'U');

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: xml ? 'transparent' : color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {xml ? (
        <SvgXml xml={xml} width={size} height={size} />
      ) : (
        <Text
          style={{
            fontFamily: fonts.extraBold,
            fontSize: Math.max(12, size * 0.34),
            color: fg,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
