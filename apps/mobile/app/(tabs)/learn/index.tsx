import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  HelpCircle,
  LifeBuoy,
  MessageCircleQuestion,
  Newspaper,
  WalletCards,
  type LucideIcon,
} from 'lucide-react-native';
import { useAuth } from '../../../lib/AuthContext';
import { href } from '../../../lib/href';
import { Screen } from '../../../components/ui';
import { QuickLinkTile } from '../../../components/QuickLinkTile';
import { type } from '../../../theme';
import type { QuickLinkGlyphName } from '../../../components/QuickLinkGlyph';

const ITEMS: {
  href:
    | '/learn/modules'
    | '/learn/flashcards'
    | '/learn/survival'
    | '/learn/articles'
    | '/practice/quiz'
    | '/practice/orals';
  label: string;
  glyph: QuickLinkGlyphName;
  Watermark: LucideIcon;
  premium: boolean;
}[] = [
  { href: '/learn/modules', label: 'Modules', glyph: 'book', Watermark: BookOpen, premium: true },
  { href: '/learn/flashcards', label: 'Flashcards', glyph: 'layers', Watermark: WalletCards, premium: false },
  { href: '/learn/articles', label: 'Articles', glyph: 'newspaper', Watermark: Newspaper, premium: false },
  { href: '/learn/survival', label: 'Sea Survival', glyph: 'buoy', Watermark: LifeBuoy, premium: true },
  { href: '/practice/quiz', label: 'Daily Quiz', glyph: 'quiz', Watermark: HelpCircle, premium: false },
  { href: '/practice/orals', label: 'Orals Questions', glyph: 'chat', Watermark: MessageCircleQuestion, premium: true },
];

export default function LearnScreen() {
  const router = useRouter();
  const { isPremium } = useAuth();

  return (
    <Screen scroll safeTop>
      <Text style={type.h1}>Learn</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ITEMS.map((item) => {
          const locked = item.premium && !isPremium;
          return (
            <QuickLinkTile
              key={item.href}
              label={item.label}
              glyph={item.glyph}
              Watermark={item.Watermark}
              locked={locked}
              onPress={() => router.push(href(locked ? '/profile/store' : item.href))}
              style={{ width: '48.4%' }}
            />
          );
        })}
      </View>
    </Screen>
  );
}
