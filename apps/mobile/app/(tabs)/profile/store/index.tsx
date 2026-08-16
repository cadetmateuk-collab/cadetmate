import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { FlashcardPack } from '@cadet-mate/shared';
import { Layers } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/AuthContext';
import { href } from '../../../../lib/href';
import { Badge, Card, LoadingScreen, OfflineUnavailable, PremiumLock, Screen, SectionLabel } from '../../../../components/ui';
import { openExternal, webPath } from '../../../../lib/openWeb';
import { formatGbp } from '../../../../lib/html';
import { useOffline, loadInstalledPayloads, withNetworkFallback, resolveMediaUri } from '../../../../lib/offline';
import { colors, fonts, radius, shadow, space, type } from '../../../../theme';

function initials(title: string) {
  return title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function ProductCover({ pack }: { pack: FlashcardPack }) {
  const uri = resolveMediaUri(pack.thumbnail_url);
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.parchment }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 4 / 3,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.extraBold, fontSize: 36, color: 'rgba(41,102,242,0.28)' }}>
        {initials(pack.title)}
      </Text>
    </View>
  );
}

export default function StoreScreen() {
  const router = useRouter();
  const { isPremium } = useAuth();
  const { canUseNetwork } = useOffline();
  const [packs, setPacks] = useState<FlashcardPack[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await withNetworkFallback(
      async () => {
        const local = await loadInstalledPayloads<{ pack: FlashcardPack }>('flashcard_pack');
        return local.map((item) => item.pack);
      },
      async () => {
        const { data } = await supabase
          .from('flashcard_packs')
          .select('*')
          .eq('status', 'published')
          .order('updated_at', { ascending: false });
        return (data ?? []) as FlashcardPack[];
      },
    );
    setPacks(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openWebsiteStore = () => void openExternal(webPath('/store'));

  if (loading) return <LoadingScreen />;

  return (
    <Screen style={{ padding: 0 }}>
      <FlatList
        data={packs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <Text style={[type.label, { color: colors.primary }]}>Store</Text>
            <Text style={type.h1}>Digital resources</Text>
            <Text style={[type.muted, { marginBottom: 12 }]}>
              Subscriptions and pack purchases are managed on the website. The iOS app does not sell Premium.
            </Text>
            {!canUseNetwork ? <OfflineUnavailable feature="Store and billing" /> : null}
            {isPremium ? (
              <Card>
                <Badge label="Premium" tone="brass" />
                <Text style={[type.h3, { marginTop: 8 }]}>Premium is active</Text>
                <Text style={type.muted}>Modules, orals, TRB and sea survival are unlocked.</Text>
              </Card>
            ) : (
              <PremiumLock
                message="Modules, orals, TRB and sea survival. Flashcard packs are sold separately on the website."
                onExplore={openWebsiteStore}
                cta="Open website store"
              />
            )}
            <SectionLabel>Packs</SectionLabel>
          </>
        }
        ListEmptyComponent={<Text style={[type.muted, { textAlign: 'center', marginTop: 24 }]}>No packs published yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(href(`/profile/store/${item.slug}`))}
            style={({ pressed }) => [
              {
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.92 : 1,
                ...shadow.card,
              },
            ]}
          >
            <View>
              <ProductCover pack={item} />
              <View style={{ position: 'absolute', top: 10, left: 10 }}>
                <Badge label="Digital" tone="primary" />
              </View>
            </View>
            <View style={{ padding: space.lg, gap: 6 }}>
              <Text style={[type.label, { color: colors.primary }]}>{item.category}</Text>
              <Text style={type.h3} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={type.muted} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={[type.h3, { color: colors.primary }]}>
                  {item.price_cents ? formatGbp(item.price_cents) : 'Free'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Layers size={14} color={colors.textMuted} />
                  <Text style={type.caption}>{item.card_count} cards</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
