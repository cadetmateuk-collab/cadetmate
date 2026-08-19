"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CheckCircle2, FileText, Download, Pen, Highlighter, Trash2, Eraser, MousePointer2, ZoomIn, ZoomOut, RotateCcw, Menu, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { sanitizeHtml } from "@/lib/security/sanitize-html";
import { useAuthUserId } from "@/lib/hooks/useAuthUserId";

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

type Tool = "select" | "draw" | "highlight" | "erase";

interface Stroke {
  tool: "draw" | "highlight";
  color: string;
  width: number;
  points: { x: number; y: number }[]; // world-space coords
}

interface EraseMask {
  tool: "erase";
  width: number;
  points: { x: number; y: number }[];
}

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
  const isMobile = useIsMobile();
  const { userId: authUserId } = useAuthUserId();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentDivRef = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // ── Pan / Zoom ────────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const isPanning       = useRef(false);
  const panStart        = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Keep refs in sync for use inside non-React event handlers
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  // ── Drawing ───────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [penColor, setPenColor]     = useState("#2966F4");
  const [hlColor,  setHlColor]      = useState("#FFD600");
  const [thickness, setThickness]   = useState(3);
  const strokes     = useRef<(Stroke | EraseMask)[]>([]);
  const currentStroke = useRef<(Stroke | EraseMask) | null>(null);
  const isDrawing   = useRef(false);
  const hlBuffer    = useRef<HTMLCanvasElement | null>(null);
  // refs for zoom/pan used inside event handlers without stale closure
  const zoomRef = useRef(1);
  const panRef  = useRef({ x: 0, y: 0 });

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
    setResolvedUserId(userId || authUserId);
  }, [userId, authUserId]);

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
        const params = new URLSearchParams(window.location.search);
        const sectionParam = Number(params.get('section'));
        if (Number.isFinite(sectionParam) && sectionParam >= 1 && totalPages > 0) {
          setActivePage(Math.min(totalPages - 1, sectionParam - 1));
        } else {
          const lastDone = Math.max(...Array.from(completedSet));
          setActivePage(Math.min(lastDone + 1, totalPages - 1));
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        const sectionParam = Number(params.get('section'));
        if (Number.isFinite(sectionParam) && sectionParam >= 1 && totalPages > 0) {
          setActivePage(Math.min(totalPages - 1, sectionParam - 1));
        }
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

      const { logClientActivity } = await import('@/lib/activity/log-event-client');
      void logClientActivity({
        action: 'lesson.completed',
        entityType: 'module',
        entityId: moduleData.id,
        entityTitle: moduleData.title ?? null,
        metadata: { pageIndex, progressPct },
      });
      if (isComplete) {
        void logClientActivity({
          action: 'module.completed',
          entityType: 'module',
          entityId: moduleData.id,
          entityTitle: moduleData.title ?? null,
          metadata: { progressPct },
        });
      }
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
    setPan({ x: 0, y: 0 });
    setZoom(1);
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
      <div key={block.id} style={{ marginBottom: 36, marginTop: 8 }}>

        {/* Quiz title + progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--primary))", textTransform: "uppercase", letterSpacing: "1px" }}>
            {block.content?.title || "Quiz"}
          </div>
          <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
            {currentIdx + 1} / {totalQ}
          </div>
        </div>

        {/* Thin progress bar */}
        <div style={{ height: 2, background: "hsl(var(--border))", borderRadius: 99, overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            width: `${((currentIdx + 1) / totalQ) * 100}%`, height: "100%",
            background: "hsl(var(--primary))", borderRadius: 99, transition: "width 0.3s"
          }} />
        </div>

        {currentQuestion && (
          <div>
            {/* Question text */}
            <div style={{ fontSize: 16, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 16, lineHeight: 1.6 }}>
              {currentQuestion.question}
            </div>

            {/* Multiple Choice / Multi-Select */}
            {["multiple-choice", "multi-select"].includes(currentQuestion.type) && currentQuestion.options && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQuestion.options.map((opt, i) => {
                  const selected = currentQuestion.type === "multi-select"
                    ? Array.isArray(quizAnswers[`${block.id}-${currentQuestion.id}`]) && quizAnswers[`${block.id}-${currentQuestion.id}`].includes(i)
                    : quizAnswers[`${block.id}-${currentQuestion.id}`] === i;
                  const isCorrect = currentQuestion.type === "multi-select"
                    ? Array.isArray(currentQuestion.correctAnswer) && (currentQuestion.correctAnswer as number[]).includes(i)
                    : currentQuestion.correctAnswer === i;

                  let borderColor = "hsl(var(--border))";
                  let textColor   = "hsl(var(--foreground))";
                  if (selected && !isSubmitted)          { borderColor = "hsl(var(--primary))"; }
                  if (isSubmitted && isCorrect)           { borderColor = "hsl(var(--primary))"; textColor = "hsl(var(--primary))"; }
                  if (isSubmitted && selected && !isCorrect) { borderColor = "hsl(var(--destructive))"; textColor = "hsl(var(--destructive))"; }

                  return (
                    <button key={i}
                      onClick={() => !isSubmitted && handleQuizAnswer(block.id, currentQuestion.id,
                        currentQuestion.type === "multi-select"
                          ? (() => { const cur = Array.isArray(quizAnswers[`${block.id}-${currentQuestion.id}`]) ? quizAnswers[`${block.id}-${currentQuestion.id}`] : []; return cur.includes(i) ? cur.filter((x: number) => x !== i) : [...cur, i]; })()
                          : i
                      )}
                      disabled={isSubmitted}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 8,
                        border: `1px solid ${borderColor}`,
                        background: "transparent",
                        cursor: isSubmitted ? "default" : "pointer",
                        textAlign: "left", transition: "border-color 0.15s",
                      }}>
                      <div style={{
                        width: 16, height: 16, flexShrink: 0,
                        borderRadius: currentQuestion.type === "multi-select" ? 4 : 99,
                        border: `2px solid ${selected ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                        background: selected ? "hsl(var(--primary))" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <div style={{ width: 6, height: 6, borderRadius: 99, background: "#fff" }} />}
                      </div>
                      <span style={{ fontSize: 14, color: textColor, lineHeight: 1.4 }}>{opt}</span>
                      {isSubmitted && isCorrect && <span style={{ marginLeft: "auto", fontSize: 11, color: "hsl(var(--primary))", fontWeight: 700 }}>✓</span>}
                      {isSubmitted && selected && !isCorrect && <span style={{ marginLeft: "auto", fontSize: 11, color: "hsl(var(--destructive))", fontWeight: 700 }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.type === "true-false" && (
              <div style={{ display: "flex", gap: 8 }}>
                {["True", "False"].map((lbl, i) => {
                  const selected  = quizAnswers[`${block.id}-${currentQuestion.id}`] === i;
                  const isCorrect = currentQuestion.correctAnswer === i;
                  let borderColor = "hsl(var(--border))";
                  let color       = "hsl(var(--foreground))";
                  if (selected && !isSubmitted)              { borderColor = "hsl(var(--primary))"; color = "hsl(var(--primary))"; }
                  if (isSubmitted && isCorrect)              { borderColor = "hsl(var(--primary))"; color = "hsl(var(--primary))"; }
                  if (isSubmitted && selected && !isCorrect) { borderColor = "hsl(var(--destructive))"; color = "hsl(var(--destructive))"; }
                  return (
                    <button key={lbl} onClick={() => !isSubmitted && handleQuizAnswer(block.id, currentQuestion.id, i)} disabled={isSubmitted}
                      style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "transparent", color, fontSize: 14, fontWeight: 600, cursor: isSubmitted ? "default" : "pointer", transition: "all 0.15s" }}>
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
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid hsl(var(--border))", background: "transparent", color: "hsl(var(--foreground))", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                {isSubmitted && (
                  <div style={{ marginTop: 8, fontSize: 13, color: isAnswerCorrect(currentQuestion) ? "hsl(var(--primary))" : "hsl(var(--destructive))", fontWeight: 600 }}>
                    {isAnswerCorrect(currentQuestion) ? "✓ Correct!" : `✗ Keywords: ${currentQuestion.keywords?.join(", ")}`}
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            {isSubmitted && currentQuestion.explanation && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid hsl(var(--border))" }}>
                <span style={{ fontSize: 12, color: "hsl(var(--primary))", fontWeight: 600 }}>💡 </span>
                <span style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>{currentQuestion.explanation}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation / submit */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          {!isSubmitted ? (
            <>
              <button
                onClick={() => setQuizQuestionIndex(prev => ({ ...prev, [block.id]: Math.max(0, (prev[block.id] || 0) - 1) }))}
                disabled={currentIdx === 0}
                style={{ fontSize: 13, color: currentIdx === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))", background: "none", border: "none", cursor: currentIdx === 0 ? "default" : "pointer", padding: 0 }}>
                ← Previous
              </button>
              {currentIdx < totalQ - 1 ? (
                <button
                  onClick={() => setQuizQuestionIndex(prev => ({ ...prev, [block.id]: Math.min(totalQ - 1, (prev[block.id] || 0) + 1) }))}
                  style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => submitQuiz(block.id, questions)}
                  style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: "hsl(var(--primary))", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
                  Submit
                </button>
              )}
            </>
          ) : (
            <div style={{ fontSize: 14, color: "hsl(var(--muted-foreground))" }}>
              Score: <span style={{ fontWeight: 700, color: score === totalQ ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>{score}/{totalQ}</span>
              {" — "}{score === totalQ ? "🎉 Perfect!" : score >= totalQ / 2 ? "👍 Good work!" : "📚 Keep studying!"}
            </div>
          )}
        </div>
      </div>
    );
  }, [quizAnswers, quizSubmitted, quizQuestionIndex, handleQuizAnswer, checkTextInputAnswer, submitQuiz]);

  const renderBlock = useCallback((block: ContentBlock) => {
    switch (block.type) {
      case "heading": {
        const level = block.content?.level || 2;
        const sizes: Record<number, string> = { 1: "2rem", 2: "1.5rem", 3: "1.2rem" };
        return (
          <div key={block.id} style={{ fontSize: sizes[level] || "1.5rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.2, marginBottom: 8, marginTop: level === 1 ? 8 : 32 }}>
            {block.content?.text}
          </div>
        );
      }
      case "text":
        return (
          <div key={block.id} style={{ fontSize: 15, lineHeight: 1.8, color: "hsl(var(--foreground))", marginBottom: 4 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content?.text || "") }} />
        );
      case "image":
        return (
          <figure key={block.id} style={{ marginBottom: 24, borderRadius: "var(--radius)", overflow: "hidden" }}>
            <img
              src={block.content?.url}
              alt={block.content?.caption ? "" : "Module illustration"}
              style={{ width: "100%", display: "block" }}
              onError={e => (e.currentTarget.style.display = "none")}
            />
            {block.content?.caption && (
              <figcaption style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", textAlign: "center", padding: "8px 12px" }}>
                {block.content.caption}
              </figcaption>
            )}
          </figure>
        );
      case "video":
        return (
          <div key={block.id} style={{ marginBottom: 24, borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ aspectRatio: "16/9", background: "hsl(var(--muted))" }}>
              <iframe
                src={block.content?.url}
                title={block.content?.caption || 'Embedded training video'}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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

  // ── Canvas render — redraws all strokes with current transform ───────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const z = zoomRef.current;
    const p = panRef.current;

    // Helper: convert world point → canvas pixel
    const toCanvas = (pt: { x: number; y: number }) => ({
      x: pt.x * z + p.x,
      y: pt.y * z + p.y,
    });

    // Draw all committed strokes
    for (const s of strokes.current) {
      if (s.points.length < 2) continue;
      const pts = s.points.map(toCanvas);

      if (s.tool === "erase") {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        ctx.lineWidth   = s.width * z;
        ctx.lineCap     = "round";
        ctx.lineJoin    = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        ctx.restore();
      } else if (s.tool === "highlight") {
        // Draw into offscreen, blit at opacity
        const buf = document.createElement("canvas");
        buf.width  = canvas.width;
        buf.height = canvas.height;
        const bCtx = buf.getContext("2d")!;
        bCtx.strokeStyle = s.color;
        bCtx.lineWidth   = s.width * z;
        bCtx.lineCap     = "round";
        bCtx.lineJoin    = "round";
        bCtx.beginPath();
        bCtx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          bCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        bCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        bCtx.stroke();
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha  = 1;
        ctx.strokeStyle  = s.color;
        ctx.lineWidth    = s.width * z;
        ctx.lineCap      = "round";
        ctx.lineJoin     = "round";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, []);

  // Redraw whenever zoom or pan changes
  useEffect(() => { redrawCanvas(); }, [zoom, pan, redrawCanvas]);

  // ── Canvas resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const vp     = viewportRef.current;
      if (!canvas || !vp) return;
      canvas.width  = vp.offsetWidth;
      canvas.height = vp.offsetHeight;
      redrawCanvas();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redrawCanvas]);

  // Reset strokes + view when page changes
  useEffect(() => {
    strokes.current = [];
    currentStroke.current = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [activePage]);

  // ── Pan clamping — keeps content within reasonable bounds ────────────────
  const clampPan = useCallback((px: number, py: number, z: number) => {
    const vp = viewportRef.current;
    if (!vp) return { x: px, y: py };
    const vpW = vp.offsetWidth;
    const vpH = vp.offsetHeight;
    const contentW = 980 * z;
    // Measure actual rendered content height, fall back to generous estimate
    const rawH = contentDivRef.current?.offsetHeight ?? 2400;
    const contentH = rawH * z;
    const slack = Math.max(contentW / 2, vpW / 2);
    const minX = -slack;
    const maxX =  slack;
    const minY = Math.min(0, vpH - contentH - 40); // 40px bottom breathing room
    const maxY = 0;
    return {
      x: Math.min(maxX, Math.max(minX, px)),
      y: Math.min(maxY, Math.max(minY, py)),
    };
  }, []);

  // ── Middle-mouse pan ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      isPanning.current = true;
      panStart.current  = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
      el.style.cursor   = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const nx = panStart.current.px + (e.clientX - panStart.current.mx);
      const ny = panStart.current.py + (e.clientY - panStart.current.my);
      setPan(clampPan(nx, ny, zoomRef.current));
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 1) return;
      isPanning.current = false;
      el.style.cursor   = "";
    };

    el.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      el.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [clampPan]);

  // ── Scroll-wheel: scroll up/down; Shift+wheel: zoom pivoted on cursor ──────
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        // Zoom pivoted on cursor
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        const rect  = el.getBoundingClientRect();
        const mx    = e.clientX - rect.left;
        const my    = e.clientY - rect.top;
        setZoom(prevZoom => {
          const nextZoom = Math.min(3, Math.max(0.4, +(prevZoom + delta).toFixed(2)));
          setPan(prevPan => {
            const nx = mx - ((mx - prevPan.x) / prevZoom) * nextZoom;
            const ny = my - ((my - prevPan.y) / prevZoom) * nextZoom;
            return clampPan(nx, ny, nextZoom);
          });
          return nextZoom;
        });
      } else {
        // Plain scroll — pan vertically (and horizontally for trackpads)
        setPan(prev => {
          const z = zoomRef.current;
          return clampPan(prev.x - e.deltaX, prev.y - e.deltaY, z);
        });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampPan]);

  // ── Zoom button helpers ───────────────────────────────────────────────────
  const zoomBy    = useCallback((d: number) => setZoom(z => Math.min(3, Math.max(0.4, +(z + d).toFixed(2)))), []);
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // ── Canvas drawing — world-space coords, smoothed bezier ─────────────────
  const canvasToWorld = (cx: number, cy: number) => ({
    x: (cx - panRef.current.x) / zoomRef.current,
    y: (cy - panRef.current.y) / zoomRef.current,
  });

  const getCanvasPoint = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt    = getCanvasPoint(e);
    const world = canvasToWorld(pt.x, pt.y);
    isDrawing.current = true;
    canvas.setPointerCapture(e.pointerId);

    if (activeTool === "erase") {
      currentStroke.current = { tool: "erase", width: thickness * 4, points: [world] };
    } else if (activeTool === "highlight") {
      currentStroke.current = { tool: "highlight", color: hlColor, width: thickness * 6, points: [world] };
    } else {
      currentStroke.current = { tool: "draw", color: penColor, width: thickness, points: [world] };
    }
  }, [activeTool, penColor, hlColor, thickness]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !currentStroke.current) return;
    const pt    = getCanvasPoint(e);
    const world = canvasToWorld(pt.x, pt.y);
    currentStroke.current.points.push(world);

    // Live preview: redraw all committed + current in-progress stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d")!;
    const z     = zoomRef.current;
    const p     = panRef.current;
    const toCanvas = (wpt: { x: number; y: number }) => ({ x: wpt.x * z + p.x, y: wpt.y * z + p.y });

    redrawCanvas();

    const s   = currentStroke.current;
    const pts = s.points.map(toCanvas);
    if (pts.length < 2) return;

    if (s.tool === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = s.width * z;
      ctx.lineCap   = "round";
      ctx.lineJoin  = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      ctx.restore();
    } else if (s.tool === "highlight") {
      const buf = document.createElement("canvas");
      buf.width  = canvas.width;
      buf.height = canvas.height;
      const bCtx = buf.getContext("2d")!;
      bCtx.strokeStyle = s.color;
      bCtx.lineWidth   = s.width * z;
      bCtx.lineCap     = "round";
      bCtx.lineJoin    = "round";
      bCtx.beginPath();
      bCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        bCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      bCtx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      bCtx.stroke();
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(buf, 0, 0);
      ctx.restore();
    } else {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = s.width * z;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      ctx.restore();
    }
  }, [activeTool, redrawCanvas]);

  const onCanvasPointerUp = useCallback(() => {
    isDrawing.current = false;
    if (currentStroke.current && currentStroke.current.points.length >= 2) {
      strokes.current = [...strokes.current, currentStroke.current];
    }
    currentStroke.current = null;
    redrawCanvas();
  }, [redrawCanvas]);

  const clearCanvas = useCallback(() => {
    strokes.current = [];
    currentStroke.current = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const accentColor = moduleData?.accent_color || "hsl(var(--primary))";
  const isLastPage = activePage === totalPages - 1;
  const isModuleComplete = completed.size === totalPages && totalPages > 0;
  const donePages = completed.size;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 0, background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚓</div>
        <div style={{ fontSize: 16, color: "hsl(var(--muted-foreground))" }}>Loading module…</div>
      </div>
    </div>
  );

  if (!moduleData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 0, background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16 }}>Module not found</div>
      </div>
    </div>
  );

  const currentPage = pages[activePage];

  return (
    <div style={{
      display: "flex",
      height: "100%",
      minHeight: 0,
      flex: 1,
      overflow: "hidden",
      position: "relative",
      background: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
    }}>

      {/* ── MOBILE NAV OVERLAY ── */}
      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "absolute", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── MOBILE NAV DRAWER ── */}
      {isMobile && (
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, zIndex: 60,
          width: 300, maxWidth: "85vw",
          background: "#fff",
          display: "flex", flexDirection: "column",
          transform: mobileNavOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
          boxShadow: mobileNavOpen ? "4px 0 32px rgba(0,0,0,0.18)" : "none",
        }}>
          {/* Drawer header */}
          <div style={{ background: "hsl(var(--primary))", padding: "0 16px", height: 60, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>
                {moduleData.category}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                {moduleData.title}
              </div>
            </div>
            <button onClick={() => setMobileNavOpen(false)} style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Page nav */}
          <nav style={{ padding: "10px 8px", flex: 1, overflowY: "auto" }}>
            {pages.map((page, i) => {
              const isActive = i === activePage;
              const isCompleted = completed.has(i);
              const icon = SECTION_ICONS[i % SECTION_ICONS.length];
              return (
                <div key={page.id} style={{ position: "relative" }}>
                  {isActive && (
                    <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: "60%", borderRadius: "0 3px 3px 0", background: "hsl(var(--primary))" }} />
                  )}
                  <button onClick={() => { goTo(i); setMobileNavOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8,
                    border: "1px solid transparent",
                    width: "100%", textAlign: "left",
                    background: isActive ? "hsl(221 91% 96%)" : "transparent",
                    cursor: "pointer", transition: "background 0.15s",
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isCompleted ? "hsl(var(--primary))" : isActive ? "hsl(var(--primary))" : "#f1f3f5", color: isCompleted || isActive ? "#fff" : "#6b7280", fontWeight: 700, fontSize: isCompleted ? 13 : 14 }}>
                      {isCompleted ? "✓" : icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, lineHeight: 1.3, color: isActive ? "hsl(var(--primary))" : isCompleted ? "#374151" : "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {page.title || `Page ${i + 1}`}
                      </div>
                      <div style={{ fontSize: 10, color: "#c4c9d1", marginTop: 2 }}>{page.estimatedMinutes || 5} min</div>
                    </div>
                    {isCompleted && !isActive && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--primary))", flexShrink: 0, opacity: 0.5 }} />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Progress footer */}
          <div style={{ padding: "12px 16px", flexShrink: 0, borderTop: "1px solid #e8eaed" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--primary))" }}>{totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0}%</span>
            </div>
            <div style={{ height: 5, background: "hsl(var(--muted))", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0}%`, height: "100%", background: "hsl(var(--primary))", borderRadius: 99, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{donePages} of {totalPages} pages complete</div>
          </div>
        </div>
      )}

      {/* ── LEFT NAV (desktop only) — fills module area height ── */}
      {!isMobile && <aside style={{
        width: 280,
        height: "100%",
        background: "#fff",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        flexShrink: 0,
        alignSelf: "stretch",
      }}>

        {/* Module header — fixed height to match top bar */}
        <div style={{ background: "hsl(var(--primary))", padding: "0 16px", height: 60, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 600 }}>
            {moduleData.category}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {moduleData.title}
          </div>
        </div>

        {/* Page nav */}
        <nav style={{ padding: "10px 8px", flex: 1, minHeight: 0, overflowY: "auto", borderRight: "1px solid #e8eaed" }}>
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
                    display: "flex", alignItems: "center", justifyContent: "center",
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

        <div style={{ padding: "0 16px", height: 68, flexShrink: 0, borderTop: "1px solid #e8eaed", borderRight: "1px solid #e8eaed", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--primary))" }}>{totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0}%</span>
          </div>
          <div style={{ height: 5, background: "hsl(var(--muted))", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              width: `${totalPages > 0 ? Math.round((donePages / totalPages) * 100) : 0}%`,
              height: "100%", background: "hsl(var(--primary))",
              borderRadius: 99, transition: "width 0.5s cubic-bezier(.4,0,.2,1)"
            }} />
          </div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{donePages} of {totalPages} pages complete</div>
        </div>
      </aside>}

      {/* ── MAIN CONTENT ── */}
      <main ref={contentRef} style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "hsl(var(--background))",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Paper noise background */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
          opacity: 0.028,
          mixBlendMode: "multiply",
        }} />

        {/* Top bar — sticky within module main column */}
        <div style={{
          padding: isMobile ? "0 16px" : "0 24px 0 32px",
          height: 60, flexShrink: 0,
          display: "flex", alignItems: "center", gap: isMobile ? 10 : 12,
          background: "hsl(var(--primary))",
          position: "sticky", top: 0, zIndex: 10,
          borderLeft: "1px solid rgba(255,255,255,0.15)",
        }}>
          {/* Mobile: hamburger + title */}
          {isMobile && (
            <button onClick={() => setMobileNavOpen(true)} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <Menu style={{ width: 18, height: 18 }} />
            </button>
          )}

          <div style={{ flex: isMobile ? 1 : undefined, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "hsl(var(--primary-foreground) / 0.65)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
              Page {activePage + 1} of {totalPages}
            </div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: "hsl(var(--primary-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentPage?.title || `Page ${activePage + 1}`}
            </div>
          </div>

          {/* Desktop: zoom controls + hint */}
          {!isMobile && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
                Shift+scroll to zoom · Middle mouse to pan
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "4px 6px", border: "1px solid rgba(255,255,255,0.15)" }}>
                <button title="Zoom out" onClick={() => zoomBy(-0.1)}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#fff", cursor: "pointer" }}>
                  <ZoomOut style={{ width: 14, height: 14 }} />
                </button>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                <button title="Zoom in" onClick={() => zoomBy(0.1)}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#fff", cursor: "pointer" }}>
                  <ZoomIn style={{ width: 14, height: 14 }} />
                </button>
                <button title="Reset view" onClick={resetView}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#fff", cursor: "pointer" }}>
                  <RotateCcw style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, marginLeft: isMobile ? 0 : 12 }}>
            {saving && <span style={{ fontSize: 11, color: "hsl(var(--primary-foreground) / 0.6)" }}>Saving…</span>}
            <span style={{ fontSize: 12, color: "hsl(var(--primary-foreground) / 0.7)", background: "hsl(var(--primary-foreground) / 0.12)", padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>⏱ {currentPage?.estimatedMinutes || 5} min</span>
          </div>
        </div>

        {/* Pan/Zoom viewport — middle mouse pans, scroll zooms */}
        <div
          ref={viewportRef}
          style={{ flex: 1, position: "relative", overflow: isMobile ? "auto" : "hidden" }}
        >
          {/* Pannable / zoomable content */}
          <div style={isMobile ? { padding: 0 } : {
            position: "absolute", top: 0, left: 0, right: 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}>
            <div
              ref={contentDivRef}
              className="no-copy"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              style={{
              padding: isMobile ? "24px 20px 0" : "44px 64px",
              maxWidth: 980, margin: "0 auto", width: "100%",
              position: "relative", zIndex: 1, boxSizing: "border-box",
            }}>
              {currentPage?.title && (
                <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "hsl(var(--foreground))", marginBottom: isMobile ? 20 : 28, lineHeight: 1.15 }}>
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
          </div>

          {/* Drawing canvas — desktop only */}
          {!isMobile && <canvas
            ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerLeave={onCanvasPointerUp}
            style={{
              position: "absolute", inset: 0, zIndex: 5,
              pointerEvents: activeTool === "select" ? "none" : "auto",
              cursor: activeTool === "draw" ? "crosshair"
                    : activeTool === "highlight" ? "cell"
                    : activeTool === "erase" ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23666'/%3E%3C/svg%3E") 12 12, crosshair`
                    : "default",
            }}
          />}

          {/* ── Floating drawing toolbar — desktop only ── */}
          {!isMobile && <div style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            zIndex: 20,
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 14,
            boxShadow: "0 4px 20px hsl(var(--foreground) / 0.10)",
            padding: "10px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          }}>
            {/* Tool buttons */}
            {([
              { tool: "select"    as Tool, icon: MousePointer2, title: "Select / Click" },
              { tool: "draw"      as Tool, icon: Pen,           title: "Pen" },
              { tool: "highlight" as Tool, icon: Highlighter,   title: "Highlight" },
              { tool: "erase"     as Tool, icon: Eraser,        title: "Eraser" },
            ]).map(({ tool, icon: Icon, title }) => (
              <button key={tool} title={title} onClick={() => setActiveTool(tool)}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: activeTool === tool ? "hsl(var(--primary))" : "transparent",
                  color: activeTool === tool ? "#fff" : "hsl(var(--muted-foreground))",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                <Icon style={{ width: 15, height: 15 }} />
              </button>
            ))}

            {/* Divider */}
            <div style={{ width: 20, height: 1, background: "hsl(var(--border))", margin: "2px 0" }} />

            {/* Thickness slider */}
            <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Size</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <input type="range" min={1} max={12} step={1} value={thickness}
                onChange={e => setThickness(Number(e.target.value))}
                style={{ writingMode: "vertical-lr", direction: "rtl", width: 20, height: 72, cursor: "pointer", accentColor: "hsl(var(--primary))" }}
              />
              <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontWeight: 600 }}>{thickness}</span>
            </div>

            {/* Divider */}
            <div style={{ width: 20, height: 1, background: "hsl(var(--border))", margin: "2px 0" }} />

            {/* Pen colour swatches */}
            <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Pen</div>
            {["#2966F4", "#e53e3e", "#38a169", "#d69e2e", "#805ad5", "#000000"].map(c => (
              <button key={c} title={c} onClick={() => { setPenColor(c); setActiveTool("draw"); }}
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: penColor === c && activeTool === "draw" ? "2px solid hsl(var(--foreground))" : "2px solid transparent",
                  background: c, cursor: "pointer", padding: 0, outline: "none",
                  boxShadow: penColor === c && activeTool === "draw" ? "0 0 0 2px hsl(var(--background))" : "none",
                  transition: "box-shadow 0.15s",
                }} />
            ))}

            {/* Divider */}
            <div style={{ width: 20, height: 1, background: "hsl(var(--border))", margin: "2px 0" }} />

            {/* Highlighter colour swatches */}
            <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>HL</div>
            {["#FFD600", "#68d391", "#76e4f7", "#f687b3", "#fbd38d"].map(c => (
              <button key={c} title={c} onClick={() => { setHlColor(c); setActiveTool("highlight"); }}
                style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: hlColor === c && activeTool === "highlight" ? "2px solid hsl(var(--foreground))" : "2px solid transparent",
                  background: c, cursor: "pointer", padding: 0, outline: "none",
                  boxShadow: hlColor === c && activeTool === "highlight" ? "0 0 0 2px hsl(var(--background))" : "none",
                  transition: "box-shadow 0.15s",
                }} />
            ))}

            {/* Divider */}
            <div style={{ width: 20, height: 1, background: "hsl(var(--border))", margin: "2px 0" }} />

            {/* Clear all */}
            <button onClick={clearCanvas} title="Clear all drawings"
              style={{
                width: 34, height: 34, borderRadius: 8, border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", color: "hsl(var(--destructive))",
                cursor: "pointer", transition: "background 0.15s",
              }}>
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          </div>}
        </div>

        {/* Bottom navigation — sticky within module main column */}
        <div style={{
          padding: isMobile ? "0 16px" : "0 64px",
          height: isMobile ? 72 : 68, flexShrink: 0,
          borderTop: "1px solid hsl(var(--border))",
          display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
          background: "hsl(var(--card))",
          boxShadow: "0 -2px 12px hsl(var(--foreground) / 0.05)",
          position: "sticky", bottom: 0, zIndex: 1,
          ...(isMobile ? { paddingBottom: "env(safe-area-inset-bottom)" } : {}),
        }}>
          <button onClick={goPrev} disabled={activePage === 0}
            style={{
              padding: isMobile ? "10px 16px" : "11px 22px",
              borderRadius: "var(--radius)",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--background))",
              color: activePage === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
              fontSize: isMobile ? 14 : 13, fontWeight: 500,
              cursor: activePage === 0 ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}>
            ← {!isMobile && "Previous"}
          </button>

          <div style={{ flex: 1 }} />

          {/* Per-page toggle */}
          {completed.has(activePage) ? (
            <button onClick={() => toggleComplete(activePage)} disabled={saving}
              style={{
                padding: isMobile ? "10px 14px" : "11px 22px",
                borderRadius: "var(--radius)",
                border: "1px solid hsl(var(--primary) / 0.3)",
                background: "hsl(var(--accent))",
                color: "hsl(var(--primary))",
                fontSize: isMobile ? 13 : 13, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 7,
                whiteSpace: "nowrap",
              }}>
              <span style={{ fontSize: 15 }}>✓</span> {isMobile ? "Undo" : "Completed — Undo"}
            </button>
          ) : !isLastPage ? (
            <button onClick={goNext} disabled={saving}
              style={{
                padding: isMobile ? "10px 16px" : "11px 24px",
                borderRadius: "var(--radius)",
                border: "none",
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontSize: isMobile ? 13 : 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 4px 14px hsl(var(--primary) / 0.3)",
                whiteSpace: "nowrap",
              }}>
              {isMobile ? "Complete & Next →" : "Mark Complete & Continue →"}
            </button>
          ) : (
            <button onClick={() => toggleComplete(activePage)} disabled={saving}
              style={{
                padding: isMobile ? "10px 16px" : "11px 24px",
                borderRadius: "var(--radius)",
                border: isModuleComplete ? "1px solid hsl(var(--primary) / 0.3)" : "none",
                background: isModuleComplete ? "hsl(var(--accent))" : "hsl(var(--primary))",
                color: isModuleComplete ? "hsl(var(--primary))" : "hsl(var(--primary-foreground))",
                fontSize: isMobile ? 13 : 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: isModuleComplete ? "none" : "0 4px 14px hsl(var(--primary) / 0.3)",
                whiteSpace: "nowrap",
              }}>
              {isModuleComplete ? "✓ Complete!" : "Complete Module"}
            </button>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}