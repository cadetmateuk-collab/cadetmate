import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Bell, Settings, ShoppingBag, Trophy } from 'lucide-react-native';
import { useAuth } from '../../../lib/AuthContext';
import { href } from '../../../lib/href';
import { Badge, HubTile, PrimaryButton, Screen } from '../../../components/ui';
import { UserAvatar } from '../../../components/UserAvatar';
import { colors, type } from '../../../theme';

export default function ProfileScreen() {
  const { session, profile, isPremium, signOut } = useAuth();
  const router = useRouter();

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Screen scroll safeTop>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <UserAvatar
          fullName={profile?.full_name || session.user.email || 'Cadet'}
          avatarKind={profile?.avatar_kind}
          avatarPreset={profile?.avatar_preset}
          avatarColor={profile?.avatar_color}
          size={72}
        />
        <View style={{ flex: 1 }}>
          <Text style={type.h1}>{profile?.full_name || 'Your account'}</Text>
          <Text style={type.muted}>{session.user.email}</Text>
          <View style={{ marginTop: 8 }}>
            <Badge label={isPremium ? 'Premium' : 'Free'} tone={isPremium ? 'brass' : 'default'} />
          </View>
        </View>
      </View>

      <HubTile title="Store" subtitle="Digital packs and Premium" icon={ShoppingBag} onPress={() => router.push(href('/profile/store'))} />
      <HubTile title="Progress" subtitle="Streak, XP and achievements" icon={Trophy} onPress={() => router.push(href('/profile/progress'))} />
      <HubTile title="Notifications" subtitle="Activity on your account" icon={Bell} onPress={() => router.push(href('/profile/notifications'))} />
      <HubTile title="Settings" subtitle="Account and billing" icon={Settings} onPress={() => router.push(href('/profile/settings'))} />

      <PrimaryButton
        label="Sign out"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
        style={{ backgroundColor: colors.danger, marginTop: 12 }}
      />
    </Screen>
  );
}
