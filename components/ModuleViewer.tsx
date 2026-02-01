"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { CheckCircle2, FileText } from "lucide-react";

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

interface ModuleViewerProps {
  moduleId: string;
  moduleData?: ModuleData;
}

export default function ModuleViewer({ moduleId, moduleData: initialData }: ModuleViewerProps) {
  const [moduleData, setModuleData] = useState<ModuleData | null>(initialData || null);
  const [currentPage, setCurrentPage] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData && moduleId) {
      fetch(`/api/modules?id=${moduleId}`)
        .then(res => res.json())
        .then(data => setModuleData(data))
        .catch(err => console.error("Error fetching module:", err))
        .finally(() => setLoading(false));
    }
  }, [moduleId, initialData]);

  const pages = useMemo(() => {
    if (!moduleData) return [];
    return moduleData.blocks.reduce((acc: ContentBlock[][], block) => {
      if (block.type === "page-break") {
        acc.push([]);
      } else {
        if (acc.length === 0) acc.push([]);
        acc[acc.length - 1].push(block);
      }
      return acc;
    }, []);
  }, [moduleData]);

  const totalPages = pages.length || 1;
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  const handleQuizAnswer = useCallback((quizId: string, questionId: string, answer: any) => {
    setQuizAnswers(prev => ({
      ...prev,
      [`${quizId}-${questionId}`]: answer
    }));
  }, []);

  const checkTextInputAnswer = useCallback((userAnswer: string, keywords: string[]) => {
    const normalized = userAnswer.toLowerCase().trim();
    return keywords.some(kw => normalized.includes(kw.toLowerCase()));
  }, []);

  const submitQuiz = useCallback((quizId: string, questions: QuizQuestion[]) => {
    setQuizSubmitted(prev => ({ ...prev, [quizId]: true }));
    
    let correct = 0;
    questions.forEach(q => {
      const userAnswer = quizAnswers[`${quizId}-${q.id}`];
      
      if (q.type === "text-input") {
        if (checkTextInputAnswer(userAnswer || "", q.keywords || [])) correct++;
      } else if (q.type === "multi-select") {
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        if (JSON.stringify((userAnswer || []).sort()) === JSON.stringify(correctAnswers.sort())) correct++;
      } else {
        if (userAnswer === q.correctAnswer) correct++;
      }
    });
    
    alert(`Quiz completed! Score: ${correct}/${questions.length}`);
  }, [quizAnswers, checkTextInputAnswer]);

  const renderQuiz = useCallback((block: ContentBlock) => {
    const isSubmitted = quizSubmitted[block.id];
    const questions = block.content.questions;
    const currentIdx = quizQuestionIndex[block.id] || 0;
    const currentQuestion = questions[currentIdx];
    const totalQuestions = questions.length;

    const isAnswerCorrect = (q: QuizQuestion) => {
      const userAnswer = quizAnswers[`${block.id}-${q.id}`];
      
      if (q.type === "text-input") {
        return checkTextInputAnswer(userAnswer || "", q.keywords || []);
      } else if (q.type === "multi-select") {
        const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        return JSON.stringify((userAnswer || []).sort()) === JSON.stringify(correctAnswers.sort());
      }
      return userAnswer === q.correctAnswer;
    };

    return (
      <div key={block.id} className="mb-8 p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">📝 {block.content.title}</h3>
          <div className="text-sm text-gray-600">Question {currentIdx + 1} of {totalQuestions}</div>
        </div>
        
        <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {currentQuestion && (
          <div className="p-6 rounded-lg border border-gray-200 bg-gray-50">
            <p className="font-medium text-gray-900 mb-4 text-lg">{currentQuestion.question}</p>
            
            {/* Multiple Choice */}
            {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIdx) => {
                  const userAnswer = quizAnswers[`${block.id}-${currentQuestion.id}`];
                  const isSelected = userAnswer === optIdx;
                  const isCorrectOption = currentQuestion.correctAnswer === optIdx;
                  
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-all border ${
                        isSelected
                          ? isSubmitted
                            ? isCorrectOption ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                            : "bg-blue-50 border-blue-500"
                          : "border-gray-200 hover:bg-white hover:border-gray-300 bg-white"
                      } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleQuizAnswer(block.id, currentQuestion.id, optIdx)}
                        disabled={isSubmitted}
                        className="w-4 h-4"
                      />
                      <span className="flex-1">{option}</span>
                      {isSubmitted && isCorrectOption && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </label>
                  );
                })}
              </div>
            )}

            {/* Multi-Select */}
            {currentQuestion.type === "multi-select" && currentQuestion.options && (
              <div className="space-y-3">
                <p className="text-sm text-blue-600 mb-2">Select all that apply</p>
                {currentQuestion.options.map((option, optIdx) => {
                  const userAnswer = quizAnswers[`${block.id}-${currentQuestion.id}`] || [];
                  const correctAnswers = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [currentQuestion.correctAnswer];
                  const isChecked = userAnswer.includes(optIdx);
                  const isCorrectOption = correctAnswers.includes(optIdx);
                  
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-all border ${
                        isChecked
                          ? isSubmitted
                            ? isCorrectOption ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                            : "bg-blue-50 border-blue-500"
                          : isSubmitted && isCorrectOption
                            ? "bg-green-50 border-green-500"
                            : "border-gray-200 hover:bg-white hover:border-gray-300 bg-white"
                      } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const newAnswer = e.target.checked
                            ? [...userAnswer, optIdx]
                            : userAnswer.filter((idx: number) => idx !== optIdx);
                          handleQuizAnswer(block.id, currentQuestion.id, newAnswer);
                        }}
                        disabled={isSubmitted}
                        className="w-4 h-4"
                      />
                      <span className="flex-1">{option}</span>
                      {isSubmitted && isCorrectOption && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </label>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.type === "true-false" && (
              <div className="grid grid-cols-2 gap-4">
                {["True", "False"].map((option, idx) => {
                  const userAnswer = quizAnswers[`${block.id}-${currentQuestion.id}`];
                  const isSelected = userAnswer === idx;
                  const isCorrectOption = currentQuestion.correctAnswer === idx;
                  
                  return (
                    <label
                      key={option}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-all border ${
                        isSelected
                          ? isSubmitted
                            ? isCorrectOption ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
                            : "bg-blue-50 border-blue-500"
                          : "border-gray-200 hover:bg-white hover:border-gray-300 bg-white"
                      } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleQuizAnswer(block.id, currentQuestion.id, idx)}
                        disabled={isSubmitted}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{option}</span>
                      {isSubmitted && isCorrectOption && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </label>
                  );
                })}
              </div>
            )}

            {/* Text Input */}
            {currentQuestion.type === "text-input" && (
              <div className="space-y-3">
                <textarea
                  value={quizAnswers[`${block.id}-${currentQuestion.id}`] || ""}
                  onChange={(e) => handleQuizAnswer(block.id, currentQuestion.id, e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                />
                {isSubmitted && (
                  <div className={`p-3 rounded-lg text-sm border ${
                    isAnswerCorrect(currentQuestion)
                      ? "bg-green-50 text-green-900 border-green-300"
                      : "bg-red-50 text-red-900 border-red-300"
                  }`}>
                    <p className="font-medium">
                      {isAnswerCorrect(currentQuestion) ? "✓ Correct!" : "✗ Incorrect"}
                    </p>
                    {currentQuestion.keywords && (
                      <p className="text-xs mt-1">Expected keywords: {currentQuestion.keywords.join(", ")}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Explanation */}
            {isSubmitted && currentQuestion.explanation && (
              <div className={`mt-4 p-4 rounded-lg text-sm border ${
                isAnswerCorrect(currentQuestion)
                  ? "bg-green-50 text-green-900 border-green-300"
                  : "bg-red-50 text-red-900 border-red-300"
              }`}>
                <p className="font-medium mb-1">Explanation</p>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setQuizQuestionIndex(prev => ({ ...prev, [block.id]: Math.max(0, currentIdx - 1) }))}
            disabled={currentIdx === 0}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          
          {currentIdx === totalQuestions - 1 ? (
            !isSubmitted && (
              <button
                onClick={() => submitQuiz(block.id, questions)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Quiz
              </button>
            )
          ) : (
            <button
              onClick={() => setQuizQuestionIndex(prev => ({ ...prev, [block.id]: Math.min(totalQuestions - 1, currentIdx + 1) }))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    );
  }, [quizAnswers, quizSubmitted, quizQuestionIndex, handleQuizAnswer, submitQuiz, checkTextInputAnswer]);

  const renderBlock = useCallback((block: ContentBlock) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.content.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            key={block.id}
            className={`font-bold text-gray-900 mb-3 ${
              block.content.level === 1 ? "text-3xl" :
              block.content.level === 2 ? "text-2xl" : "text-xl"
            }`}
          >
            {block.content.text}
          </HeadingTag>
        );

      case "text":
        return (
          <div 
            key={block.id} 
            className="text-gray-700 mb-4 leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_strong]:font-semibold [&_em]:italic"
            dangerouslySetInnerHTML={{ __html: block.content.text }}
          />
        );

      case "image":
        return (
          <div key={block.id} className="mb-6">
            <img src={block.content.url} alt={block.content.caption || ""} className="w-full rounded-lg border border-gray-200" />
            {block.content.caption && <p className="text-sm text-gray-500 mt-2 text-center italic">{block.content.caption}</p>}
          </div>
        );

      case "video":
        return (
          <div key={block.id} className="mb-6">
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg border border-gray-200">
              <iframe src={block.content.url} className="absolute top-0 left-0 w-full h-full" allowFullScreen />
            </div>
            {block.content.caption && <p className="text-sm text-gray-500 mt-2">{block.content.caption}</p>}
          </div>
        );

      case "pdf":
        return (
          <a
            key={block.id}
            href={block.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mb-3 rounded-lg hover:bg-gray-50 border border-gray-200"
          >
            <FileText className="h-5 w-5 text-blue-600" />
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
            className="flex items-center gap-3 p-4 mb-3 rounded-lg hover:bg-gray-50 border border-gray-200"
          >
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">{block.content.title}</p>
              {block.content.description && <p className="text-sm text-gray-500">{block.content.description}</p>}
            </div>
          </a>
        );

      case "quiz":
        return renderQuiz(block);

      default:
        return null;
    }
  }, [renderQuiz]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">Module not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white pt-6">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-sm text-blue-600 mb-2 font-medium">
            {moduleData.category} / {moduleData.subcategory}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{moduleData.title}</h1>
          <p className="text-lg text-gray-600">{moduleData.description}</p>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="text-sm text-gray-500">Page {currentPage + 1} of {totalPages}</div>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 pb-24">
        {pages[currentPage]?.map(block => renderBlock(block))}
      </div>

      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (currentPage > 2) pageNum = currentPage - 2 + i;
                  if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}