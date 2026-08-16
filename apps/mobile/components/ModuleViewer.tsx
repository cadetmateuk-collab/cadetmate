import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, Clock, FileText, Menu, X } from 'lucide-react-native';
import type { ModuleBlock, ModulePage, ModuleRow } from '../lib/modules';
import { stripHtml } from '../lib/html';
import { ProgressStore, resolveMediaUri, useOffline } from '../lib/offline';
import { openExternal } from '../lib/openWeb';
import { colors, fonts, radius, type } from '../theme';

type Props = {
  module: ModuleRow;
  pages: ModulePage[];
  initialPage?: number;
  onBack: () => void;
};

export function ModuleViewer({ module, pages, initialPage, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { canUseNetwork } = useOffline();
  const total = Math.max(pages.length, 1);
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [sidebar, setSidebar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quizPick, setQuizPick] = useState<Record<string, string>>({});

  const current = pages[page];
  const done = completed.size;
  const pct = Math.round((done / total) * 100);
  const pageDone = completed.has(page);
  const last = page >= total - 1;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await ProgressStore.sections(module.id);
      if (cancelled) return;
      const next = new Set(rows.map((row) => row.section_index));
      setCompleted(next);
      if (typeof initialPage === 'number' && Number.isFinite(initialPage)) {
        setPage(Math.min(total - 1, Math.max(0, initialPage)));
      } else if (next.size > 0) {
        const lastDone = Math.max(...Array.from(next));
        setPage(Math.min(lastDone + 1, total - 1));
      }
    })();
    void ProgressStore.saveModule({
      moduleId: module.id,
      progress: 0,
      completed: false,
    });
    return () => {
      cancelled = true;
    };
  }, [module.id, total, initialPage]);

  const persist = useCallback(
    async (next: Set<number>) => {
      const progress = Math.round((next.size / total) * 100);
      await ProgressStore.setModule({
        moduleId: module.id,
        progress,
        completed: next.size === total,
      });
    },
    [module.id, total],
  );

  const markComplete = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await ProgressStore.saveSection(module.id, page);
      const next = new Set(completed).add(page);
      setCompleted(next);
      await persist(next);
      if (page < total - 1) setPage(page + 1);
    } finally {
      setSaving(false);
    }
  }, [completed, module.id, page, persist, saving, total]);

  const unmark = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await ProgressStore.clearSection(module.id, page);
      const next = new Set(completed);
      next.delete(page);
      setCompleted(next);
      await persist(next);
    } finally {
      setSaving(false);
    }
  }, [completed, module.id, page, persist, saving]);

  const goTo = useCallback((index: number) => {
    setPage(index);
    setSidebar(false);
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={8} style={styles.headerBtn}>
            <ChevronLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
          <View style={styles.timeChip}>
            <Clock size={12} color="rgba(255,255,255,0.8)" strokeWidth={2} />
            <Text style={styles.timeChipText}>{current?.estimatedMinutes || 5} min</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.headerKicker}>
              Page {page + 1} of {total}
            </Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {current?.title || `Page ${page + 1}`}
            </Text>
          </View>
          <Pressable onPress={() => setSidebar(true)} hitSlop={8} style={styles.headerBtn}>
            <Menu size={18} color="#fff" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {current?.title ? <Text style={styles.pageTitle}>{current.title}</Text> : null}
        {(current?.blocks ?? []).length === 0 ? (
          <Text style={type.muted}>No content on this page yet.</Text>
        ) : (
          (current?.blocks ?? []).map((block, i) => (
            <BlockView
              key={block.id ?? `${page}-${i}`}
              block={block}
              questionPrefix={`${module.id}:${page}:${i}`}
              quizPick={quizPick}
              setQuizPick={setQuizPick}
              canUseNetwork={canUseNetwork}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pctTrack}>
          <View style={[styles.pctFill, { width: `${pct}%` }]} />
        </View>
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={[styles.prevBtn, page === 0 && { opacity: 0.4 }]}
          >
            <Text style={styles.prevBtnText}>Previous</Text>
          </Pressable>
          <Text style={styles.pctLabel}>{pct}%</Text>
          {pageDone ? (
            <Pressable onPress={() => void unmark()} disabled={saving} style={styles.undoBtn}>
              <Check size={16} color={colors.primary} strokeWidth={2.2} />
              <Text style={styles.undoBtnText}>Undo</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void markComplete()}
              disabled={saving}
              style={[styles.markBtn, saving && { opacity: 0.7 }]}
            >
              <Text style={styles.markBtnText}>{last ? 'Complete module' : 'Mark complete'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal visible={sidebar} transparent animationType="fade" onRequestClose={() => setSidebar(false)}>
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerScrim} onPress={() => setSidebar(false)} />
          <View style={[styles.drawer, { paddingBottom: insets.bottom }]}>
            <View style={[styles.drawerHead, { paddingTop: insets.top, height: 60 + insets.top }]}>
              <Pressable onPress={() => setSidebar(false)} style={styles.headerBtn}>
                <X size={16} color="#fff" strokeWidth={2} />
              </Pressable>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.drawerKicker}>{module.category}</Text>
                <Text style={styles.drawerTitle} numberOfLines={2}>
                  {module.title}
                </Text>
              </View>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 8 }}>
              {pages.map((item, i) => {
                const active = i === page;
                const donePage = completed.has(i);
                return (
                  <Pressable
                    key={item.id || String(i)}
                    onPress={() => goTo(i)}
                    style={[styles.sectionRow, active && styles.sectionRowActive]}
                  >
                    {active ? <View style={styles.sectionAccent} /> : null}
                    <View
                      style={[
                        styles.sectionIndex,
                        (active || donePage) && { backgroundColor: colors.primary },
                      ]}
                    >
                      {donePage ? (
                        <Check size={14} color="#fff" strokeWidth={2.4} />
                      ) : (
                        <Text style={[styles.sectionIndexText, active && { color: '#fff' }]}>{i + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.sectionName,
                          active && { color: colors.primary, fontFamily: fonts.semibold },
                          donePage && !active && { color: colors.text },
                        ]}
                      >
                        {item.title || `Page ${i + 1}`}
                      </Text>
                      <Text style={styles.sectionMeta}>{item.estimatedMinutes || 5} min</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.drawerFoot}>
              <View style={styles.drawerFootRow}>
                <Text style={styles.drawerFootLabel}>Progress</Text>
                <Text style={styles.pctLabel}>{pct}%</Text>
              </View>
              <View style={styles.pctTrack}>
                <View style={[styles.pctFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.sectionMeta}>
                {done} of {total} pages complete
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BlockView({
  block,
  questionPrefix,
  quizPick,
  setQuizPick,
  canUseNetwork,
}: {
  block: ModuleBlock;
  questionPrefix: string;
  quizPick: Record<string, string>;
  setQuizPick: Dispatch<SetStateAction<Record<string, string>>>;
  canUseNetwork: boolean;
}) {
  const content = (block.content ?? {}) as Record<string, unknown>;

  if (block.type === 'heading') {
    const level = Number(content.level ?? 2);
    return (
      <Text style={level <= 1 ? type.h2 : type.h3}>{String(content.text ?? '')}</Text>
    );
  }

  if (block.type === 'text') {
    const text = stripHtml(String(content.text ?? content.html ?? ''));
    if (!text) return null;
    return <Text style={styles.bodyText}>{text}</Text>;
  }

  if (block.type === 'image') {
    const uri = resolveMediaUri(String(content.url ?? ''));
    if (!uri) return null;
    return (
      <View style={{ gap: 6 }}>
        <ModuleImage uri={uri} />
        {content.caption ? <Text style={styles.caption}>{String(content.caption)}</Text> : null}
      </View>
    );
  }

  if (block.type === 'quiz') {
    return (
      <QuizBlock
        content={content}
        questionPrefix={questionPrefix}
        quizPick={quizPick}
        setQuizPick={setQuizPick}
      />
    );
  }

  if (block.type === 'link' && content.url) {
    const url = String(content.url);
    return (
      <Pressable
        onPress={() => {
          if (canUseNetwork) void openExternal(url);
        }}
        style={styles.linkCard}
      >
        <Text style={styles.linkTitle}>{String(content.title ?? url)}</Text>
        <Text style={styles.linkHint}>{canUseNetwork ? 'Open in browser' : 'Needs connectivity'}</Text>
      </Pressable>
    );
  }

  if (block.type === 'pdf') {
    const url = content.url ? String(content.url) : '';
    return (
      <Pressable
        onPress={() => {
          if (canUseNetwork && url) void openExternal(url);
        }}
        style={styles.pdfCard}
      >
        <FileText size={20} color={colors.primary} strokeWidth={1.75} />
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>{String(content.title ?? 'Document')}</Text>
          <Text style={type.caption}>
            {canUseNetwork && url ? 'Open PDF' : 'PDF — open on the website'}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (block.type === 'video') {
    const url = content.url ? String(content.url) : '';
    return (
      <Pressable
        onPress={() => {
          if (canUseNetwork && url) void openExternal(url);
        }}
        style={styles.pdfCard}
      >
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>{String(content.caption ?? 'Video')}</Text>
          <Text style={type.caption}>
            {canUseNetwork && url ? 'Open video' : 'Video is not available offline'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return null;
}

function ModuleImage({ uri }: { uri: string }) {
  const [ratio, setRatio] = useState(16 / 9);
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', aspectRatio: ratio, borderRadius: radius.lg, backgroundColor: colors.bgElevated }}
      resizeMode="contain"
      onLoad={(e) => {
        const { width, height } = e.nativeEvent.source;
        if (width && height) setRatio(width / height);
      }}
    />
  );
}

function QuizBlock({
  content,
  questionPrefix,
  quizPick,
  setQuizPick,
}: {
  content: Record<string, unknown>;
  questionPrefix: string;
  quizPick: Record<string, string>;
  setQuizPick: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const questions = useMemo(() => {
    const nested = content.questions;
    if (Array.isArray(nested) && nested.length > 0) {
      return nested.map((raw, i) => {
        const q = raw as Record<string, unknown>;
        const options = Array.isArray(q.options) ? q.options.map(String) : [];
        const answer = q.correctAnswer;
        const correct =
          typeof answer === 'number' && options[answer] != null
            ? options[answer]
            : String(answer ?? q.correct ?? q.answer ?? '');
        return {
          id: String(q.id ?? i),
          question: String(q.question ?? 'Question'),
          options,
          correct,
        };
      });
    }
    const options = Array.isArray(content.options) ? content.options.map(String) : [];
    if (!options.length && !content.question) return [];
    return [
      {
        id: '0',
        question: String(content.question ?? 'Quiz'),
        options,
        correct: String(content.answer ?? content.correct ?? ''),
      },
    ];
  }, [content]);

  if (!questions.length) return null;

  return (
    <View style={{ gap: 16 }}>
      {content.title ? <Text style={type.label}>{String(content.title)}</Text> : null}
      {questions.map((q) => {
        const questionId = `${questionPrefix}:${q.id}`;
        const picked = quizPick[questionId];
        return (
          <View key={q.id} style={{ gap: 8 }}>
            <Text style={type.h3}>{q.question}</Text>
            {q.options.map((opt) => {
              const show = Boolean(picked);
              const isPick = picked === opt;
              const isRight = opt === q.correct;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    if (picked) return;
                    setQuizPick((prev) => ({ ...prev, [questionId]: opt }));
                    void ProgressStore.saveQuizAnswer(questionId, opt, opt === q.correct);
                  }}
                  style={[
                    styles.quizOpt,
                    show && isRight && { borderColor: colors.success, backgroundColor: colors.successSoft },
                    show && isPick && !isRight && { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
                  ]}
                >
                  <Text style={type.body}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKicker: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  timeChipText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 32, gap: 14 },
  pageTitle: { ...type.h2, marginBottom: 4 },
  bodyText: { ...type.body, lineHeight: 26 },
  caption: { ...type.caption, textAlign: 'center' },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pctTrack: {
    height: 4,
    backgroundColor: '#E8ECF2',
    overflow: 'hidden',
  },
  pctFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prevBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  prevBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  pctLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    minWidth: 36,
    textAlign: 'center',
  },
  markBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  markBtnText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  undoBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(41,102,242,0.3)',
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  undoBtnText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  drawerRoot: { flex: 1, flexDirection: 'row' },
  drawerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 300,
    maxWidth: '85%',
    backgroundColor: '#fff',
  },
  drawerHead: {
    backgroundColor: colors.primary,
    height: 60,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerKicker: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  drawerTitle: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: '700',
  },
  drawerFoot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  drawerFootRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerFootLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionRowActive: { backgroundColor: '#E8F0FE' },
  sectionAccent: {
    position: 'absolute',
    right: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionIndex: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIndexText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionName: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionMeta: { fontFamily: fonts.regular, fontSize: 10, color: '#C4C9D1', marginTop: 2 },
  linkCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 14,
    gap: 2,
  },
  linkTitle: { color: '#fff', fontFamily: fonts.semibold, fontSize: 14 },
  linkHint: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular, fontSize: 12 },
  pdfCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizOpt: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
});
