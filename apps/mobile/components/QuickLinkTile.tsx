import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Lock, type LucideIcon } from 'lucide-react-native';
import { Card } from './ui';
import { QuickLinkGlyph, type QuickLinkGlyphName } from './QuickLinkGlyph';
import { colors, fonts } from '../theme';

type Props = {
  label: string;
  glyph: QuickLinkGlyphName;
  Watermark: LucideIcon;
  onPress: () => void;
  locked?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function QuickLinkTile({ label, glyph, Watermark, onPress, locked, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.88 }]}
    >
      <Card style={styles.card}>
        <Watermark size={128} color="#F8FAFC" strokeWidth={1} style={styles.watermark} />
        <QuickLinkGlyph name={glyph} size={28} color={colors.primary} style={{ zIndex: 1 }} />
        <View style={styles.labelRow}>
          {locked ? <Lock size={11} color={colors.textMuted} strokeWidth={2.2} /> : null}
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = {
  card: {
    minHeight: 108,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  watermark: {
    position: 'absolute' as const,
    bottom: -28,
    right: -24,
    transform: [{ rotate: '18deg' }],
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 10,
    zIndex: 1,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
  },
};
