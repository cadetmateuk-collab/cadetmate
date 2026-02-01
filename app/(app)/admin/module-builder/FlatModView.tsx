"use client";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Type,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Save,
  Eye,
  Upload,
  ArrowLeft,
  Download,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false";
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
}

interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "video" | "pdf" | "link" | "quiz";
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

// Module Viewer Component
function ModuleViewer({ moduleData, onBack }: { moduleData: ModuleData; onBack: () => void }) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const handleQuizAnswer = (quizId: string, questionId: string, answer: any) => {
    setQuizAnswers(prev => ({
      ...prev,
      [`${quizId}-${questionId}`]: answer
    }));
  };

  const submitQuiz = (quizId: string, questions: QuizQuestion[]) => {
    setQuizSubmitted(prev => ({ ...prev, [quizId]: true }));
    
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = quizAnswers[`${quizId}-${q.id}`];
      if (userAnswer === q.correctAnswer) correct++;
    });
    
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.content.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return (
          <HeadingTag
            key={block.id}
            className={`font-bold text-gray-800 mb-4 ${
              block.content.level === 1 ? "text-3xl" :
              block.content.level === 2 ? "text-2xl" :
              "text-xl"
            }`}
          >
            {block.content.text}
          </HeadingTag>
        );

      case "text":
        return (
          <p key={block.id} className="text-gray-700 mb-4 leading-relaxed">
            {block.content.text}
          </p>
        );

      case "image":
        return (
          <div key={block.id} className="mb-6">
            <img
              src={block.content.url}
              alt={block.content.caption || "Module image"}
              className="w-full rounded-lg"
            />
            {block.content.caption && (
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                {block.content.caption}
              </p>
            )}
          </div>
        );

      case "video":
        return (
          <div key={block.id} className="mb-6">
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg">
              <iframe
                src={block.content.url}
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
              />
            </div>
            {block.content.caption && (
              <p className="text-sm text-gray-500 mt-2">{block.content.caption}</p>
            )}
          </div>
        );

      case "pdf":
        return (
          <a
            key={block.id}
            href={block.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mb-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FileText className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{block.content.title}</p>
              <p className="text-sm text-gray-500">Click to open PDF</p>
            </div>
          </a>
        );

      case "link":
        return (
          <a
            key={block.id}
            href={block.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mb-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <LinkIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">{block.content.title}</p>
              {block.content.description && (
                <p className="text-sm text-blue-700">{block.content.description}</p>
              )}
            </div>
          </a>
        );

      case "quiz":
        const isSubmitted = quizSubmitted[block.id];
        return (
          <div key={block.id} className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📝 {block.content.title}
            </h3>
            <div className="space-y-6">
              {block.content.questions.map((q: QuizQuestion, idx: number) => {
                const userAnswer = quizAnswers[`${block.id}-${q.id}`];
                const isCorrect = userAnswer === q.correctAnswer;
                
                return (
                  <div key={q.id} className="bg-white p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-3">
                      {idx + 1}. {q.question}
                    </p>
                    
                    {q.type === "multiple-choice" && q.options && (
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                              userAnswer === optIdx
                                ? isSubmitted
                                  ? isCorrect
                                    ? "bg-green-50"
                                    : "bg-red-50"
                                  : "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`${block.id}-${q.id}`}
                              checked={userAnswer === optIdx}
                              onChange={() => handleQuizAnswer(block.id, q.id, optIdx)}
                              disabled={isSubmitted}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === "true-false" && (
                      <div className="flex gap-4">
                        {["True", "False"].map((option, idx) => (
                          <label
                            key={option}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md cursor-pointer transition-colors ${
                              userAnswer === idx
                                ? isSubmitted
                                  ? isCorrect
                                    ? "bg-green-50"
                                    : "bg-red-50"
                                  : "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`${block.id}-${q.id}`}
                              checked={userAnswer === idx}
                              onChange={() => handleQuizAnswer(block.id, q.id, idx)}
                              disabled={isSubmitted}
                              className="w-4 h-4"
                            />
                            <span className="font-medium">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {isSubmitted && q.explanation && (
                      <div className={`mt-3 p-3 rounded-md text-sm ${
                        isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        <p className="font-medium mb-1">
                          {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                        </p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {!isSubmitted && (
              <button
                onClick={() => submitQuiz(block.id, block.content.questions)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Quiz
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Editor
        </button>

        <div className="mb-3 text-sm text-gray-500">
          {moduleData.category} / {moduleData.subcategory}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {moduleData.title}
        </h1>
        <p className="text-lg text-gray-600 mb-12">{moduleData.description}</p>

        <div className="space-y-6">
          {moduleData.blocks.map(block => renderBlock(block))}
        </div>
      </div>
    </div>
  );
}

// Main Module Builder Component
export default function ModuleBuilder() {
  const [module, setModule] = useState<ModuleData>({
    id: "",
    title: "",
    description: "",
    category: "Navigation",
    subcategory: "",
    blocks: [],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
    };

    setModule(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const getDefaultContent = (type: ContentBlock["type"]) => {
    switch (type) {
      case "heading":
        return { level: 2, text: "" };
      case "text":
        return { text: "" };
      case "image":
        return { url: "", caption: "" };
      case "video":
        return { url: "", caption: "" };
      case "pdf":
        return { url: "", title: "" };
      case "link":
        return { url: "", title: "", description: "" };
      case "quiz":
        return {
          title: "Quiz",
          questions: [{
            id: `q-${Date.now()}`,
            question: "",
            type: "multiple-choice",
            options: ["", "", "", ""],
            correctAnswer: 0,
            explanation: "",
          }],
        };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, content: any) => {
    setModule(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, content } : block
      ),
    }));
  };

  const deleteBlock = (blockId: string) => {
    setModule(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
    }));
  };

  const saveModule = () => {
    if (!module.id) {
      module.id = `${module.category.toLowerCase()}-${module.subcategory.toLowerCase()}-${Date.now()}`;
    }

    const dataStr = JSON.stringify(module, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${module.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadModule = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setModule(json);
        setShowImport(false);
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const renderBlockEditor = (block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        return (
          <div className="space-y-3">
            <select
              value={block.content.level}
              onChange={(e) => updateBlock(block.id, { ...block.content, level: parseInt(e.target.value) })}
              className="px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
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
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
          </div>
        );

      case "text":
        return (
          <textarea
            value={block.content.text}
            onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
            placeholder="Enter text content..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
          />
        );

      case "image":
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.content.url}
              onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
              placeholder="Image URL..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
            <input
              type="text"
              value={block.content.caption}
              onChange={(e) => updateBlock(block.id, { ...block.content, caption: e.target.value })}
              placeholder="Caption (optional)..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
          </div>
        );

      case "video":
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.content.url}
              onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
              placeholder="Video embed URL (YouTube, Vimeo, etc.)..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
            <input
              type="text"
              value={block.content.caption}
              onChange={(e) => updateBlock(block.id, { ...block.content, caption: e.target.value })}
              placeholder="Caption (optional)..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
          </div>
        );

      case "pdf":
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.content.title}
              onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
              placeholder="PDF title..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
            <input
              type="text"
              value={block.content.url}
              onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
              placeholder="PDF URL..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
          </div>
        );

      case "link":
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.content.title}
              onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
              placeholder="Link title..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
            <input
              type="text"
              value={block.content.url}
              onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
              placeholder="URL..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
            <input
              type="text"
              value={block.content.description}
              onChange={(e) => updateBlock(block.id, { ...block.content, description: e.target.value })}
              placeholder="Description (optional)..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={block.content.title}
              onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
              placeholder="Quiz title..."
              className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100 font-medium"
            />
            
            {block.content.questions.map((q: QuizQuestion, qIdx: number) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-700">Question {qIdx + 1}</span>
                  <button
                    onClick={() => {
                      const newQuestions = block.content.questions.filter((_: any, i: number) => i !== qIdx);
                      updateBlock(block.id, { ...block.content, questions: newQuestions });
                    }}
                    className="text-red-500 hover:text-red-700"
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
                  className="w-full px-3 py-2 bg-white rounded-md mb-3 focus:outline-none"
                />

                <select
                  value={q.type}
                  onChange={(e) => {
                    const newQuestions = [...block.content.questions];
                    newQuestions[qIdx] = { ...q, type: e.target.value as any };
                    updateBlock(block.id, { ...block.content, questions: newQuestions });
                  }}
                  className="px-3 py-2 bg-white rounded-md mb-3 focus:outline-none"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                </select>

                {q.type === "multiple-choice" && q.options && (
                  <div className="space-y-2 mb-3">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
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
                          className="flex-1 px-3 py-2 bg-white rounded-md text-sm focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={q.explanation || ""}
                  onChange={(e) => {
                    const newQuestions = [...block.content.questions];
                    newQuestions[qIdx] = { ...q, explanation: e.target.value };
                    updateBlock(block.id, { ...block.content, questions: newQuestions });
                  }}
                  placeholder="Explanation (optional)..."
                  className="w-full px-3 py-2 bg-white rounded-md text-sm focus:outline-none"
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
                  explanation: "",
                };
                updateBlock(block.id, {
                  ...block.content,
                  questions: [...block.content.questions, newQuestion],
                });
              }}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              + Add Question
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (previewMode) {
    return <ModuleViewer moduleData={module} onBack={() => setPreviewMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Module Builder</h1>
          <div className="flex gap-2">
            <button
              onClick={() => document.getElementById('file-input')?.click()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <input
              id="file-input"
              type="file"
              accept=".json"
              onChange={loadModule}
              className="hidden"
            />
            <button
              onClick={() => setPreviewMode(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={saveModule}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
        
        <div className="space-y-8 mb-8">
          <input
            type="text"
            value={module.title}
            onChange={(e) => setModule({ ...module, title: e.target.value })}
            placeholder="Untitled Module"
            className="w-full text-4xl font-bold text-gray-900 focus:outline-none"
          />

          <div className="flex gap-4">
            <select
              value={module.category}
              onChange={(e) => setModule({ ...module, category: e.target.value })}
              className="px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            >
              <option>Navigation</option>
              <option>Seamanship</option>
              <option>Cargo Operations</option>
              <option>Ship Stability</option>
              <option>Maritime Law</option>
            </select>

            <input
              type="text"
              value={module.subcategory}
              onChange={(e) => setModule({ ...module, subcategory: e.target.value })}
              placeholder="Subcategory"
              className="px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100"
            />
          </div>

          <textarea
            value={module.description}
            onChange={(e) => setModule({ ...module, description: e.target.value })}
            placeholder="Add a description..."
            rows={2}
            className="w-full px-3 py-2 bg-gray-50 rounded-md focus:outline-none focus:bg-gray-100 resize-none"
          />
        </div>

        <div className="space-y-4 mb-8">
          {module.blocks.map((block) => (
            <div
              key={block.id}
              className="group p-6 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500 capitalize">
                  {block.type.replace("-", " ")}
                </span>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {renderBlockEditor(block)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => addBlock("heading")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <Type className="h-4 w-4" />
            Heading
          </button>
          <button
            onClick={() => addBlock("text")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <FileText className="h-4 w-4" />
            Text
          </button>
          <button
            onClick={() => addBlock("image")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </button>
          <button
            onClick={() => addBlock("video")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <Video className="h-4 w-4" />
            Video
          </button>
          <button
            onClick={() => addBlock("pdf")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={() => addBlock("link")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <LinkIcon className="h-4 w-4" />
            Link
          </button>
            <button
              onClick={() => addBlock("quiz")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
            >
              <HelpCircle className="h-5 w-5" />
              Quiz
            </button>
          </div>
        </div>

        <div className="w-[60%] mx-auto flex gap-3">
  <button
    onClick={saveModule}
    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
  >
    <Save className="h-5 w-5" />
    Save Module
  </button>

  <button
    onClick={() => setPreviewMode(true)}
    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
  >
    <Eye className="h-5 w-5" />
    Preview
  </button>
</div>

      </div>
  );
}