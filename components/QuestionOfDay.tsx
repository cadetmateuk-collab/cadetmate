'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle } from 'lucide-react'

type Question = {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string | null
}

type Props = {
  question: Question
  todayKey: string // e.g. "2026-03-14"
}

type AnswerState = {
  selected: string
  correct: boolean
} | null

export default function QuestionOfDay({ question, todayKey }: Props) {
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const [loading, setLoading] = useState(false)
  const [initialising, setInitialising] = useState(true)

  const supabase = createClient()

  // On mount — check if user already answered today
  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setInitialising(false); return }

      const { data } = await supabase
        .from('daily_question_answers')
        .select('selected_answer, correct')
        .eq('user_id', user.id)
        .eq('question_date', todayKey)
        .maybeSingle()

      if (data) {
        setAnswerState({ selected: data.selected_answer, correct: data.correct })
      }
      setInitialising(false)
    }
    checkExisting()
  }, [todayKey])

  async function handleAnswer(option: string) {
    if (answerState || loading) return
    setLoading(true)

    const isCorrect = option === question.correct_answer

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('daily_question_answers').upsert({
        user_id: user.id,
        question_id: question.id,
        question_date: todayKey,
        selected_answer: option,
        correct: isCorrect,
      }, { onConflict: 'user_id,question_date' })
    }

    setAnswerState({ selected: option, correct: isCorrect })
    setLoading(false)
  }

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

  const answered = answerState !== null

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-3">
      <p className="text-xs font-medium leading-snug mb-3">{question.question}</p>
      <div className="space-y-1.5">
        {question.options.map((opt, i) => {
          const isSelected  = answered && answerState.selected === opt
          const isCorrect   = opt === question.correct_answer
          const showCorrect = answered && isCorrect
          const showWrong   = answered && isSelected && !isCorrect

          let cls = 'w-full rounded-lg px-3 py-2 text-xs leading-snug border transition-colors flex items-center justify-between gap-2 '
          if (!answered) {
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
              onClick={() => handleAnswer(opt)}
              disabled={answered || loading}
            >
              <span>{opt}</span>
              {showCorrect && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />}
              {showWrong   && <XCircle    className="h-3.5 w-3.5 flex-shrink-0" />}
            </button>
          )
        })}
      </div>

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

      <p className="text-[10px] text-muted-foreground/40 mt-2.5 text-right">Refreshes daily</p>
    </div>
  )
}