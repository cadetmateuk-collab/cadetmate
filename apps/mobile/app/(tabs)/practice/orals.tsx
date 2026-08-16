import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { href } from '../../../lib/href';
import { LoadingScreen, OutlineButton, PremiumLock, PrimaryButton, Screen } from '../../../components/ui';
import { loadLocalContent, withNetworkFallback } from '../../../lib/offline';
import { colors, radius, space, type } from '../../../theme';

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
};

export default function OralsScreen() {
  const { isPremium } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await withNetworkFallback(
      async () => {
        const local = await loadLocalContent<{ questions: Question[] }>('quiz_bank', 'daily_questions');
        return local?.questions ?? [];
      },
      async () => {
        const { data } = await supabase
          .from('daily_questions')
          .select('id, question, options, correct_answer, explanation')
          .order('created_at');
        return (data ?? []) as Question[];
      },
    );
    setQuestions(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!isPremium) {
    return (
      <Screen>
        <PremiumLock
          message="The oral question bank is included with Premium."
          onExplore={() => router.push(href('/profile/store'))}
        />
      </Screen>
    );
  }
  if (!questions.length) {
    return (
      <Screen>
        <Text style={type.muted}>No oral questions yet.</Text>
      </Screen>
    );
  }

  const q = questions[index];

  return (
    <Screen>
      <Text style={type.caption}>
        {index + 1} / {questions.length}
      </Text>
      <Pressable
        onPress={() => setFlipped((f) => !f)}
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          padding: space.xl,
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={type.caption}>{flipped ? 'Answer' : 'Question'}</Text>
        <Text style={[type.h2, { marginTop: 8 }]}>
          {flipped ? q.correct_answer : q.question}
        </Text>
        {flipped && q.explanation ? <Text style={[type.muted, { marginTop: 12 }]}>{q.explanation}</Text> : null}
        <Text style={[type.caption, { marginTop: 24, textAlign: 'center' }]}>Tap to flip</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <OutlineButton
            label="Previous"
            disabled={index === 0}
            onPress={() => {
              setIndex((i) => Math.max(0, i - 1));
              setFlipped(false);
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Next"
            onPress={() => {
              setIndex((i) => Math.min(questions.length - 1, i + 1));
              setFlipped(false);
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
