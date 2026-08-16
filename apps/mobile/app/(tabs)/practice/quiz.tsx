import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';
import { href } from '../../../lib/href';
import { LoadingScreen, OutlineButton, Screen } from '../../../components/ui';
import { loadLocalContent, ProgressStore, withNetworkFallback } from '../../../lib/offline';
import { colors, space, type } from '../../../theme';

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
};

function asOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function dailySeed(userId: string, dateKey: string): number {
  const str = userId + dateKey;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export default function DailyQuizScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const todayKey = new Date().toISOString().slice(0, 10);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const questions = await withNetworkFallback(
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
    if (!questions.length) {
      setQuestion(null);
      setLoading(false);
      return;
    }
    const seed = session?.user.id ? dailySeed(session.user.id, todayKey) : dailySeed('anon', todayKey);
    const picked = { ...questions[seed % questions.length] };
    picked.options = asOptions(picked.options);
    setQuestion(picked);
    const localAnswer = await ProgressStore.quizAnswer(picked.id);
    if (localAnswer) {
      setSelected(localAnswer.selected_answer);
      setCorrect(Boolean(localAnswer.correct));
    }
    setLoading(false);
  }, [session?.user.id, todayKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const answer = async (opt: string) => {
    if (!question || selected) return;
    const isCorrect = opt === question.correct_answer;
    setSelected(opt);
    setCorrect(isCorrect);
    await ProgressStore.saveQuizAnswer(question.id, opt, isCorrect);
  };

  if (loading) return <LoadingScreen />;
  if (!question) {
    return (
      <Screen>
        <Text style={type.muted}>
          No quiz questions on this device. Download the quiz pack from Manage offline content.
        </Text>
        <OutlineButton label="Manage offline content" onPress={() => router.push(href('/profile/offline-content'))} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={type.caption}>Question of the day</Text>
      <Text style={type.h2}>{question.question}</Text>
      {(question.options ?? []).map((opt) => {
        const isPick = selected === opt;
        const show = selected !== null;
        const isRight = opt === question.correct_answer;
        const bg = !show
          ? colors.card
          : isRight
            ? colors.successSoft
            : isPick
              ? colors.dangerSoft
              : colors.card;
        const border = !show
          ? colors.border
          : isRight
            ? colors.success
            : isPick
              ? colors.danger
              : colors.border;
        return (
          <Pressable
            key={opt}
            onPress={() => void answer(opt)}
            style={{
              backgroundColor: bg,
              borderRadius: 12,
              padding: space.lg,
              borderWidth: 1,
              borderColor: border,
            }}
          >
            <Text style={type.body}>{opt}</Text>
          </Pressable>
        );
      })}
      {correct !== null ? (
        <View>
          <Text style={type.h3}>{correct ? 'Correct' : 'Not quite'}</Text>
          {question.explanation ? <Text style={type.muted}>{question.explanation}</Text> : null}
        </View>
      ) : null}
    </Screen>
  );
}
