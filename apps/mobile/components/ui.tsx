import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Sparkles, type LucideIcon } from 'lucide-react-native';
import { colors, fonts, radius, shadow, space, type } from '../theme';

export function Screen({
  children,
  style,
  scroll,
  safeTop,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  safeTop?: boolean;
}) {
  const edges = (safeTop ? ['top', 'left', 'right'] : ['left', 'right']) as ('top' | 'left' | 'right')[];
  if (scroll) {
    return (
      <SafeAreaView style={[styles.screen, style]} edges={edges}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.screenContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.screen, styles.screenContent, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={type.h1}>{children}</Text>;
}

export function Subheading({ children }: { children: React.ReactNode }) {
  return <Text style={[type.muted, { marginTop: 6, marginBottom: space.lg }]}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={type.body}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={type.muted}>{children}</Text>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={[type.label, { marginTop: space.sm }]}>{children}</Text>;
}

export function IconWell({
  icon: Icon,
  tone = 'primary',
}: {
  icon: LucideIcon;
  tone?: 'primary' | 'amber' | 'green' | 'violet' | 'brass';
}) {
  const palette = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    amber: { bg: colors.warningSoft, fg: colors.warning },
    green: { bg: colors.successSoft, fg: colors.success },
    violet: { bg: '#EDE9FE', fg: '#7C3AED' },
    brass: { bg: colors.brassSoft, fg: colors.brass },
  }[tone];
  return (
    <View style={[styles.iconWell, { backgroundColor: palette.bg }]}>
      <Icon size={20} color={palette.fg} strokeWidth={1.75} />
    </View>
  );
}

export function Badge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'primary' | 'brass' | 'danger' | 'success';
}) {
  const palette = {
    default: { bg: '#F0F1F4', color: colors.textMuted },
    primary: { bg: colors.primarySoft, color: colors.primary },
    brass: { bg: colors.brassSoft, color: colors.brass },
    danger: { bg: colors.dangerSoft, color: colors.danger },
    success: { bg: colors.successSoft, color: colors.success },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  loading,
  disabled,
  style,
  ...props
}: PressableProps & { label: string; loading?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
        style as ViewStyle,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color="#fff" />
          <Text style={[styles.primaryBtnText, { flexShrink: 1 }]}>{label}</Text>
        </View>
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function OutlineButton({
  label,
  style,
  ...props
}: PressableProps & { label: string }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.outlineBtn,
        pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
        style as ViewStyle,
      ]}
      {...props}
    >
      <Text style={styles.outlineBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Field({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[styles.input, style]}
    />
  );
}

export function CenterState({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      {typeof children === 'string' ? <Text style={type.muted}>{children}</Text> : children}
      {onRetry ? (
        <Pressable onPress={onRetry} style={{ marginTop: space.md }}>
          <Text style={{ color: colors.primary, fontFamily: fonts.semibold }}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingScreen() {
  return (
    <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
      <ActivityIndicator color={colors.primary} />
    </SafeAreaView>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.error}>{children}</Text>;
}

export function ListRow({
  title,
  subtitle,
  meta,
  onPress,
  right,
  icon,
  iconTone = 'primary',
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  onPress?: () => void;
  right?: React.ReactNode;
  icon?: LucideIcon;
  iconTone?: 'primary' | 'amber' | 'green' | 'violet' | 'brass';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? { opacity: 0.85 } : null]}
    >
      {icon ? <IconWell icon={icon} tone={iconTone} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={type.h3} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[type.muted, { marginTop: 4 }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={[type.caption, { marginTop: 6 }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} /> : null}
    </Pressable>
  );
}

export function HubTile({
  title,
  subtitle,
  icon,
  locked,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  locked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [styles.hub, pressed && onPress ? { opacity: 0.88 } : null, disabled && { opacity: 0.7 }]}
    >
      <IconWell icon={icon} tone={locked ? 'brass' : 'primary'} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={type.h3}>{title}</Text>
        <Text style={[type.muted, { marginTop: 4 }]}>{subtitle}</Text>
      </View>
      {locked ? <Badge label="Premium" tone="brass" /> : <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.75} />}
    </Pressable>
  );
}

export function PremiumLock({
  message,
  onExplore,
  cta = 'Explore Premium',
}: {
  message?: string;
  onExplore: () => void;
  cta?: string;
}) {
  return (
    <Card style={styles.premiumLock}>
      <View style={styles.premiumLockHead}>
        <IconWell icon={Sparkles} tone="brass" />
        <Badge label="Premium" tone="brass" />
      </View>
      <Text style={[type.h3, { marginTop: space.md }]}>Upgrade to Premium</Text>
      <Text style={[type.muted, { marginTop: 6 }]}>
        {message ?? 'This study feature is included with CadetMate Premium.'}
      </Text>
      <PrimaryButton label={cta} onPress={onExplore} style={{ marginTop: space.md }} />
    </Card>
  );
}

export function OfflineUnavailable({
  feature,
}: {
  feature: string;
}) {
  return (
    <Card>
      <Text style={type.h3}>{feature} needs connectivity</Text>
      <Text style={[type.muted, { marginTop: 6 }]}>
        This part of the app cannot work on the device alone. Turn Offline Mode off when internet is affordable.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, gap: space.md, flexGrow: 1, paddingBottom: space.xl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,230,224,0.6)',
    ...shadow.card,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: colors.primaryText,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  outlineBtnText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    fontFamily: fonts.regular,
    minHeight: 44,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.sm,
  },
  error: { color: colors.dangerText, fontSize: 14, fontFamily: fonts.medium },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,230,224,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    ...shadow.card,
  },
  hub: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,230,224,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    ...shadow.card,
  },
  premiumLock: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brass,
    gap: 0,
  },
  premiumLockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
