"use client";
import React from "react";
import { useState, useEffect, useRef, useCallback, useMemo, useReducer, memo } from "react";
import {
  Plus, Trash2, GripVertical, Type, Image as ImageIcon, Video, FileText,
  Link as LinkIcon, HelpCircle, Save, Eye, RefreshCw, Bold, Italic,
  List, ListOrdered, Scissors, ChevronRight, Search, X, AlertCircle
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

interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "video" | "pdf" | "link" | "quiz" | "page-break";
  content: any;
}

interface ModuleData {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  blocks: ContentBlock[];
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

const EDITOR_TOOLBAR_HEIGHT = 52;
const MODAL_MAX_HEIGHT = "80vh";
const DEBOUNCE_DELAY = 300;
const DEFAULT_CATEGORIES = ['Mathematics', 'Science', 'History', 'Programming'];

// ============================================================================
// REDUCER
// ============================================================================

type ModuleAction =
  | { type: 'SET_MODULE'; payload: ModuleData }
  | { type: 'UPDATE_FIELD'; field: keyof ModuleData; value: any }
  | { type: 'ADD_BLOCK'; block: ContentBlock }
  | { type: 'UPDATE_BLOCK'; id: string; content: any }
  | { type: 'DELETE_BLOCK'; id: string }
  | { type: 'MOVE_BLOCK'; fromIndex: number; toIndex: number }
  | { type: 'RESET' };

const initialModuleState: ModuleData = {
  id: "",
  title: "",
  description: "",
  category: "",
  subcategory: "",
  blocks: [],
};

function moduleReducer(state: ModuleData, action: ModuleAction): ModuleData {
  switch (action.type) {
    case 'SET_MODULE':
      return action.payload;
    
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };
    
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map(block =>
          block.id === action.id ? { ...block, content: action.content } : block
        ),
      };
    
    case 'DELETE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.filter(block => block.id !== action.id),
      };
    
    case 'MOVE_BLOCK': {
      const newBlocks = [...state.blocks];
      const [movedBlock] = newBlocks.splice(action.fromIndex, 1);
      newBlocks.splice(action.toIndex, 0, movedBlock);
      return { ...state, blocks: newBlocks };
    }
    
    case 'RESET':
      return initialModuleState;
    
    default:
      return state;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function normalizeBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map(block => {
    if (block.type === "quiz") {
      return {
        ...block,
        content: {
          title: block.content?.title || "Quiz",
          questions: Array.isArray(block.content?.questions) ? block.content.questions : [],
        } as QuizContent,
      };
    }
    return block;
  });
}

function getDefaultContent(type: ContentBlock["type"]): any {
  const defaults: Record<ContentBlock["type"], any> = {
    heading: { level: 2, text: "" },
    text: { text: "" },
    image: { url: "", caption: "" },
    video: { url: "", caption: "" },
    pdf: { url: "", title: "" },
    link: { url: "", title: "", description: "" },
    "page-break": { label: "Page Break" },
    quiz: {
      title: "Quiz",
      questions: [{
        id: `q-${Date.now()}`,
        question: "",
        type: "multiple-choice" as const,
        options: ["", "", "", ""],
        correctAnswer: 0,
        keywords: [],
        explanation: "",
      }],
    } as QuizContent,
  };
  return defaults[type];
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Block render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error rendering block</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// RICH TEXT EDITOR (Improved)
// ============================================================================

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = memo(function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text..." 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isExternalUpdate = useRef(false);

  // Only update DOM when value changes externally (not from user typing)
  useEffect(() => {
    if (editorRef.current && !isFocused && isExternalUpdate.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        editorRef.current.innerHTML = value || '';
      }
      isExternalUpdate.current = false;
    }
  }, [value, isFocused]);

  // Debounced change handler for performance
  const debouncedOnChange = useMemo(
    () => debounce((html: string) => {
      isExternalUpdate.current = true;
      onChange(html);
    }, DEBOUNCE_DELAY),
    [onChange]
  );

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      debouncedOnChange(editorRef.current.innerHTML);
    }
  }, [debouncedOnChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      handleInput();
    }
  }, [handleInput]);

  const execCommand = useCallback((command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    // Immediate update for formatting commands
    setTimeout(() => {
      if (editorRef.current) {
        isExternalUpdate.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  }, [onChange]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white relative">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button 
          onClick={() => execCommand('bold')} 
          className="p-1.5 hover:bg-gray-200 rounded transition-colors" 
          type="button"
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button 
          onClick={() => execCommand('italic')} 
          className="p-1.5 hover:bg-gray-200 rounded transition-colors" 
          type="button"
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button 
          onClick={() => execCommand('insertUnorderedList')} 
          className="p-1.5 hover:bg-gray-200 rounded transition-colors" 
          type="button"
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button 
          onClick={() => execCommand('insertOrderedList')} 
          className="p-1.5 hover:bg-gray-200 rounded transition-colors" 
          type="button"
          aria-label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleInput();
        }}
        onPaste={handlePaste}
        className="p-3 min-h-[120px] focus:outline-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
        suppressContentEditableWarning
        aria-label="Text editor"
      />
      {!value && !isFocused && (
        <div 
          className="absolute pointer-events-none text-gray-400" 
          style={{ top: `${EDITOR_TOOLBAR_HEIGHT}px`, left: '12px' }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// IMPORT MODAL
// ============================================================================

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (id: string) => void;
}

const ImportModal = memo(function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [modules, setModules] = useState<ModuleListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(mod => 
      mod.title.toLowerCase().includes(query) ||
      mod.category.toLowerCase().includes(query) ||
      mod.subcategory.toLowerCase().includes(query)
    );
  }, [searchQuery, modules]);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/modules/list');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && modules.length === 0) {
      fetchModules();
    }
  }, [isOpen, modules.length, fetchModules]);

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery("");
    setError(null);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full flex flex-col" style={{ maxHeight: MODAL_MAX_HEIGHT }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import or Edit Module</h2>
            <p className="text-sm text-gray-600 mt-1">Search and select a module to edit</p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              aria-label="Search modules"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-600">
              {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} found
            </p>
            <button 
              onClick={fetchModules} 
              disabled={loading} 
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50 transition-opacity"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Failed to load modules</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No modules match your search' : 'No modules found'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => onImport(mod.id)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                    {mod.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {mod.category}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{mod.subcategory}</span>
                  </div>
                  {mod.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{mod.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// QUIZ EDITOR
// ============================================================================

interface QuizEditorProps {
  block: ContentBlock;
  onUpdate: (content: QuizContent) => void;
}

const QuizEditor = memo(function QuizEditor({ block, onUpdate }: QuizEditorProps) {
  const content = block.content as QuizContent;

  const updateTitle = useCallback((title: string) => {
    onUpdate({ ...content, title });
  }, [content, onUpdate]);

  const updateQuestion = useCallback((index: number, updatedQuestion: QuizQuestion) => {
    const newQuestions = [...content.questions];
    newQuestions[index] = updatedQuestion;
    onUpdate({ ...content, questions: newQuestions });
  }, [content, onUpdate]);

  const deleteQuestion = useCallback((index: number) => {
    const newQuestions = content.questions.filter((_, i) => i !== index);
    onUpdate({ ...content, questions: newQuestions });
  }, [content, onUpdate]);

  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      keywords: [],
      explanation: "",
    };
    onUpdate({ ...content, questions: [...content.questions, newQuestion] });
  }, [content, onUpdate]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={content.title}
        onChange={(e) => updateTitle(e.target.value)}
        placeholder="Quiz title..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
      
      {content.questions.map((q, qIdx) => (
        <QuizQuestionEditor
          key={q.id}
          question={q}
          index={qIdx}
          blockId={block.id}
          onUpdate={(updatedQ) => updateQuestion(qIdx, updatedQ)}
          onDelete={() => deleteQuestion(qIdx)}
        />
      ))}

      <button
        onClick={addQuestion}
        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
        type="button"
      >
        + Add Question
      </button>
    </div>
  );
});

// ============================================================================
// QUIZ QUESTION EDITOR
// ============================================================================

interface QuizQuestionEditorProps {
  question: QuizQuestion;
  index: number;
  blockId: string;
  onUpdate: (question: QuizQuestion) => void;
  onDelete: () => void;
}

const QuizQuestionEditor = memo(function QuizQuestionEditor({ 
  question, 
  index, 
  blockId,
  onUpdate, 
  onDelete 
}: QuizQuestionEditorProps) {
  const updateField = useCallback((field: keyof QuizQuestion, value: any) => {
    onUpdate({ ...question, [field]: value });
  }, [question, onUpdate]);

  const updateOption = useCallback((optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateField('options', newOptions);
  }, [question.options, updateField]);

  const toggleCorrectAnswer = useCallback((optionIndex: number) => {
    if (question.type === "multi-select") {
      const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const newAnswers = currentAnswers.includes(optionIndex)
        ? currentAnswers.filter(idx => idx !== optionIndex)
        : [...currentAnswers, optionIndex];
      updateField('correctAnswer', newAnswers);
    } else {
      updateField('correctAnswer', optionIndex);
    }
  }, [question.type, question.correctAnswer, updateField]);

  const changeQuestionType = useCallback((newType: QuizQuestion["type"]) => {
    const updates: Partial<QuizQuestion> = { type: newType };
    
    if (["multiple-choice", "multi-select"].includes(newType)) {
      updates.options = ["", "", "", ""];
      updates.correctAnswer = newType === "multi-select" ? [] : 0;
      updates.keywords = undefined;
    } else if (newType === "text-input") {
      updates.options = undefined;
      updates.correctAnswer = "";
      updates.keywords = [];
    } else {
      updates.options = undefined;
      updates.correctAnswer = 0;
      updates.keywords = undefined;
    }
    
    onUpdate({ ...question, ...updates });
  }, [question, onUpdate]);

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
        <button
          onClick={onDelete}
          className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
          type="button"
          aria-label="Delete question"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <input
        type="text"
        value={question.question}
        onChange={(e) => updateField('question', e.target.value)}
        placeholder="Question text..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />

      <select
        value={question.type}
        onChange={(e) => changeQuestionType(e.target.value as QuizQuestion["type"])}
        className="px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm w-48 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      >
        <option value="multiple-choice">Multiple Choice</option>
        <option value="multi-select">Multi-Select</option>
        <option value="true-false">True/False</option>
        <option value="text-input">Text Input</option>
      </select>

      {/* Multiple Choice / Multi-Select Options */}
      {["multiple-choice", "multi-select"].includes(question.type) && question.options && (
        <div className="space-y-1.5 mb-2">
          {question.options.map((opt, optIdx) => (
            <div key={optIdx} className="flex items-center gap-2">
              <input
                type={question.type === "multi-select" ? "checkbox" : "radio"}
                name={`correct-${blockId}-${question.id}`}
                checked={
                  question.type === "multi-select"
                    ? Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optIdx)
                    : question.correctAnswer === optIdx
                }
                onChange={() => toggleCorrectAnswer(optIdx)}
                className="w-4 h-4 cursor-pointer"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(optIdx, e.target.value)}
                placeholder={`Option ${optIdx + 1}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          ))}
        </div>
      )}

      {/* True/False */}
      {question.type === "true-false" && (
        <div className="space-y-1.5 mb-2">
          {["True", "False"].map((opt, optIdx) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`correct-${blockId}-${question.id}`}
                checked={question.correctAnswer === optIdx}
                onChange={() => updateField('correctAnswer', optIdx)}
                className="w-4 h-4"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* Text Input Keywords */}
      {question.type === "text-input" && (
        <div className="mb-2">
          <label className="text-sm text-gray-600 mb-1 block">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={(question.keywords || []).join(", ")}
            onChange={(e) => {
              const keywords = e.target.value
                .split(",")
                .map(k => k.trim())
                .filter(Boolean);
              updateField('keywords', keywords);
            }}
            placeholder="keyword1, keyword2, keyword3..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
      )}

      {/* Explanation */}
      <input
        type="text"
        value={question.explanation || ""}
        onChange={(e) => updateField('explanation', e.target.value)}
        placeholder="Explanation (optional)..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      />
    </div>
  );
});

// ============================================================================
// BLOCK EDITOR
// ============================================================================

interface BlockEditorProps {
  block: ContentBlock;
  onUpdate: (content: any) => void;
}

const BlockEditor = memo(function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  if (block.type === "page-break") {
    return (
      <div className="flex items-center justify-center py-4 text-gray-500">
        <Scissors className="h-5 w-5 mr-2" />
        <span className="font-medium">Page Break</span>
      </div>
    );
  }

  if (block.type === "quiz") {
    return <QuizEditor block={block} onUpdate={onUpdate} />;
  }

  if (block.type === "heading") {
    return (
      <div className="space-y-2">
        <select
          value={block.content.level}
          onChange={(e) => onUpdate({ ...block.content, level: parseInt(e.target.value) })}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        >
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>
        <input
          type="text"
          value={block.content.text}
          onChange={(e) => onUpdate({ ...block.content, text: e.target.value })}
          placeholder="Enter heading text..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>
    );
  }

  if (block.type === "text") {
    return (
      <RichTextEditor
        value={block.content.text}
        onChange={(text) => onUpdate({ ...block.content, text })}
        placeholder="Enter text content..."
      />
    );
  }

  if (block.type === "image") {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.content.url}
          onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
          placeholder="Image URL..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <input
          type="text"
          value={block.content.caption}
          onChange={(e) => onUpdate({ ...block.content, caption: e.target.value })}
          placeholder="Caption (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>
    );
  }

  if (block.type === "video") {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.content.url}
          onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
          placeholder="Video embed URL..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <input
          type="text"
          value={block.content.caption}
          onChange={(e) => onUpdate({ ...block.content, caption: e.target.value })}
          placeholder="Caption (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>
    );
  }

  if (block.type === "pdf") {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.content.title}
          onChange={(e) => onUpdate({ ...block.content, title: e.target.value })}
          placeholder="PDF title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <input
          type="text"
          value={block.content.url}
          onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
          placeholder="PDF URL..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>
    );
  }

  if (block.type === "link") {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={block.content.title}
          onChange={(e) => onUpdate({ ...block.content, title: e.target.value })}
          placeholder="Link title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <input
          type="text"
          value={block.content.url}
          onChange={(e) => onUpdate({ ...block.content, url: e.target.value })}
          placeholder="URL..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <input
          type="text"
          value={block.content.description}
          onChange={(e) => onUpdate({ ...block.content, description: e.target.value })}
          placeholder="Description (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
      </div>
    );
  }

  return null;
});

// ============================================================================
// DRAGGABLE BLOCK
// ============================================================================

interface DraggableBlockProps {
  block: ContentBlock;
  index: number;
  onUpdate: (content: any) => void;
  onDelete: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
}

const DraggableBlock = memo(function DraggableBlock({
  block,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}: DraggableBlockProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className="group p-4 rounded-lg hover:bg-white border border-gray-200 bg-white transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors">
            <GripVertical className="h-5 w-5 text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-600 capitalize">
            {block.type.replace("-", " ")}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-50 p-1.5 rounded transition-all"
          type="button"
          aria-label="Delete block"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <ErrorBoundary>
        <BlockEditor block={block} onUpdate={onUpdate} />
      </ErrorBoundary>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ModuleBuilder() {
  const [module, dispatch] = useReducer(moduleReducer, initialModuleState);
  const [draggingBlock, setDraggingBlock] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(result => {
        const cats = result.data?.map((c: any) => c.name) || DEFAULT_CATEGORIES;
        setCategories(cats);
      })
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, []);

  // Import module
  const importModule = useCallback(async (moduleId: string) => {
    try {
      const res = await fetch(`/api/modules?id=${moduleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      
      dispatch({
        type: 'SET_MODULE',
        payload: {
          id: data.id,
          title: data.title,
          description: data.description || "",
          category: data.category,
          subcategory: data.subcategory,
          blocks: normalizeBlocks(data.blocks || []),
        },
      });

      setShowImportModal(false);
      alert("✅ Module imported successfully!");
    } catch (error: any) {
      alert(`❌ Error importing module: ${error.message}`);
    }
  }, []);

  // Create new module
  const createNewModule = useCallback(() => {
    if (module.blocks.length > 0 || module.title) {
      if (!confirm('Create new module? Unsaved changes will be lost.')) {
        return;
      }
    }
    dispatch({ type: 'RESET' });
  }, [module.blocks.length, module.title]);

  // Add block
  const addBlock = useCallback((type: ContentBlock["type"]) => {
    dispatch({
      type: 'ADD_BLOCK',
      block: {
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: getDefaultContent(type),
      },
    });
  }, []);

  // Update block
  const updateBlock = useCallback((blockId: string, content: any) => {
    dispatch({ type: 'UPDATE_BLOCK', id: blockId, content });
  }, []);

  // Delete block
  const deleteBlock = useCallback((blockId: string) => {
    if (confirm('Delete this block?')) {
      dispatch({ type: 'DELETE_BLOCK', id: blockId });
    }
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggingBlock(index);
  }, []);

  const handleDragOver = useCallback((hoverIndex: number) => {
    if (draggingBlock !== null && draggingBlock !== hoverIndex) {
      dispatch({ type: 'MOVE_BLOCK', fromIndex: draggingBlock, toIndex: hoverIndex });
      setDraggingBlock(hoverIndex);
    }
  }, [draggingBlock]);

  const handleDragEnd = useCallback(() => {
    setDraggingBlock(null);
  }, []);

  // Save module
  const saveModule = useCallback(async () => {
    if (!module.title || !module.category) {
      alert('⚠️ Please fill in title and category');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(module),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      dispatch({ type: 'UPDATE_FIELD', field: 'id', value: data.id });
      alert('✅ Module saved successfully!');
    } catch (error: any) {
      alert(`❌ Error saving module: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }, [module]);

  // Preview mode
  if (previewMode) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-lg transition-colors"
          >
            ← Back to Editor
          </button>
        </div>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">{module.title || "Untitled Module"}</h1>
            <p className="text-gray-600 mb-6">{module.description}</p>
            <div className="text-sm text-gray-500 mb-8">
              {module.category} {module.subcategory && `→ ${module.subcategory}`}
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-500 italic">Preview mode - Use ModuleViewer component for full rendering</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Module Builder</h1>
            <div className="flex gap-2">
              <button
                onClick={createNewModule}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" /> New Module
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Search className="h-4 w-4" /> Import / Edit
              </button>
            </div>
          </div>

          {/* Module metadata */}
          <div className="space-y-3 bg-white p-6 rounded-lg border border-gray-200">
            <input
              type="text"
              value={module.title}
              onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'title', value: e.target.value })}
              placeholder="Module Title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-2xl font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={module.category}
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'category', value: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                value={module.subcategory}
                onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'subcategory', value: e.target.value })}
                placeholder="Subcategory"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <textarea
              value={module.description}
              onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'description', value: e.target.value })}
              placeholder="Module description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-2 mb-6">
          {module.blocks.map((block, index) => (
            <DraggableBlock
              key={block.id}
              block={block}
              index={index}
              onUpdate={(content) => updateBlock(block.id, content)}
              onDelete={() => deleteBlock(block.id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          ))}

          {module.blocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No content blocks yet. Add one below to get started.</p>
            </div>
          )}
        </div>

        {/* Add block buttons */}
        <div className="mb-6 p-4 rounded-lg bg-white border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Content Block</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: "heading", icon: Type, label: "Heading" },
              { type: "text", icon: FileText, label: "Text" },
              { type: "image", icon: ImageIcon, label: "Image" },
              { type: "video", icon: Video, label: "Video" },
              { type: "pdf", icon: FileText, label: "PDF" },
              { type: "link", icon: LinkIcon, label: "Link" },
              { type: "quiz", icon: HelpCircle, label: "Quiz" },
              { type: "page-break", icon: Scissors, label: "Page Break" },
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => addBlock(type as ContentBlock["type"])}
                className="flex items-center justify-center gap-2 p-3 hover:bg-gray-100 rounded text-sm border border-gray-200 transition-colors"
                type="button"
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={saveModule}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Module
              </>
            )}
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
        </div>
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importModule}
      />
    </div>
  );
}