import { useCallback, useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Flashcard, FlashcardPack } from '@cadet-mate/shared';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/AuthContext';
import { href } from '../../../../lib/href';
import { Badge, OfflineUnavailable, OutlineButton, LoadingScreen, PrimaryButton, Screen } from '../../../../components/ui';
import { openExternal, webPath } from '../../../../lib/openWeb';
import { formatGbp } from '../../../../lib/html';
import { loadLocalContent, useOffline, withNetworkFallback, resolveMediaUri } from '../../../../lib/offline';
import { colors, fonts, radius, type } from '../../../../theme';

type PackPayload = { pack: FlashcardPack; cards?: Flashcard[] };

export default function StoreProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const { canUseNetwork } = useOffline();
  const router = useRouter();
  const [pack, setPack] = useState<FlashcardPack | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const next = await withNetworkFallback(
      async () => (slug ? (await loadLocalContent<PackPayload>('flashcard_pack', slug))?.pack ?? null : null),
      async () => {
        const { data } = await supabase
          .from('flashcard_packs')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();
        return data as FlashcardPack | null;
      },
    );
    setPack(next);
    if (next) {
      const local = await loadLocalContent<PackPayload>('flashcard_pack', next.id);
      if (local) setOwned(true);
      else if (session?.user.id && canUseNetwork) {
        const { data: own } = await supabase
          .from('flashcard_pack_ownership')
          .select('pack_id')
          .eq('user_id', session.user.id)
          .eq('pack_id', next.id)
          .maybeSingle();
        setOwned(!!own);
      }
    }
    setLoading(false);
  }, [slug, session?.user.id, canUseNetwork]);

  useEffect(() => {
    void load();
  }, [load]);

  const claimFree = async () => {
    if (!pack || pack.price_cents) return;
    setBusy(true);
    setError(null);
    try {
      const { error: claimError } = await supabase.rpc('claim_free_flashcard_pack', {
        p_pack_id: pack.id,
      });
      if (claimError) throw new Error(claimError.message);
      setOwned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim pack');
    }
    setBusy(false);
  };

  if (loading) return <LoadingScreen />;
  if (!pack) {
    return (
      <Screen>
        <Text style={type.muted}>Product not found.</Text>
      </Screen>
    );
  }

  const thumb = resolveMediaUri(pack.thumbnail_url);

  return (
    <Screen scroll>
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.parchment }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 4 / 3,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.extraBold, fontSize: 40, color: 'rgba(41,102,242,0.28)' }}>
            {pack.title.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
      <Badge label="Digital" tone="primary" />
      <Text style={[type.label, { color: colors.primary }]}>Flashcard pack — {pack.category}</Text>
      <Text style={type.h2}>{pack.title}</Text>
      <Text style={type.body}>{pack.description}</Text>
      <Text style={type.muted}>
        {pack.card_count} cards · Unlocks in app · {owned ? 'Owned' : pack.price_cents ? formatGbp(pack.price_cents) : 'Free'}
      </Text>
      {error ? <Text style={type.muted}>{error}</Text> : null}
      {!canUseNetwork && !owned ? <OfflineUnavailable feature="Purchases" /> : null}
      {owned ? (
        <PrimaryButton label="Study pack" onPress={() => router.push(href(`/learn/study/${pack.slug}`))} />
      ) : pack.price_cents ? (
        <PrimaryButton
          label={`Buy on website · ${formatGbp(pack.price_cents)}`}
          onPress={() => void openExternal(webPath('/store'))}
        />
      ) : (
        <PrimaryButton label="Claim free pack" loading={busy} onPress={() => void claimFree()} />
      )}
      <OutlineButton label="Back to store" onPress={() => router.push(href('/profile/store'))} />
    </Screen>
  );
}
