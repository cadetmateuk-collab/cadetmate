'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, LogIn } from 'lucide-react'

type Question = {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string | null
}

type AnswerState = {
  selected: string
  correct: boolean
} | null

// ── Deterministic daily seed per user ─────────────────────────────────────────
// Combines userId + today's date into a simple numeric seed so the same
// user always gets the same question on the same day, but different users
// may get different questions.
function dailySeed(userId: string, dateKey: string): number {
  const str = userId + dateKey
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// For logged-out users seed by date only (same question for all anon visitors)
function dateSeed(dateKey: string): number {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = (Math.imul(31, hash) + dateKey.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export default function QuestionOfDay() {
  const supabase = createClient()
  const todayKey = new Date().toISOString().slice(0, 10)

  const [question, setQuestion]       = useState<Question | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const [isLoggedIn, setIsLoggedIn]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [initialising, setInitialising] = useState(true)

  useEffect(() => {
    async function init() {
      // 1. Fetch all questions
      const { data: questions } = await supabase
        .from('daily_questions')
        .select('id, question, options, correct_answer, explanation')
        .order('created_at')

      if (!questions || questions.length === 0) {
        setInitialising(false)
        return
      }

      // 2. Check auth
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      // 3. Pick question using seed
      const seed = user ? dailySeed(user.id, todayKey) : dateSeed(todayKey)
      const picked = questions[seed % questions.length] as Question

      setQuestion(picked)

      // 4. If logged in, check for existing answer today
      if (user) {
        const { data: existing } = await supabase
          .from('daily_question_answers')
          .select('selected_answer, correct')
          .eq('user_id', user.id)
          .eq('question_date', todayKey)
          .maybeSingle()

        if (existing) {
          setAnswerState({ selected: existing.selected_answer, correct: existing.correct })
        }
      }

      setInitialising(false)
    }

    init()
  }, [todayKey])

  async function handleAnswer(option: string) {
    if (answerState || loading || !question) return

    // Must be logged in to save answer
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // shouldn't reach here but guard anyway

    setLoading(true)
    const isCorrect = option === question.correct_answer

    await supabase.from('daily_question_answers').upsert({
      user_id:         user.id,
      question_id:     question.id,
      question_date:   todayKey,
      selected_answer: option,
      correct:         isCorrect,
    }, { onConflict: 'user_id,question_date' })

    setAnswerState({ selected: option, correct: isCorrect })
    setLoading(false)
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (initialising) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3 animate-pulse">
        <div className="h-3 bg-muted rounded w-3/4 mb-3" />
        <div className="space-y-1.5">
          {[1,2,3,4].map(i => <div key={i} className="h-8 bg-muted rounded-lg" />)}
        </div>
      </div>
    )
  }

  // ── No questions in DB ───────────────────────────────────────────────────────
  if (!question) return null

  const answered = answerState !== null

  return (
    <div
      className="no-copy rounded-xl border border-border bg-muted/20 px-3.5 py-3"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      <p className="text-xs font-medium leading-snug mb-3">{question.question}</p>

      <div className="space-y-1.5">
        {question.options.map((opt, i) => {
          const isSelected  = answered && answerState.selected === opt
          const isCorrect   = opt === question.correct_answer
          const showCorrect = answered && isCorrect
          const showWrong   = answered && isSelected && !isCorrect

          let cls = 'w-full rounded-lg px-3 py-2 text-xs leading-snug border transition-colors flex items-center justify-between gap-2 '

          if (!answered && !isLoggedIn) {
            // Logged out — options visible but muted, no hover
            cls += 'bg-background border-border text-muted-foreground cursor-default opacity-70'
          } else if (!answered) {
            cls += 'bg-background border-border text-foreground cursor-pointer hover:border-primary/40 hover:bg-primary/5'
          } else if (showCorrect) {
            cls += 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 font-semibold cursor-default'
          } else if (showWrong) {
            cls += 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 cursor-default'
          } else {
            cls += 'bg-background border-border text-muted-foreground cursor-default opacity-50'
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => isLoggedIn ? handleAnswer(opt) : undefined}
              disabled={answered || loading || !isLoggedIn}
            >
              <span>{opt}</span>
              {showCorrect && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />}
              {showWrong   && <XCircle    className="h-3.5 w-3.5 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Result banner */}
      {answered && (
        <div className={`mt-2.5 rounded-lg px-3 py-2 text-[11px] leading-snug ${
          answerState.correct
            ? 'bg-green-500/10 text-green-700 dark:text-green-400'
            : 'bg-red-500/10 text-red-700 dark:text-red-400'
        }`}>
          {answerState.correct
            ? '✓ Correct!'
            : `✗ The correct answer is: ${question.correct_answer}`}
          {question.explanation && (
            <p className="mt-1 text-muted-foreground text-[10px]">{question.explanation}</p>
          )}
        </div>
      )}

      {/* Logged-out prompt */}
      {!isLoggedIn && !answered && (
        <div className="mt-2.5 rounded-lg px-3 py-2 text-[11px] leading-snug bg-primary/5 border border-primary/20 text-primary flex items-center gap-1.5">
          <LogIn className="h-3 w-3 flex-shrink-0" />
          Log in to answer and track your progress
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 mt-2.5 text-right">Refreshes daily</p>
    </div>
  )
}