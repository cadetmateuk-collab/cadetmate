"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Trash2, GripVertical, Type, Image as ImageIcon, Video, FileText,
  Link as LinkIcon, HelpCircle, Save, Eye, RefreshCw, Bold, Italic,
  List, ListOrdered, Scissors, ChevronRight, Search, X
} from "lucide-react";

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

// Rich Text Editor Component
function RichTextEditor({ value, onChange, placeholder }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isFocused && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const execCommand = useCallback((command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    setTimeout(() => {
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, 0);
  }, [onChange]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded" type="button">
          <Bold className="h-4 w-4" />
        </button>
        <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded" type="button">
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded" type="button">
          <List className="h-4 w-4" />
        </button>
        <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded" type="button">
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
      />
      {!value && !isFocused && (
        <div className="absolute top-[52px] left-3 text-gray-400 pointer-events-none">{placeholder}</div>
      )}
    </div>
  );
}

// Import Modal Component
function ImportModal({ isOpen, onClose, onImport }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onImport: (id: string) => void;
}) {
  const [modules, setModules] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await fetch('/api/modules/list');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (error: any) {
      alert(`Failed to load modules: ${error.message}`);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && modules.length === 0) fetchModules();
  }, [isOpen, modules.length, fetchModules]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import or Edit Module</h2>
            <p className="text-sm text-gray-600 mt-1">Search and select a module to edit</p>
          </div>
          <button onClick={() => { onClose(); setSearchQuery(""); }} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-600">{filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} found</p>
            <button onClick={fetchModules} disabled={loading} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No modules found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => onImport(mod.id)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{mod.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{mod.category}</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{mod.subcategory}</span>
                  </div>
                  {mod.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{mod.description}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Builder Component
export function ModuleBuilder() {
  const [draggingBlock, setDraggingBlock] = useState<number | null>(null);
  const [module, setModule] = useState<ModuleData>({
    id: "",
    title: "",
    description: "",
    category: "",
    subcategory: "",
    blocks: [],
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(result => setCategories(result.data?.map((c: any) => c.name) || []))
      .catch(() => setCategories(['Mathematics', 'Science', 'History', 'Programming']));
  }, []);

  const importModule = useCallback(async (moduleId: string) => {
    try {
      const res = await fetch(`/api/modules?id=${moduleId}`);
      if (!res.ok) throw new Error('Failed to fetch module');
      const data = await res.json();
      
      setModule({
        id: data.id,
        title: data.title,
        description: data.description || "",
        category: data.category,
        subcategory: data.subcategory,
        blocks: data.blocks || [],
      });

      setShowImportModal(false);
      alert("✅ Module imported successfully!");
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  }, []);

  const createNewModule = useCallback(() => {
    setModule({ id: "", title: "", description: "", category: "", subcategory: "", blocks: [] });
  }, []);

  const getDefaultContent = useCallback((type: ContentBlock["type"]) => {
    const defaults: Record<string, any> = {
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
          type: "multiple-choice",
          options: ["", "", "", ""],
          correctAnswer: 0,
          keywords: [],
          explanation: "",
        }],
      },
    };
    return defaults[type] || {};
  }, []);

  const addBlock = useCallback((type: ContentBlock["type"]) => {
    setModule(prev => ({
      ...prev,
      blocks: [...prev.blocks, { id: `block-${Date.now()}`, type, content: getDefaultContent(type) }],
    }));
  }, [getDefaultContent]);

  const updateBlock = useCallback((blockId: string, content: any) => {
    setModule(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => block.id === blockId ? { ...block, content } : block),
    }));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setModule(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
    }));
  }, []);

  const moveBlock = useCallback((dragIndex: number, hoverIndex: number) => {
    setModule(prev => {
      const newBlocks = [...prev.blocks];
      const [draggedBlock] = newBlocks.splice(dragIndex, 1);
      newBlocks.splice(hoverIndex, 0, draggedBlock);
      return { ...prev, blocks: newBlocks };
    });
  }, []);

  const saveModule = useCallback(async () => {
    if (!module.title || !module.category) {
      alert('Please fill in title and category');
      return;
    }

    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(module),
      });

      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setModule(prev => ({ ...prev, id: data.id }));
      alert('✅ Module saved successfully!');
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  }, [module]);

  const renderQuizEditor = useCallback((block: ContentBlock) => {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={block.content.title}
          onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
          placeholder="Quiz title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-medium focus:outline-none focus:border-blue-500"
        />
        
        {block.content.questions.map((q: QuizQuestion, qIdx: number) => (
          <div key={q.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-gray-600">Question {qIdx + 1}</span>
              <button
                onClick={() => {
                  const newQuestions = block.content.questions.filter((_: any, i: number) => i !== qIdx);
                  updateBlock(block.id, { ...block.content, questions: newQuestions });
                }}
                className="text-red-600 hover:bg-red-50 p-1 rounded"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={q.question}
              onChange={(e) => {
                const newQuestions = [...block.content.questions];
                newQuestions[qIdx] = { ...q, question: e.target.value };
                updateBlock(block.id, { ...block.content, questions: newQuestions });
              }}
              placeholder="Question text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:border-blue-500"
            />

            <select
              value={q.type}
              onChange={(e) => {
                const newQuestions = [...block.content.questions];
                const newType = e.target.value as QuizQuestion["type"];
                newQuestions[qIdx] = { 
                  ...q, 
                  type: newType,
                  options: ["multiple-choice", "multi-select"].includes(newType) ? ["", "", "", ""] : undefined,
                  correctAnswer: newType === "multi-select" ? [] : 0,
                  keywords: newType === "text-input" ? [] : undefined,
                };
                updateBlock(block.id, { ...block.content, questions: newQuestions });
              }}
              className="px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm w-48 focus:outline-none focus:border-blue-500"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="multi-select">Multi-Select</option>
              <option value="true-false">True/False</option>
              <option value="text-input">Text Input</option>
            </select>

            {/* Multiple Choice / Multi-Select Options */}
            {["multiple-choice", "multi-select"].includes(q.type) && q.options && (
              <div className="space-y-1.5 mb-2">
                {q.options.map((opt: string, optIdx: number) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type={q.type === "multi-select" ? "checkbox" : "radio"}
                      name={`correct-${block.id}-${q.id}`}
                      checked={
                        q.type === "multi-select"
                          ? (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx))
                          : q.correctAnswer === optIdx
                      }
                      onChange={() => {
                        const newQuestions = [...block.content.questions];
                        if (q.type === "multi-select") {
                          const currentAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                          const newAnswers = currentAnswers.includes(optIdx)
                            ? currentAnswers.filter(idx => idx !== optIdx)
                            : [...currentAnswers, optIdx];
                          newQuestions[qIdx] = { ...q, correctAnswer: newAnswers };
                        } else {
                          newQuestions[qIdx] = { ...q, correctAnswer: optIdx };
                        }
                        updateBlock(block.id, { ...block.content, questions: newQuestions });
                      }}
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newQuestions = [...block.content.questions];
                        const newOptions = [...q.options!];
                        newOptions[optIdx] = e.target.value;
                        newQuestions[qIdx] = { ...q, options: newOptions };
                        updateBlock(block.id, { ...block.content, questions: newQuestions });
                      }}
                      placeholder={`Option ${optIdx + 1}...`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* True/False */}
            {q.type === "true-false" && (
              <div className="space-y-1.5 mb-2">
                {["True", "False"].map((opt, optIdx) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${block.id}-${q.id}`}
                      checked={q.correctAnswer === optIdx}
                      onChange={() => {
                        const newQuestions = [...block.content.questions];
                        newQuestions[qIdx] = { ...q, correctAnswer: optIdx };
                        updateBlock(block.id, { ...block.content, questions: newQuestions });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Text Input Keywords */}
            {q.type === "text-input" && (
              <div className="mb-2">
                <label className="text-sm text-gray-600 mb-1 block">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={(q.keywords || []).join(", ")}
                  onChange={(e) => {
                    const newQuestions = [...block.content.questions];
                    newQuestions[qIdx] = { ...q, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) };
                    updateBlock(block.id, { ...block.content, questions: newQuestions });
                  }}
                  placeholder="keyword1, keyword2, keyword3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Explanation */}
            <input
              type="text"
              value={q.explanation || ""}
              onChange={(e) => {
                const newQuestions = [...block.content.questions];
                newQuestions[qIdx] = { ...q, explanation: e.target.value };
                updateBlock(block.id, { ...block.content, questions: newQuestions });
              }}
              placeholder="Explanation (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        ))}

        <button
          onClick={() => {
            const newQuestion: QuizQuestion = {
              id: `q-${Date.now()}`,
              question: "",
              type: "multiple-choice",
              options: ["", "", "", ""],
              correctAnswer: 0,
              keywords: [],
              explanation: "",
            };
            updateBlock(block.id, { ...block.content, questions: [...block.content.questions, newQuestion] });
          }}
          className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded"
          type="button"
        >
          + Add Question
        </button>
      </div>
    );
  }, [updateBlock]);

  const renderBlockEditor = useCallback((block: ContentBlock) => {
    if (block.type === "page-break") {
      return (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <Scissors className="h-5 w-5 mr-2" />
          <span className="font-medium">Page Break</span>
        </div>
      );
    }

    const editors: Record<string, React.ReactElement> = {
      heading: (
        <div className="space-y-2">
          <select
            value={block.content.level}
            onChange={(e) => updateBlock(block.id, { ...block.content, level: parseInt(e.target.value) })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={1}>Heading 1</option>
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
          </select>
          <input
            type="text"
            value={block.content.text}
            onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
            placeholder="Enter heading text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      ),
      text: (
        <RichTextEditor
          value={block.content.text}
          onChange={(text: string) => updateBlock(block.id, { ...block.content, text })}
          placeholder="Enter text content..."
        />
      ),
      image: (
        <div className="space-y-2">
          <input type="text" value={block.content.url} onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })} placeholder="Image URL..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" value={block.content.caption} onChange={(e) => updateBlock(block.id, { ...block.content, caption: e.target.value })} placeholder="Caption (optional)..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      ),
      video: (
        <div className="space-y-2">
          <input type="text" value={block.content.url} onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })} placeholder="Video embed URL..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" value={block.content.caption} onChange={(e) => updateBlock(block.id, { ...block.content, caption: e.target.value })} placeholder="Caption (optional)..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      ),
      pdf: (
        <div className="space-y-2">
          <input type="text" value={block.content.title} onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })} placeholder="PDF title..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" value={block.content.url} onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })} placeholder="PDF URL..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      ),
      link: (
        <div className="space-y-2">
          <input type="text" value={block.content.title} onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })} placeholder="Link title..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" value={block.content.url} onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })} placeholder="URL..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" value={block.content.description} onChange={(e) => updateBlock(block.id, { ...block.content, description: e.target.value })} placeholder="Description (optional)..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      ),
      quiz: renderQuizEditor(block),
    };

    return editors[block.type] || null;
  }, [updateBlock, renderQuizEditor]);

  if (previewMode) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button onClick={() => setPreviewMode(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-lg">
            ← Back to Editor
          </button>
        </div>
        <div className="min-h-screen bg-gray-50 p-8">Preview Mode (Use ModuleViewer component here)</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Module Builder</h1>
            <div className="flex gap-2">
              <button onClick={createNewModule} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Module
              </button>
              <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Search className="h-4 w-4" /> Import / Edit
              </button>
            </div>
          </div>

          <div className="space-y-3 bg-white p-6 rounded-lg border border-gray-200">
            <input type="text" value={module.title} onChange={(e) => setModule({ ...module, title: e.target.value })} placeholder="Module Title" className="w-full px-3 py-2 border border-gray-300 rounded-md text-2xl font-semibold" />
            <div className="grid grid-cols-2 gap-3">
              <select value={module.category} onChange={(e) => setModule({ ...module, category: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select category...</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="text" value={module.subcategory} onChange={(e) => setModule({ ...module, subcategory: e.target.value })} placeholder="Subcategory" className="px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <textarea value={module.description} onChange={(e) => setModule({ ...module, description: e.target.value })} placeholder="Module description..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none" />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {module.blocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => {
                setDraggingBlock(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingBlock !== null && draggingBlock !== index) {
                  moveBlock(draggingBlock, index);
                }
                setDraggingBlock(null);
              }}
              onDragEnd={() => setDraggingBlock(null)}
              className="group p-4 rounded-lg hover:bg-white border border-gray-200 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
                    <GripVertical className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 capitalize">{block.type.replace("-", " ")}</span>
                </div>
                <button onClick={() => deleteBlock(block.id)} className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-50 p-1.5 rounded" type="button">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {renderBlockEditor(block)}
            </div>
          ))}
        </div>

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
                className="flex items-center justify-center gap-2 p-3 hover:bg-gray-100 rounded text-sm border border-gray-200"
                type="button"
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={saveModule} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Save className="h-4 w-4" /> Save Module
          </button>
          <button onClick={() => setPreviewMode(true)} className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Preview
          </button>
        </div>
      </div>

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={importModule} />
    </div>
  );
}