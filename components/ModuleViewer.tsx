"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CheckCircle2, FileText, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "multi-select" | "text-input";
  options?: string[];
  correctAnswer: string | number | number[];
  keywords?: string[];
  explanation?: string;
}

interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "video" | "pdf" | "link" | "quiz";
  content: any;
}

interface Page {
  id: string;
  title: string;
  estimatedMinutes: number;
  blocks: ContentBlock[];
}

interface ModuleData {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  accent_color?: string | null;
  pages?: Page[];
  blocks?: any[];
  lastPageTitle?: string;
}

interface ModuleViewerProps {
  moduleId: string;
  moduleData?: ModuleData;
  userEmail?: string;
  userId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_ICONS = ["📖", "💡", "🌐", "📐", "🧪", "📋", "⚡", "🎯", "🔍", "✨"];

// ─── Migrate legacy flat blocks → pages ──────────────────────────────────────

function migrateToPages(data: ModuleData): Page[] {
  const pagesArr = (data as any).pages || (data as any).content?.pages;
  if (Array.isArray(pagesArr) && pagesArr.length > 0) {
    return pagesArr.map((p: any) => ({
      id: p.id || `page-${Math.random().toString(36).substr(2, 6)}`,
      title: p.title || "",
      estimatedMinutes: p.estimatedMinutes || 5,
      blocks: p.blocks || [],
    }));
  }

  const rawBlocks: any[] = (data as any).blocks || (data as any).content?.blocks || [];
  if (rawBlocks.length === 0) return [{ id: "page-0", title: "", estimatedMinutes: 5, blocks: [] }];

  const pages: Page[] = [];
  let current: ContentBlock[] = [];
  let idx = 0;

  for (const block of rawBlocks) {
    if (block.type === "page-break") {
      pages.push({
        id: `page-${idx}`,
        title: block.content?.pageTitle || block.content?.label || "",
        estimatedMinutes: block.content?.estimatedMinutes || 5,
        blocks: current,
      });
      current = [];
      idx++;
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) {
    pages.push({ id: `page-${idx}`, title: "", estimatedMinutes: 5, blocks: current });
  }

  return pages.length > 0 ? pages : [{ id: "page-0", title: "", estimatedMinutes: 5, blocks: [] }];
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 5, background: "hsl(var(--muted))", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "hsl(var(--primary))",
          borderRadius: 99, transition: "width 0.5s cubic-bezier(.4,0,.2,1)"
        }} />
      </div>
      <span style={{ fontSize: 11, color: "hsl(var(--primary))", fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ModuleViewer({ moduleId, moduleData: initialData, userEmail, userId }: ModuleViewerProps) {
  const supabase = createClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const [moduleData, setModuleData]             = useState<ModuleData | null>(initialData || null);
  const [loading, setLoading]                   = useState(!initialData);
  const [activePage, setActivePage]             = useState(0);
  const [completed, setCompleted]               = useState<Set<number>>(new Set());
  const [saving, setSaving]                     = useState(false);
  const [quizAnswers, setQuizAnswers]           = useState<Record<string, any>>({});
  const [quizSubmitted, setQuizSubmitted]       = useState<Record<string, boolean>>({});
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<Record<string, number>>({});
  const [downloadingPdf, setDownloadingPdf]     = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId]     = useState<string | null>(userId || null);

  useEffect(() => {
    if (!userId) supabase.auth.getSession().then(({ data: { session } }) => setResolvedUserId(session?.user?.id ?? null));
  }, [userId]);

  useEffect(() => {
    if (!initialData && moduleId) {
      fetch(`/api/modules?id=${moduleId}`)
        .then(res => res.json())
        .then(data => setModuleData(data))
        .catch(err => console.error("Error fetching module:", err))
        .finally(() => setLoading(false));
    }
  }, [moduleId, initialData]);

  const pages = useMemo<Page[]>(() => {
    if (!moduleData) return [];
    return migrateToPages(moduleData);
  }, [moduleData]);

  const totalPages = pages.length;

  // Load progress
  useEffect(() => {
    if (!resolvedUserId || !moduleData) return;
    async function loadProgress() {
      const { data } = await supabase
        .from("user_section_progress")
        .select("section_index")
        .eq("user_id", resolvedUserId!)
        .eq("module_id", moduleData!.id);

      if (data && data.length > 0) {
        const completedSet = new Set(data.map((r: any) => r.section_index as number));
        setCompleted(completedSet);
        const lastDone = Math.max(...Array.from(completedSet));
        setActivePage(Math.min(lastDone + 1, totalPages - 1));
      }

      await supabase.from("user_module_progress").upsert({
        user_id: resolvedUserId,
        module_id: moduleData!.id,
        last_accessed: new Date().toISOString(),
      }, { onConflict: "user_id,module_id" });
    }
    loadProgress();
  }, [resolvedUserId, moduleData, totalPages]);

  // Save progress
  const saveProgress = useCallback(async (pageIndex: number) => {
    if (!resolvedUserId || !moduleData) return;
    setSaving(true);
    try {
      await supabase.from("user_section_progress").upsert({
        user_id: resolvedUserId, module_id: moduleData.id, section_index: pageIndex,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,module_id,section_index" });

      const newCompleted = new Set(completed).add(pageIndex);
      const progressPct = Math.round((newCompleted.size / totalPages) * 100);
      const isComplete = newCompleted.size === totalPages;

      await supabase.from("user_module_progress").upsert({
        user_id: resolvedUserId, module_id: moduleData.id,
        progress: progressPct, completed: isComplete, last_accessed: new Date().toISOString(),
      }, { onConflict: "user_id,module_id" });

      setCompleted(newCompleted);
    } catch (e) { console.error("Failed to save progress:", e); }
    finally { setSaving(false); }
  }, [resolvedUserId, moduleData, completed, totalPages]);

  // Unsave / unmark a page
  const unmarkProgress = useCallback(async (pageIndex: number) => {
    if (!resolvedUserId || !moduleData) return;
    setSaving(true);
    try {
      await supabase.from("user_section_progress").delete()
        .eq("user_id", resolvedUserId)
        .eq("module_id", moduleData.id)
        .eq("section_index", pageIndex);

      const newCompleted = new Set(completed);
      newCompleted.delete(pageIndex);
      const progressPct = totalPages > 0 ? Math.round((newCompleted.size / totalPages) * 100) : 0;

      await supabase.from("user_module_progress").upsert({
        user_id: resolvedUserId, module_id: moduleData.id,
        progress: progressPct, completed: false, last_accessed: new Date().toISOString(),
      }, { onConflict: "user_id,module_id" });

      setCompleted(newCompleted);
    } catch (e) { console.error("Failed to unmark progress:", e); }
    finally { setSaving(false); }
  }, [resolvedUserId, moduleData, completed, totalPages]);

  // Navigation
  const goTo = useCallback((idx: number) => {
    setActivePage(idx);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = useCallback(async () => {
    if (!completed.has(activePage)) await saveProgress(activePage);
    if (activePage < totalPages - 1) goTo(activePage + 1);
  }, [activePage, totalPages, completed, saveProgress, goTo]);

  const goPrev = useCallback(() => { if (activePage > 0) goTo(activePage - 1); }, [activePage, goTo]);
  const toggleComplete = useCallback(async (pageIndex: number) => {
    if (completed.has(pageIndex)) { await unmarkProgress(pageIndex); }
    else { await saveProgress(pageIndex); }
  }, [completed, saveProgress, unmarkProgress]);

  // PDF download
  const downloadWatermarkedPDF = useCallback(async (pdfUrl: string, fileName: string, blockId: string) => {
    try {
      setDownloadingPdf(blockId);
      const email = userEmail || prompt("Enter your email for watermark:");
      if (!email) { setDownloadingPdf(null); return; }
      const response = await fetch("/api/pdf/watermark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pdfUrl, userEmail: email }) });
      if (!response.ok) throw new Error("Failed to generate watermarked PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fileName || "document.pdf";
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (error) { console.error("Error downloading watermarked PDF:", error); alert("Failed to download PDF with watermark"); }
    finally { setDownloadingPdf(null); }
  }, [userEmail]);

  // Quiz handlers
  const handleQuizAnswer = useCallback((quizId: string, questionId: string, answer: any) => {
    setQuizAnswers(prev => ({ ...prev, [`${quizId}-${questionId}`]: answer }));
  }, []);

  const checkTextInputAnswer = useCallback((userAnswer: string, keywords: string[]) => {
    const normalized = userAnswer.toLowerCase().trim();
    return keywords.some(kw => normalized.includes(kw.toLowerCase()));
  }, []);

  const submitQuiz = useCallback((quizId: string, questions: QuizQuestion[]) => {
    setQuizSubmitted(prev => ({ ...prev, [quizId]: true }));
  }, []);

  // ── Block Renderers ────────────────────────────────────────────────────────

  const renderQuiz = useCallback((block: ContentBlock) => {
    const isSubmitted = quizSubmitted[block.id];
    const questions: QuizQuestion[] = block.content?.questions || [];
    if (questions.length === 0) return null;

    const currentIdx = quizQuestionIndex[block.id] || 0;
    const currentQuestion = questions[currentIdx];
    const totalQ = questions.length;

    const isAnswerCorrect = (q: QuizQuestion) => {
      const ua = quizAnswers[`${block.id}-${q.id}`];
      if (q.type === "text-input") return checkTextInputAnswer(ua || "", q.keywords || []);
      if (q.type === "multi-select") {
        const ca = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        return JSON.stringify((ua || []).sort()) === JSON.stringify(ca.sort());
      }
      return ua === q.correctAnswer;
    };
    const score = isSubmitted ? questions.filter(isAnswerCorrect).length : 0;

    return (
      <div key={block.id} style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderTop: "3px solid hsl(var(--primary))",
        boxShadow: "0 2px 8px hsl(var(--foreground) / 0.06)",
        borderRadius: "calc(var(--radius) * 2)",
        padding: "22px 24px",
        marginBottom: 20,
      }}>
        {/* Quiz header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))" }}>
            🧪 {block.content?.title || "Quiz"}
          </div>
          <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>Q{currentIdx + 1} / {totalQ}</div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "hsl(var(--muted))", borderRadius: 99, overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            width: `${((currentIdx + 1) / totalQ) * 100}%`, height: "100%",
            background: "hsl(var(--primary))",
            borderRadius: 99, transition: "width 0.3s"
          }} />
        </div>

        {currentQuestion && (
          <div style={{
            background: "hsl(var(--secondary))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            padding: "18px 20px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 16, lineHeight: 1.5 }}>
              {currentQuestion.question}
            </div>

            {/* Multiple Choice / Multi-Select */}
            {["multiple-choice", "multi-select"].includes(currentQuestion.type) && currentQuestion.options && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQuestion.options.map((opt, i) => {
                  const selected = currentQuestion.type === "multi-select"
                    ? Array.isArray(quizAnswers[`${block.id}-${currentQuestion.id}`]) && quizAnswers[`${block.id}-${currentQuestion.id}`].includes(i)
                    : quizAnswers[`${block.id}-${currentQuestion.id}`] === i;
                  const showResult = isSubmitted;
                  const isCorrect = currentQuestion.type === "multi-select"
                    ? Array.isArray(currentQuestion.correctAnswer) && (currentQuestion.correctAnswer as number[]).includes(i)
                    : currentQuestion.correctAnswer === i;

                  let bg = "hsl(var(--background))";
                  let border = "1px solid hsl(var(--border))";
                  if (selected && !showResult) { bg = "hsl(var(--accent))"; border = "1px solid hsl(var(--primary))"; }
                  if (showResult && isCorrect) { bg = "hsl(221 91% 96%)"; border = "1px solid hsl(var(--primary))"; }
                  if (showResult && selected && !isCorrect) { bg = "hsl(0 84% 97%)"; border = "1px solid hsl(var(--destructive))"; }

                  return (
                    <button key={i}
                      onClick={() => !isSubmitted && handleQuizAnswer(block.id, currentQuestion.id,
                        currentQuestion.type === "multi-select"
                          ? (() => { const cur = Array.isArray(quizAnswers[`${block.id}-${currentQuestion.id}`]) ? quizAnswers[`${block.id}-${currentQuestion.id}`] : []; return cur.includes(i) ? cur.filter((x: number) => x !== i) : [...cur, i]; })()
                          : i
                      )}
                      disabled={isSubmitted}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--radius)", border, background: bg, cursor: isSubmitted ? "default" : "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <div style={{
                        width: 18, height: 18,
                        borderRadius: currentQuestion.type === "multi-select" ? 4 : 99,
                        border: selected ? "2px solid hsl(var(--primary))" : "2px solid hsl(var(--border))",
                        background: selected ? "hsl(var(--primary))" : "transparent",
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {selected && <div style={{ width: 8, height: 8, borderRadius: 99, background: "hsl(var(--primary-foreground))" }} />}
                      </div>
                      <span style={{ fontSize: 14, color: "hsl(var(--foreground))" }}>{opt}</span>
                      {showResult && isCorrect && <span style={{ marginLeft: "auto", fontSize: 12, color: "hsl(var(--primary))", fontWeight: 600 }}>✓ Correct</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.type === "true-false" && (
              <div style={{ display: "flex", gap: 10 }}>
                {["True", "False"].map((lbl, i) => {
                  const selected = quizAnswers[`${block.id}-${currentQuestion.id}`] === i;
                  const isCorrect = currentQuestion.correctAnswer === i;
                  let bg = "hsl(var(--background))";
                  let border = "1px solid hsl(var(--border))";
                  if (selected && !isSubmitted) { bg = "hsl(var(--accent))"; border = "1px solid hsl(var(--primary))"; }
                  if (isSubmitted && isCorrect) { bg = "hsl(var(--accent))"; border = "1px solid hsl(var(--primary))"; }
                  if (isSubmitted && selected && !isCorrect) { bg = "hsl(0 84% 97%)"; border = "1px solid hsl(var(--destructive))"; }
                  return (
                    <button key={lbl} onClick={() => !isSubmitted && handleQuizAnswer(block.id, currentQuestion.id, i)} disabled={isSubmitted}
                      style={{ flex: 1, padding: "12px", borderRadius: "var(--radius)", border, background: bg, color: "hsl(var(--foreground))", fontSize: 14, fontWeight: 600, cursor: isSubmitted ? "default" : "pointer" }}>
                      {lbl}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text Input */}
            {currentQuestion.type === "text-input" && (
              <div>
                <input type="text" value={quizAnswers[`${block.id}-${currentQuestion.id}`] || ""}
                  onChange={e => !isSubmitted && handleQuizAnswer(block.id, currentQuestion.id, e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Type your answer…"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                {isSubmitted && (
                  <div style={{ marginTop: 8, fontSize: 13, color: isAnswerCorrect(currentQuestion) ? "hsl(var(--primary))" : "hsl(var(--destructive))", fontWeight: 600 }}>
                    {isAnswerCorrect(currentQuestion) ? "✓ Correct!" : `✗ Keywords: ${currentQuestion.keywords?.join(", ")}`}
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            {isSubmitted && currentQuestion.explanation && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: "hsl(var(--accent))", border: "1px solid hsl(var(--primary) / 0.3)", borderRadius: "var(--radius)" }}>
                <span style={{ fontSize: 12, color: "hsl(var(--primary))", fontWeight: 600 }}>💡 </span>
                <span style={{ fontSize: 13, color: "hsl(var(--foreground))" }}>{currentQuestion.explanation}</span>
              </div>
            )}
          </div>
        )}

        {/* Quiz navigation / submit */}
        {!isSubmitted ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setQuizQuestionIndex(prev => ({ ...prev, [block.id]: Math.max(0, (prev[block.id] || 0) - 1) }))}
              disabled={currentIdx === 0}
              style={{ padding: "9px 18px", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", background: "transparent", color: currentIdx === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))", fontSize: 13, cursor: currentIdx === 0 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            {currentIdx < totalQ - 1 ? (
              <button
                onClick={() => setQuizQuestionIndex(prev => ({ ...prev, [block.id]: Math.min(totalQ - 1, (prev[block.id] || 0) + 1) }))}
                style={{ padding: "9px 20px", borderRadius: "var(--radius)", border: "none", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Next →
              </button>
            ) : (
              <button
                onClick={() => submitQuiz(block.id, questions)}
                style={{ padding: "9px 20px", borderRadius: "var(--radius)", border: "none", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Submit Quiz
              </button>
            )}
          </div>
        ) : (
          <div style={{ padding: "14px 18px", background: "hsl(var(--accent))", border: "1px solid hsl(var(--primary) / 0.3)", borderRadius: "var(--radius)", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "hsl(var(--primary))" }}>{score}/{totalQ}</div>
            <div style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>
              {score === totalQ ? "🎉 Perfect score!" : score >= totalQ / 2 ? "👍 Good work!" : "📚 Keep studying!"}
            </div>
          </div>
        )}
      </div>
    );
  }, [quizAnswers, quizSubmitted, quizQuestionIndex, handleQuizAnswer, checkTextInputAnswer, submitQuiz]);

  const renderBlock = useCallback((block: ContentBlock) => {
    switch (block.type) {
      case "heading": {
        const level = block.content?.level || 2;
        const sizes: Record<number, string> = { 1: "2rem", 2: "1.5rem", 3: "1.2rem" };
        return (
          <div key={block.id} style={{ fontSize: sizes[level] || "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2, marginBottom: 12, marginTop: level === 1 ? 8 : 28, paddingBottom: 10, borderBottom: level <= 2 ? "2px solid hsl(var(--primary) / 0.2)" : "none" }}>
            {block.content?.text}
          </div>
        );
      }
      case "text":
        return (
          <div key={block.id} style={{ fontSize: 15, lineHeight: 1.8, color: "hsl(var(--foreground))", marginBottom: 16, background: "hsl(var(--card))", borderRadius: "var(--radius)", padding: "20px 24px", borderLeft: "3px solid hsl(var(--primary))", boxShadow: "0 1px 4px hsl(var(--foreground) / 0.05)" }}
            dangerouslySetInnerHTML={{ __html: block.content?.text || "" }} />
        );
      case "image":
        return (
          <figure key={block.id} style={{ marginBottom: 24, background: "hsl(var(--card))", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "0 2px 8px hsl(var(--foreground) / 0.08)", border: "1px solid hsl(var(--border))" }}>
            <img src={block.content?.url} alt={block.content?.caption || ""} style={{ width: "100%", display: "block" }} onError={e => (e.currentTarget.style.display = "none")} />
            {block.content?.caption && <figcaption style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "8px 12px" }}>{block.content.caption}</figcaption>}
          </figure>
        );
      case "video":
        return (
          <div key={block.id} style={{ marginBottom: 24, background: "hsl(var(--card))", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "0 2px 8px hsl(var(--foreground) / 0.08)", border: "1px solid hsl(var(--border))" }}>
            <div style={{ aspectRatio: "16/9", background: "hsl(var(--muted))" }}>
              <iframe src={block.content?.url} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            {block.content?.caption && <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "8px 12px" }}>{block.content.caption}</div>}
          </div>
        );
      case "pdf": {
        const isDownloading = downloadingPdf === block.id;
        return (
          <div key={block.id} style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderTop: "3px solid hsl(var(--primary))", borderRadius: "var(--radius)", padding: "18px 20px", marginBottom: 16, boxShadow: "0 2px 8px hsl(var(--foreground) / 0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <FileText style={{ width: 22, height: 22, color: "hsl(var(--primary))", flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--foreground))" }}>{block.content?.title}</div>
                <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>PDF Document</div>
              </div>
            </div>
            <button onClick={() => downloadWatermarkedPDF(block.content.url, block.content.title || "document.pdf", block.id)} disabled={isDownloading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 0", borderRadius: "var(--radius)", border: "none", background: isDownloading ? "hsl(var(--muted))" : "hsl(var(--primary))", color: isDownloading ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))", fontSize: 13, fontWeight: 700, cursor: isDownloading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {isDownloading ? <>
                <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} /><path fill="currentColor" style={{ opacity: 0.75 }} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Processing…
              </> : <><Download style={{ width: 15, height: 15 }} /> Download with Watermark</>}
            </button>
            {userEmail && <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", textAlign: "center", marginTop: 10 }}>Watermarked: {userEmail}</div>}
          </div>
        );
      }
      case "link":
        return (
          <a key={block.id} href={block.content?.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "hsl(var(--primary))", borderRadius: "var(--radius)", marginBottom: 14, textDecoration: "none", boxShadow: "0 2px 8px hsl(var(--primary) / 0.25)" }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🔗</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--primary-foreground))" }}>{block.content?.title}</div>
              {block.content?.description && <div style={{ fontSize: 12, color: "hsl(var(--primary-foreground) / 0.7)", marginTop: 2 }}>{block.content.description}</div>}
            </div>
          </a>
        );
      case "quiz":
        return renderQuiz(block);
      default:
        return null;
    }
  }, [renderQuiz, downloadWatermarkedPDF, downloadingPdf, userEmail]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const accentColor = moduleData?.accent_color || "hsl(var(--primary))";
  const isLastPage = activePage === totalPages - 1;
  const isModuleComplete = completed.size === totalPages && totalPages > 0;
  const donePages = completed.size;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚓</div>
        <div style={{ fontSize: 16, color: "hsl(var(--muted-foreground))" }}>Loading module…</div>
      </div>
    </div>
  );

  if (!moduleData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16 }}>Module not found</div>
      </div>
    </div>
  );

  const currentPage = pages[activePage];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>

      {/* ── LEFT NAV ── */}
      <aside style={{
        width: 280, minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #e8eaed",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        overflowY: "auto", flexShrink: 0,
      }}>

        {/* Module header — blue accent strip at top */}
        <div style={{ background: "hsl(var(--primary))", padding: "18px 16px 16px" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600, marginBottom: 4 }}>
            {moduleData.category}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.35, marginBottom: 14 }}>
            {moduleData.title}
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                width: `${totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0}%`,
                height: "100%", background: "#fff",
                borderRadius: 99, transition: "width 0.5s cubic-bezier(.4,0,.2,1)"
              }} />
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 700, minWidth: 28, textAlign: "right" }}>
              {totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0}%
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
            {donePages}/{totalPages} pages · {pages.reduce((s, p) => s + (p.estimatedMinutes || 5), 0)} min total
          </div>
        </div>

        {/* Page nav */}
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {pages.map((page, i) => {
            const isActive = i === activePage;
            const isCompleted = completed.has(i);
            const icon = SECTION_ICONS[i % SECTION_ICONS.length];

            return (
              <div key={page.id} style={{ position: "relative" }}>
                {isActive && (
                  <span style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: "60%", borderRadius: "0 3px 3px 0",
                    background: "hsl(var(--primary))",
                  }} />
                )}
                <button onClick={() => goTo(i)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8,
                  border: "1px solid transparent",
                  width: "100%", textAlign: "left",
                  background: isActive ? "hsl(221 91% 96%)" : "transparent",
                  cursor: "pointer", transition: "background 0.15s",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    background: isCompleted
                      ? "hsl(var(--primary))"
                      : isActive
                      ? "hsl(var(--primary))"
                      : "#f1f3f5",
                    color: isCompleted || isActive ? "#fff" : "#6b7280",
                    fontWeight: 700, fontSize: isCompleted ? 13 : 14,
                  }}>
                    {isCompleted ? "✓" : icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: isActive ? 600 : 400, lineHeight: 1.3,
                      color: isActive ? "hsl(var(--primary))" : isCompleted ? "#374151" : "#9ca3af",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {page.title || `Page ${i + 1}`}
                    </div>
                    <div style={{ fontSize: 10, color: "#c4c9d1", marginTop: 2 }}>
                      {page.estimatedMinutes || 5} min
                    </div>
                  </div>
                  {isCompleted && !isActive && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--primary))", flexShrink: 0, opacity: 0.5 }} />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #e8eaed" }}>
          <div style={{
            fontSize: 11, textAlign: "center", fontWeight: 500,
            color: isModuleComplete ? "hsl(var(--primary))" : "#9ca3af",
          }}>
            {isModuleComplete ? "🏅 Module Complete!" : "🏅 Complete all pages to finish"}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main ref={contentRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", background: "hsl(var(--muted))" }}>

        {/* Top bar */}
        <div style={{
          padding: "16px 64px",
          display: "flex", alignItems: "center", gap: 12,
          background: "hsl(var(--primary))",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 18 }}>{SECTION_ICONS[activePage % SECTION_ICONS.length]}</span>
          <div>
            <div style={{ fontSize: 11, color: "hsl(var(--primary-foreground) / 0.65)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
              Page {activePage + 1} of {totalPages}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--primary-foreground))" }}>
              {currentPage?.title || `Page ${activePage + 1}`}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            {saving && <span style={{ fontSize: 11, color: "hsl(var(--primary-foreground) / 0.6)" }}>Saving…</span>}
            <span style={{ fontSize: 12, color: "hsl(var(--primary-foreground) / 0.7)", background: "hsl(var(--primary-foreground) / 0.12)", padding: "4px 10px", borderRadius: 99 }}>⏱ {currentPage?.estimatedMinutes || 5} min</span>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: "44px 64px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
          {/* Page title heading */}
          {currentPage?.title && (
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "hsl(var(--foreground))", marginBottom: 28, lineHeight: 1.15, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: "hsl(var(--primary))", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {SECTION_ICONS[activePage % SECTION_ICONS.length]}
              </span>
              {currentPage.title}
            </h2>
          )}

          <div style={{ minHeight: 300 }}>
            {currentPage?.blocks && currentPage.blocks.length > 0
              ? currentPage.blocks.map(block => renderBlock(block))
              : <div style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, fontStyle: "italic" }}>No content on this page yet.</div>
            }
          </div>
        </div>

        {/* Bottom navigation */}
        <div style={{
          padding: "20px 64px",
          borderTop: "1px solid hsl(var(--border))",
          display: "flex", alignItems: "center", gap: 14,
          marginTop: "auto",
          background: "hsl(var(--card))",
          boxShadow: "0 -2px 12px hsl(var(--foreground) / 0.05)",
        }}>
          <button onClick={goPrev} disabled={activePage === 0}
            style={{
              padding: "11px 22px",
              borderRadius: "var(--radius)",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
              color: activePage === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
              fontSize: 13, fontWeight: 500,
              cursor: activePage === 0 ? "not-allowed" : "pointer",
            }}>
            ← Previous
          </button>

          <div style={{ flex: 1 }}>
            <ProgressBar current={donePages} total={totalPages} />
          </div>

          {/* Per-page toggle */}
          {completed.has(activePage) ? (
            <button onClick={() => toggleComplete(activePage)} disabled={saving}
              style={{
                padding: "11px 22px",
                borderRadius: "var(--radius)",
                border: "1px solid hsl(var(--primary) / 0.3)",
                background: "hsl(var(--accent))",
                color: "hsl(var(--primary))",
                fontSize: 13, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 7,
              }}>
              <span style={{ fontSize: 15 }}>✓</span> Completed — Undo
            </button>
          ) : !isLastPage ? (
            <button onClick={goNext} disabled={saving}
              style={{
                padding: "11px 24px",
                borderRadius: "var(--radius)",
                border: "none",
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontSize: 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)",
              }}>
              Mark Complete & Continue →
            </button>
          ) : (
            <button onClick={() => toggleComplete(activePage)} disabled={saving}
              style={{
                padding: "11px 24px",
                borderRadius: "var(--radius)",
                border: isModuleComplete ? "1px solid hsl(var(--primary) / 0.3)" : "none",
                background: isModuleComplete ? "hsl(var(--accent))" : "hsl(var(--primary))",
                color: isModuleComplete ? "hsl(var(--primary))" : "hsl(var(--primary-foreground))",
                fontSize: 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: isModuleComplete ? "none" : "0 4px 14px hsl(var(--primary) / 0.3)",
              }}>
              {isModuleComplete ? "✓ Module Complete!" : "🏆 Complete Module"}
            </button>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}