// @ts-nocheck
"use client";
import React from "react";
import { useState, useEffect, useRef, useCallback, useMemo, useReducer, memo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, Trash2, Type, Image as ImageIcon, Video, FileText,
  Link as LinkIcon, HelpCircle, Save, Bold, Italic,
  List, ListOrdered, Search, X, AlertCircle,
  ChevronLeft, ChevronRight, CheckSquare, ToggleLeft, AlignLeft,
  Loader2, LayoutTemplate, FilePlus, Check, ArrowUp, ArrowDown,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "multi-select" | "text-input";
  options?: string[];
  correctAnswer: string | number | number[];
  keywords?: string[];
  explanation?: string;
}

interface QuizContent {
  title: string;
  questions: QuizQuestion[];
}

type BlockType = "heading" | "text" | "image" | "video" | "pdf" | "link" | "quiz";

interface ContentBlock {
  id: string;
  type: BlockType;
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
  pages: Page[];
}

interface ModuleListItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBOUNCE_DELAY = 300;
const DEFAULT_CATEGORIES = ["Mathematics", "Science", "History", "Programming"];

const BLOCK_META: Record<BlockType, { icon: React.ElementType; label: string; color: string }> = {
  heading: { icon: Type,       label: "Heading", color: "bg-violet-100 text-violet-700" },
  text:    { icon: AlignLeft,  label: "Text",    color: "bg-blue-100 text-blue-700" },
  image:   { icon: ImageIcon,  label: "Image",   color: "bg-emerald-100 text-emerald-700" },
  video:   { icon: Video,      label: "Video",   color: "bg-rose-100 text-rose-700" },
  pdf:     { icon: FileText,   label: "PDF",     color: "bg-amber-100 text-amber-700" },
  link:    { icon: LinkIcon,   label: "Link",    color: "bg-cyan-100 text-cyan-700" },
  quiz:    { icon: HelpCircle, label: "Quiz",    color: "bg-orange-100 text-orange-700" },
};

// ============================================================================
// REDUCER
// ============================================================================

type ModuleAction =
  | { type: "SET_MODULE"; payload: ModuleData }
  | { type: "UPDATE_FIELD"; field: keyof ModuleData; value: any }
  | { type: "ADD_PAGE" }
  | { type: "DELETE_PAGE"; pageIndex: number }
  | { type: "UPDATE_PAGE_TITLE"; pageIndex: number; title: string }
  | { type: "UPDATE_PAGE_TIME"; pageIndex: number; minutes: number }
  | { type: "ADD_BLOCK"; pageIndex: number; block: ContentBlock }
  | { type: "INSERT_BLOCK"; pageIndex: number; atIndex: number; block: ContentBlock }
  | { type: "UPDATE_BLOCK"; pageIndex: number; blockId: string; content: any }
  | { type: "DELETE_BLOCK"; pageIndex: number; blockId: string }
  | { type: "MOVE_BLOCK_UP"; pageIndex: number; blockIndex: number }
  | { type: "MOVE_BLOCK_DOWN"; pageIndex: number; blockIndex: number }
  | { type: "RESET" };

function newPage(title = ""): Page {
  return { id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, title, estimatedMinutes: 5, blocks: [] };
}

const initialModuleState: ModuleData = {
  id: "", title: "", description: "", category: "", subcategory: "",
  pages: [newPage()],
};

function moduleReducer(state: ModuleData, action: ModuleAction): ModuleData {
  switch (action.type) {
    case "SET_MODULE": return action.payload;
    case "UPDATE_FIELD": return { ...state, [action.field]: action.value };

    case "ADD_PAGE":
      return { ...state, pages: [...state.pages, newPage()] };

    case "DELETE_PAGE": {
      const pages = state.pages.filter((_, i) => i !== action.pageIndex);
      return { ...state, pages: pages.length === 0 ? [newPage()] : pages };
    }

    case "UPDATE_PAGE_TITLE":
      return { ...state, pages: state.pages.map((p, i) => i === action.pageIndex ? { ...p, title: action.title } : p) };

    case "UPDATE_PAGE_TIME":
      return { ...state, pages: state.pages.map((p, i) => i === action.pageIndex ? { ...p, estimatedMinutes: action.minutes } : p) };

    case "ADD_BLOCK":
      return { ...state, pages: state.pages.map((p, i) => i === action.pageIndex ? { ...p, blocks: [...p.blocks, action.block] } : p) };

    case "INSERT_BLOCK":
      return {
        ...state,
        pages: state.pages.map((p, i) => {
          if (i !== action.pageIndex) return p;
          const blocks = [...p.blocks.slice(0, action.atIndex), action.block, ...p.blocks.slice(action.atIndex)];
          return { ...p, blocks };
        }),
      };

    case "UPDATE_BLOCK":
      return {
        ...state,
        pages: state.pages.map((p, i) =>
          i !== action.pageIndex ? p : { ...p, blocks: p.blocks.map(b => b.id === action.blockId ? { ...b, content: action.content } : b) }
        ),
      };

    case "DELETE_BLOCK":
      return {
        ...state,
        pages: state.pages.map((p, i) =>
          i !== action.pageIndex ? p : { ...p, blocks: p.blocks.filter(b => b.id !== action.blockId) }
        ),
      };

    case "MOVE_BLOCK_UP":
      return {
        ...state,
        pages: state.pages.map((p, i) => {
          if (i !== action.pageIndex || action.blockIndex === 0) return p;
          const blocks = [...p.blocks];
          [blocks[action.blockIndex - 1], blocks[action.blockIndex]] = [blocks[action.blockIndex], blocks[action.blockIndex - 1]];
          return { ...p, blocks };
        }),
      };

    case "MOVE_BLOCK_DOWN":
      return {
        ...state,
        pages: state.pages.map((p, i) => {
          if (i !== action.pageIndex || action.blockIndex >= p.blocks.length - 1) return p;
          const blocks = [...p.blocks];
          [blocks[action.blockIndex], blocks[action.blockIndex + 1]] = [blocks[action.blockIndex + 1], blocks[action.blockIndex]];
          return { ...p, blocks };
        }),
      };

    case "RESET":
      return { ...initialModuleState, pages: [newPage()] };

    default:
      return state;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function uid() {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function randomId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Deep-clone a raw JSON module, re-randomise every id so there are no collisions */
function randomiseIds(raw: any): ModuleData {
  const pages: Page[] = (raw.pages || []).map((p: any) => {
    const blocks: ContentBlock[] = (p.blocks || []).map((b: any) => {
      // Re-randomise quiz question ids too
      if (b.type === "quiz" && b.content?.questions) {
        return {
          ...b,
          id: randomId("block"),
          content: {
            ...b.content,
            questions: b.content.questions.map((q: any) => ({ ...q, id: randomId("q") })),
          },
        };
      }
      return { ...b, id: randomId("block") };
    });
    return { ...p, id: randomId("page"), blocks };
  });

  return {
    id: raw.id || "",
    title: raw.title || "",
    description: raw.description || "",
    category: raw.category || "",
    subcategory: raw.subcategory || "",
    pages: pages.length > 0 ? pages : [newPage()],
  };
}

function getDefaultContent(type: BlockType): any {
  const defaults: Record<BlockType, any> = {
    heading: { level: 2, text: "" },
    text:    { text: "" },
    image:   { url: "", caption: "" },
    video:   { url: "", caption: "" },
    pdf:     { url: "", title: "" },
    link:    { url: "", title: "", description: "" },
    quiz: {
      title: "Quiz",
      questions: [{
        id: `q-${Date.now()}`,
        question: "", type: "multiple-choice" as const,
        options: ["", "", "", ""], correctAnswer: 0, keywords: [], explanation: "",
      }],
    } as QuizContent,
  };
  return defaults[type];
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: NodeJS.Timeout;
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function normalizeBlock(block: any): ContentBlock {
  if (block.type === "quiz") {
    return { ...block, content: { title: block.content?.title || "Quiz", questions: Array.isArray(block.content?.questions) ? block.content.questions : [] } };
  }
  return block;
}

// Migrate from any API response shape into a clean Page[] array.
// API may return: { pages } | { content: { pages } } | { blocks } | { content: { blocks } }
function migrateToPages(raw: any): Page[] {
  // 1. New format — pages array (top-level OR nested under content)
  const pagesArr = raw.pages || raw.content?.pages;
  if (Array.isArray(pagesArr) && pagesArr.length > 0) {
    return pagesArr.map((p: any) => ({
      id: p.id || `page-${Math.random().toString(36).substr(2, 6)}`,
      title: p.title || "",
      estimatedMinutes: p.estimatedMinutes || 5,
      blocks: (p.blocks || []).map(normalizeBlock),
    }));
  }

  // Flat blocks — each page-break CLOSES a page and carries that page's title/time.
  // We only add a trailing page if there are leftover blocks after the last page-break.
  const rawBlocks: any[] = raw.blocks || raw.content?.blocks || [];
  if (rawBlocks.length === 0) return [newPage()];

  const pages: Page[] = [];
  let current: ContentBlock[] = [];
  let idx = 0;

  for (const block of rawBlocks) {
    if (block.type === "page-break") {
      // This page-break closes the current page — title/time live here
      pages.push({
        id: `page-${idx}`,
        title: block.content?.pageTitle || block.content?.label || "",
        estimatedMinutes: block.content?.estimatedMinutes || 5,
        blocks: current,
      });
      current = [];
      idx++;
    } else {
      current.push(normalizeBlock(block));
    }
  }

  // Only add a trailing page if there are leftover blocks with no closing page-break
  // (handles very old data that used page-breaks as separators not terminators)
  if (current.length > 0) {
    pages.push({
      id: `page-${idx}`,
      title: "",
      estimatedMinutes: 5,
      blocks: current,
    });
  }

  // Should always have at least one page
  return pages.length > 0 ? pages : [newPage()];
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
        <AlertCircle className="h-4 w-4 flex-shrink-0" /><span>Error: {this.state.error?.message}</span>
      </div>
    );
    return this.props.children;
  }
}

// ============================================================================
// RICH TEXT EDITOR
// ============================================================================

const RichTextEditor = memo(function RichTextEditor({
  value, onChange, placeholder = "Enter text…", minHeight = "120px",
}: { value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (ref.current && !focused.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const debouncedChange = useMemo(() => debounce((html: string) => onChange(html), DEBOUNCE_DELAY), [onChange]);
  const exec = (cmd: string) => { document.execCommand(cmd, false); ref.current?.focus(); setTimeout(() => ref.current && onChange(ref.current.innerHTML), 0); };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80">
        {[{ cmd: "bold", Icon: Bold }, { cmd: "italic", Icon: Italic }].map(({ cmd, Icon }) => (
          <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd); }} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-500 hover:text-gray-900" type="button"><Icon className="h-3.5 w-3.5" /></button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {[{ cmd: "insertUnorderedList", Icon: List }, { cmd: "insertOrderedList", Icon: ListOrdered }].map(({ cmd, Icon }) => (
          <button key={cmd} onMouseDown={e => { e.preventDefault(); exec(cmd); }} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-500 hover:text-gray-900" type="button"><Icon className="h-3.5 w-3.5" /></button>
        ))}
      </div>
      <div className="relative">
        <div ref={ref} contentEditable onFocus={() => { focused.current = true; }} onBlur={() => { focused.current = false; ref.current && onChange(ref.current.innerHTML); }}
          onInput={() => ref.current && debouncedChange(ref.current.innerHTML)}
          onPaste={e => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
          className="p-3 focus:outline-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 text-sm text-gray-800 leading-relaxed"
          style={{ minHeight }} suppressContentEditableWarning />
        {!value && <div className="absolute top-3 left-3 text-gray-400 text-sm pointer-events-none select-none">{placeholder}</div>}
      </div>
    </div>
  );
});

// ============================================================================
// HELPERS
// ============================================================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400";

// ============================================================================
// BLOCK EDITORS
// ============================================================================

const BlockEditor = memo(function BlockEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (c: any) => void }) {
  const c = block.content;

  if (block.type === "heading") return (
    <div className="space-y-2.5">
      <Field label="Level">
        <div className="flex gap-2">
          {[1, 2, 3].map(lvl => (
            <button key={lvl} type="button" onClick={() => onUpdate({ ...c, level: lvl })}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${c.level === lvl ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
              H{lvl}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Text">
        <input type="text" value={c.text} onChange={e => onUpdate({ ...c, text: e.target.value })} placeholder="Heading text…" className={inputCls}
          style={{ fontSize: c.level === 1 ? "1.5rem" : c.level === 2 ? "1.2rem" : "1rem", fontWeight: 700 }} />
      </Field>
    </div>
  );

  if (block.type === "text") return (
    <RichTextEditor value={c.text} onChange={text => onUpdate({ ...c, text })} placeholder="Write your content here…" minHeight="140px" />
  );

  if (block.type === "image") return (
    <div className="space-y-2.5">
      <Field label="Image URL"><input type="text" value={c.url} onChange={e => onUpdate({ ...c, url: e.target.value })} placeholder="https://…" className={inputCls} /></Field>
      {c.url && <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-48 flex items-center justify-center"><img src={c.url} alt="Preview" className="max-h-48 object-contain" onError={e => (e.currentTarget.style.display = "none")} /></div>}
      <Field label="Caption"><input type="text" value={c.caption} onChange={e => onUpdate({ ...c, caption: e.target.value })} placeholder="Optional caption…" className={inputCls} /></Field>
    </div>
  );

  if (block.type === "video") return (
    <div className="space-y-2.5">
      <Field label="Video Embed URL"><input type="text" value={c.url} onChange={e => onUpdate({ ...c, url: e.target.value })} placeholder="https://youtube.com/embed/…" className={inputCls} /></Field>
      {c.url && <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video"><iframe src={c.url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
      <Field label="Caption"><input type="text" value={c.caption} onChange={e => onUpdate({ ...c, caption: e.target.value })} placeholder="Optional caption…" className={inputCls} /></Field>
    </div>
  );

  if (block.type === "pdf") return (
    <div className="space-y-2.5">
      <Field label="Title"><input type="text" value={c.title} onChange={e => onUpdate({ ...c, title: e.target.value })} placeholder="PDF title…" className={inputCls} /></Field>
      <Field label="PDF URL"><input type="text" value={c.url} onChange={e => onUpdate({ ...c, url: e.target.value })} placeholder="https://…" className={inputCls} /></Field>
      {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"><FileText className="h-3.5 w-3.5" /> View PDF</a>}
    </div>
  );

  if (block.type === "link") return (
    <div className="space-y-2.5">
      <Field label="Title"><input type="text" value={c.title} onChange={e => onUpdate({ ...c, title: e.target.value })} placeholder="Link title…" className={inputCls} /></Field>
      <Field label="URL"><input type="text" value={c.url} onChange={e => onUpdate({ ...c, url: e.target.value })} placeholder="https://…" className={inputCls} /></Field>
      <Field label="Description"><input type="text" value={c.description} onChange={e => onUpdate({ ...c, description: e.target.value })} placeholder="Optional description…" className={inputCls} /></Field>
    </div>
  );

  if (block.type === "quiz") return <QuizEditor block={block} onUpdate={onUpdate} />;
  return null;
});

// ============================================================================
// QUIZ EDITOR
// ============================================================================

const QuizEditor = memo(function QuizEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (c: any) => void }) {
  const content = block.content as QuizContent;
  return (
    <div className="space-y-3">
      <Field label="Quiz Title"><input type="text" value={content.title} onChange={e => onUpdate({ ...content, title: e.target.value })} placeholder="Quiz title…" className={inputCls} /></Field>
      {content.questions.map((q, i) => (
        <QuizQuestionEditor key={q.id} question={q} index={i} blockId={block.id}
          onUpdate={q => { const qs = [...content.questions]; qs[i] = q; onUpdate({ ...content, questions: qs }); }}
          onDelete={() => onUpdate({ ...content, questions: content.questions.filter((_, j) => j !== i) })} />
      ))}
      <button type="button" onClick={() => onUpdate({ ...content, questions: [...content.questions, { id: `q-${Date.now()}`, question: "", type: "multiple-choice", options: ["", "", "", ""], correctAnswer: 0, keywords: [], explanation: "" }] })}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors">
        <Plus className="h-4 w-4" /> Add Question
      </button>
    </div>
  );
});

const QuizQuestionEditor = memo(function QuizQuestionEditor({
  question, index, blockId, onUpdate, onDelete,
}: { question: QuizQuestion; index: number; blockId: string; onUpdate: (q: QuizQuestion) => void; onDelete: () => void }) {
  const upd = (field: keyof QuizQuestion, value: any) => onUpdate({ ...question, [field]: value });
  const updOpt = (i: number, v: string) => { const o = [...(question.options || [])]; o[i] = v; upd("options", o); };
  const toggleAnswer = (i: number) => {
    if (question.type === "multi-select") {
      const cur = Array.isArray(question.correctAnswer) ? question.correctAnswer as number[] : [];
      upd("correctAnswer", cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i]);
    } else upd("correctAnswer", i);
  };
  const changeType = (t: QuizQuestion["type"]) => {
    const u: Partial<QuizQuestion> = { type: t };
    if (["multiple-choice", "multi-select"].includes(t)) { u.options = question.options?.length ? question.options : ["", "", "", ""]; u.correctAnswer = t === "multi-select" ? [] : 0; }
    else if (t === "text-input") { u.options = undefined; u.correctAnswer = ""; u.keywords = question.keywords || []; }
    else { u.options = undefined; u.correctAnswer = 0; }
    onUpdate({ ...question, ...u });
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Q{index + 1}</span>
        <button type="button" onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <input type="text" value={question.question} onChange={e => upd("question", e.target.value)} placeholder="Question text…" className={inputCls} />
      <div className="flex flex-wrap gap-1.5">
        {[{ v: "multiple-choice", l: "Multiple Choice" }, { v: "multi-select", l: "Multi-Select" }, { v: "true-false", l: "True/False" }, { v: "text-input", l: "Text Input" }].map(({ v, l }) => (
          <button key={v} type="button" onClick={() => changeType(v as QuizQuestion["type"])}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${question.type === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>{l}</button>
        ))}
      </div>
      {["multiple-choice", "multi-select"].includes(question.type) && question.options && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Options — check correct answer(s)</label>
          {question.options.map((opt, i) => {
            const isCorrect = question.type === "multi-select" ? Array.isArray(question.correctAnswer) && (question.correctAnswer as number[]).includes(i) : question.correctAnswer === i;
            return (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}>
                <button type="button" onClick={() => toggleAnswer(i)} className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${isCorrect ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-emerald-400"}`}>
                  {isCorrect && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </button>
                <input type="text" value={opt} onChange={e => updOpt(i, e.target.value)} placeholder={`Option ${i + 1}…`} className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-400" />
              </div>
            );
          })}
        </div>
      )}
      {question.type === "true-false" && (
        <div className="flex gap-2">
          {["True", "False"].map((lbl, i) => (
            <button key={lbl} type="button" onClick={() => upd("correctAnswer", i)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${question.correctAnswer === i ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"}`}>{lbl}</button>
          ))}
        </div>
      )}
      {question.type === "text-input" && (
        <Field label="Keywords (comma-separated)">
          <input type="text" value={(question.keywords || []).join(", ")} onChange={e => upd("keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))} placeholder="keyword1, keyword2…" className={inputCls} />
        </Field>
      )}
      <Field label="Explanation (optional)">
        <input type="text" value={question.explanation || ""} onChange={e => upd("explanation", e.target.value)} placeholder="Why is this the correct answer?" className={inputCls} />
      </Field>
    </div>
  );
});

// ============================================================================
// INSERT STRIP
// ============================================================================

function InsertStrip({ onInsert }: { onInsert: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-center" style={{ height: open ? "auto" : "20px" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {open ? (
        <div className="w-full flex items-center gap-1 py-1.5 px-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-blue-500 mr-1 whitespace-nowrap">Insert:</span>
          <div className="flex flex-wrap gap-1 flex-1">
            {(Object.entries(BLOCK_META) as [BlockType, (typeof BLOCK_META)[BlockType]][]).map(([type, meta]) => {
              const Icon = meta.icon;
              return (
                <button key={type} type="button" onClick={() => { onInsert(type); setOpen(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                  <Icon className="h-3 w-3" /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center group/strip cursor-pointer" onClick={() => setOpen(true)}>
          <div className="flex-1 h-px bg-gray-200 group-hover/strip:bg-blue-300 transition-colors" />
          <div className="mx-2 flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 border border-gray-200 group-hover/strip:bg-blue-500 group-hover/strip:border-blue-500 transition-all">
            <Plus className="h-3 w-3 text-gray-400 group-hover/strip:text-white transition-colors" />
          </div>
          <div className="flex-1 h-px bg-gray-200 group-hover/strip:bg-blue-300 transition-colors" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BLOCK CARD
// ============================================================================

const BlockCard = memo(function BlockCard({
  block, index, total, onUpdate, onDelete, onMoveUp, onMoveDown,
}: { block: ContentBlock; index: number; total: number; onUpdate: (c: any) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void }) {
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-150">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${meta.color}`}><Icon className="h-3.5 w-3.5" /> {meta.label}</div>
          <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0} title="Move up" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ArrowUp className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} title="Move down" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ArrowDown className="h-3.5 w-3.5" /></button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button type="button" onClick={onDelete} title="Delete block" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="p-4"><ErrorBoundary><BlockEditor block={block} onUpdate={onUpdate} /></ErrorBoundary></div>
    </div>
  );
});

// ============================================================================
// PAGE EDITOR
// ============================================================================

function PageEditor({
  page, pageIndex, totalPages, onUpdateTitle, onUpdateTime, onUpdateBlock, onDeleteBlock, onMoveBlockUp, onMoveBlockDown, onInsertBlock, onAddBlock,
}: {
  page: Page; pageIndex: number; totalPages: number;
  onUpdateTitle: (t: string) => void;
  onUpdateTime: (minutes: number) => void;
  onUpdateBlock: (id: string, c: any) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlockUp: (i: number) => void;
  onMoveBlockDown: (i: number) => void;
  onInsertBlock: (at: number, type: BlockType) => void;
  onAddBlock: (type: BlockType) => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold text-gray-400 font-mono">Page {pageIndex + 1} of {totalPages}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Page title + time row */}
      <div className="mb-5 flex gap-3 items-start">
        <div className="relative flex-1">
          <input type="text" value={page.title} onChange={e => onUpdateTitle(e.target.value)}
            placeholder="Page title (shown to learners)…"
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all pr-28" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none select-none font-medium tracking-wide">page title</span>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Est. time</label>
          <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white border-2 border-gray-200 rounded-2xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input
              type="number" min="1" max="180"
              value={page.estimatedMinutes || 5}
              onChange={e => onUpdateTime(Math.max(1, parseInt(e.target.value) || 5))}
              className="w-12 text-center text-sm font-bold text-gray-900 bg-transparent focus:outline-none"
            />
            <span className="text-xs text-gray-400 font-medium">min</span>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="flex-1">
        {page.blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl mb-4">
            <LayoutTemplate className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">Empty page</p>
            <p className="text-xs mt-1">Use the toolbar below to add blocks</p>
          </div>
        ) : (
          <div>
            <InsertStrip onInsert={type => onInsertBlock(0, type)} />
            {page.blocks.map((block, idx) => (
              <div key={block.id}>
                <BlockCard block={block} index={idx} total={page.blocks.length}
                  onUpdate={c => onUpdateBlock(block.id, c)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onMoveUp={() => onMoveBlockUp(idx)}
                  onMoveDown={() => onMoveBlockDown(idx)} />
                <InsertStrip onInsert={type => onInsertBlock(idx + 1, type)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Append toolbar */}
      <div className="mt-3 p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5 px-1">Add block to this page</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(BLOCK_META) as [BlockType, (typeof BLOCK_META)[BlockType]][]).map(([type, meta]) => {
            const Icon = meta.icon;
            return (
              <button key={type} type="button" onClick={() => onAddBlock(type)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-all hover:shadow-sm">
                <Icon className="h-3.5 w-3.5" /> {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// IMPORT MODAL
// ============================================================================

const ImportModal = memo(function ImportModal({ isOpen, onClose, onImport }: { isOpen: boolean; onClose: () => void; onImport: (id: string) => Promise<void> }) {
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return modules;
    const q = search.toLowerCase();
    return modules.filter(m => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || (m.subcategory || "").toLowerCase().includes(q));
  }, [search, modules]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true); setError(null);
    fetch("/api/modules/list").then(r => r.ok ? r.json() : Promise.reject(r.statusText)).then(d => setModules(Array.isArray(d) ? d : [])).catch(e => setError(String(e))).finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div><h2 className="text-xl font-bold text-gray-900">Import Module</h2><p className="text-sm text-gray-500 mt-0.5">Select a module to load into the editor</p></div>
          <button onClick={() => { onClose(); setSearch(""); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search modules…" autoFocus
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…</div>}
          {error && <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle className="h-4 w-4" /> {error}</div>}
          {!loading && !error && filtered.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No modules found</div>}
          {filtered.map(mod => (
            <button key={mod.id} type="button" onClick={async () => { setImporting(mod.id); await onImport(mod.id); setImporting(null); }} disabled={importing === mod.id}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group disabled:opacity-60">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 truncate">{mod.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{mod.category}</span>
                    {mod.subcategory && <><ChevronRight className="h-3 w-3 text-gray-300" /><span className="text-xs text-gray-500">{mod.subcategory}</span></>}
                  </div>
                  {mod.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{mod.description}</p>}
                </div>
                {importing === mod.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0 mt-0.5" /> : <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Inner component that safely reads search params — must be inside <Suspense>
function ModuleBuilderInner() {
  const searchParams = useSearchParams();
  const [module, dispatch] = useReducer(moduleReducer, initialModuleState);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentPageIndex >= module.pages.length) setCurrentPageIndex(Math.max(0, module.pages.length - 1));
  }, [module.pages.length, currentPageIndex]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setCategories(d.data?.map((c: any) => c.name) || DEFAULT_CATEGORIES))
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, []);

  useEffect(() => {
    const importId = searchParams?.get("import");
    if (importId) {
      loadModule(importId).then(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("import");
        window.history.replaceState({}, "", url.toString());
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("importModule");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      dispatch({ type: "SET_MODULE", payload: { id: data.id || "", title: data.title || "", description: data.description || "", category: data.category || "", subcategory: data.subcategory || "", pages: migrateToPages(data) } });
      sessionStorage.removeItem("importModule");
    } catch { sessionStorage.removeItem("importModule"); }
  }, []);

  const loadModule = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/modules?id=${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const data = result.data || result;
      dispatch({ type: "SET_MODULE", payload: { id: data.id || "", title: data.title || "", description: data.description || "", category: data.category || "", subcategory: data.subcategory || "", pages: migrateToPages(data) } });
      setCurrentPageIndex(0);
      setShowImportModal(false);
    } catch (e: any) { alert(`❌ Error loading module: ${e.message}`); }
    finally { setLoading(false); }
  }, []);

  const saveModule = useCallback(async () => {
    if (!module.title || !module.category) { alert("Please fill in a title and category before saving."); return; }
    setSaving(true);
    try {
      // Compute totals from pages
      const totalLessons = module.pages.length;
      const totalMinutes = module.pages.reduce((s, p) => s + (p.estimatedMinutes || 5), 0);
      const estimatedHours = Math.max(0.1, Math.round((totalMinutes / 60) * 10) / 10);

      // Flatten pages into a blocks array the API understands.
      // Each page gets a trailing page-break block that carries the page's title and time.
      // This means every page's metadata is always saved — including the last one.
      const flatBlocks: any[] = [];
      module.pages.forEach((page) => {
        flatBlocks.push(...page.blocks);
        flatBlocks.push({
          id: `pb-${page.id}`,
          type: "page-break",
          content: {
            pageTitle: page.title,
            estimatedMinutes: page.estimatedMinutes,
          },
        });
      });

      const payload = {
        id: module.id,
        title: module.title,
        description: module.description,
        category: module.category,
        subcategory: module.subcategory,
        blocks: flatBlocks,
      };

      const res = await fetch("/api/modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `HTTP ${res.status}`); }
      const data = await res.json();
      dispatch({ type: "UPDATE_FIELD", field: "id", value: data.id });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) { alert(`❌ Error saving: ${e.message}`); }
    finally { setSaving(false); }
  }, [module]);

  const createNew = useCallback(() => {
    if (module.pages.some(p => p.blocks.length > 0) || module.title) {
      if (!confirm("Start a new module? Unsaved changes will be lost.")) return;
    }
    dispatch({ type: "RESET" });
    setCurrentPageIndex(0);
  }, [module]);

  const totalPages = module.pages.length;
  const currentPage = module.pages[Math.min(currentPageIndex, totalPages - 1)];

  if (loading) return (
    <div className="w-full min-h-[40vh] bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-500"><Loader2 className="h-6 w-6 animate-spin" /><span className="text-lg font-medium">Loading module…</span></div>
    </div>
  );

  return (
    <div className="w-full bg-gray-50">
      {/* TOP BAR */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center"><LayoutTemplate className="h-4 w-4 text-white" /></div>
              <span className="font-bold text-gray-900 text-lg">Module Builder</span>
            </div>
            {module.id && <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">editing #{module.id.slice(0, 8)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={createNew} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
              <FilePlus className="h-4 w-4" /> New
            </button>
            <button type="button" onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200">
              <Search className="h-4 w-4" /> Import / Edit
            </button>
            {/* Hidden file input for JSON upload */}
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                try {
                  const text = await file.text();
                  const raw = JSON.parse(text);
                  if (!raw.pages || !Array.isArray(raw.pages)) throw new Error("JSON does not look like a module — missing 'pages' array.");
                  if (module.pages.some(p => p.blocks.length > 0) || module.title) {
                    if (!confirm("Load this JSON file? Any unsaved changes will be lost.")) return;
                  }
                  dispatch({ type: "SET_MODULE", payload: randomiseIds(raw) });
                  setCurrentPageIndex(0);
                } catch (err: any) {
                  alert(`❌ Could not load JSON: ${err.message}`);
                }
              }}
            />
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
              title="Load a module from a JSON file"
            >
              <FileText className="h-4 w-4" /> Load JSON
            </button>
            <button type="button" onClick={saveModule} disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-sm ${saveSuccess ? "bg-emerald-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : saveSuccess ? "Saved!" : "Save Module"}
            </button>
          </div>
        </div>
      </div>

      <div className="py-8 flex gap-8">

        {/* SIDEBAR */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Module info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Module Info</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
              <input type="text" value={module.title} onChange={e => dispatch({ type: "UPDATE_FIELD", field: "title", value: e.target.value })} placeholder="Module title…" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={module.category} onChange={e => dispatch({ type: "UPDATE_FIELD", field: "category", value: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white">
                <option value="">Select…</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subcategory</label>
              <input type="text" value={module.subcategory} onChange={e => dispatch({ type: "UPDATE_FIELD", field: "subcategory", value: e.target.value })} placeholder="Optional…" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={module.description} onChange={e => dispatch({ type: "UPDATE_FIELD", field: "description", value: e.target.value })} placeholder="Brief description…" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
            </div>
          </div>

          {/* Page nav */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pages</h2>
              <span className="text-xs text-gray-400">{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-1.5">
              {module.pages.map((page, i) => {
                const isActive = i === currentPageIndex;
                return (
                  <div key={page.id} className={`flex items-center gap-1 rounded-xl transition-all ${isActive ? "bg-blue-600 shadow-sm" : "hover:bg-gray-50"}`}>
                    <button type="button" onClick={() => setCurrentPageIndex(i)} className="flex-1 text-left px-3 py-2.5 flex items-center gap-2 min-w-0">
                      <span className={`flex-shrink-0 text-xs font-mono ${isActive ? "text-blue-200" : "text-gray-400"}`}>{i + 1}</span>
                      <span className={`text-sm truncate ${isActive ? "text-white font-semibold" : "text-gray-700"}`}>
                        {page.title || <span className={isActive ? "text-blue-300 italic" : "text-gray-400 italic"}>Untitled page</span>}
                      </span>
                      <span className={`ml-auto text-xs flex-shrink-0 whitespace-nowrap ${isActive ? "text-blue-200" : "text-gray-400"}`}>
                        {page.estimatedMinutes || 5}m
                      </span>
                    </button>
                    {totalPages > 1 && (
                      <button type="button" onClick={() => { if (!confirm(`Delete page ${i + 1}? All its blocks will be lost.`)) return; dispatch({ type: "DELETE_PAGE", pageIndex: i }); }}
                        className={`p-1.5 mr-1 rounded-lg transition-all ${isActive ? "text-blue-300 hover:text-white hover:bg-blue-700" : "text-gray-300 hover:text-red-500 hover:bg-red-50"}`}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => { dispatch({ type: "ADD_PAGE" }); setCurrentPageIndex(module.pages.length); }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
              <Plus className="h-4 w-4" /> Add Page
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Stats</h2>
            <div className="space-y-2">
              {[
                { label: "Total blocks", value: module.pages.reduce((n, p) => n + p.blocks.length, 0) },
                { label: "Pages", value: totalPages },
                { label: "Quizzes", value: module.pages.reduce((n, p) => n + p.blocks.filter(b => b.type === "quiz").length, 0) },
                { label: "Total time", value: `${module.pages.reduce((n, p) => n + (p.estimatedMinutes || 5), 0)} min` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN EDITOR */}
        <div className="flex-1 min-w-0">
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-5 bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
              <button type="button" disabled={currentPageIndex === 0} onClick={() => setCurrentPageIndex(i => i - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <div className="flex items-center gap-1.5">
                {module.pages.map((_, i) => (
                  <button key={i} type="button" onClick={() => setCurrentPageIndex(i)}
                    className={`h-2 rounded-full transition-all duration-200 ${i === currentPageIndex ? "w-6 bg-blue-600" : "w-2 bg-gray-300 hover:bg-gray-400"}`} />
                ))}
              </div>
              <button type="button" disabled={currentPageIndex === totalPages - 1} onClick={() => setCurrentPageIndex(i => i + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {currentPage && (
            <PageEditor
              page={currentPage}
              pageIndex={currentPageIndex}
              totalPages={totalPages}
              onUpdateTitle={title => dispatch({ type: "UPDATE_PAGE_TITLE", pageIndex: currentPageIndex, title })}
              onUpdateTime={minutes => dispatch({ type: "UPDATE_PAGE_TIME", pageIndex: currentPageIndex, minutes })}
              onUpdateBlock={(blockId, content) => dispatch({ type: "UPDATE_BLOCK", pageIndex: currentPageIndex, blockId, content })}
              onDeleteBlock={blockId => { if (!confirm("Delete this block?")) return; dispatch({ type: "DELETE_BLOCK", pageIndex: currentPageIndex, blockId }); }}
              onMoveBlockUp={blockIndex => dispatch({ type: "MOVE_BLOCK_UP", pageIndex: currentPageIndex, blockIndex })}
              onMoveBlockDown={blockIndex => dispatch({ type: "MOVE_BLOCK_DOWN", pageIndex: currentPageIndex, blockIndex })}
              onInsertBlock={(atIndex, type) => dispatch({ type: "INSERT_BLOCK", pageIndex: currentPageIndex, atIndex, block: { id: uid(), type, content: getDefaultContent(type) } })}
              onAddBlock={type => dispatch({ type: "ADD_BLOCK", pageIndex: currentPageIndex, block: { id: uid(), type, content: getDefaultContent(type) } })}
            />
          )}
        </div>
      </div>

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={loadModule} />
    </div>
  );
}

// ============================================================================
// EXPORTED WRAPPER — provides the Suspense boundary required by useSearchParams
// ============================================================================

export function ModuleBuilder() {
  return (
    <React.Suspense fallback={
      <div className="w-full min-h-[40vh] bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading…</span>
        </div>
      </div>
    }>
      <ModuleBuilderInner />
    </React.Suspense>
  );
}