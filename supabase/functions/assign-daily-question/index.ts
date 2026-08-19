// supabase/functions/assign-daily-question/index.ts
//
// Protect with DAILY_QUESTION_CRON_SECRET (header x-cron-secret). JWT verification is off
// because the public anon JWT would otherwise satisfy verify_jwt.
//
// Cron: 0 0 * * * (then send the secret header from the scheduler).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const expected = Deno.env.get('DAILY_QUESTION_CRON_SECRET') ?? ''
  const provided = req.headers.get('x-cron-secret') ?? ''
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ ok: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const todayUK = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const [dd, mm, yyyy] = todayUK.split('/')
  const todayISO = `${yyyy}-${mm}-${dd}`

  const { data: existing } = await supabase
    .from('daily_questions')
    .select('id')
    .eq('question_date', todayISO)
    .maybeSingle()

  if (existing) {
    return new Response(
      JSON.stringify({ ok: true, message: `Question already assigned for ${todayISO}` }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { data: candidates, error } = await supabase
    .from('daily_questions')
    .select('id')
    .is('question_date', null)
    .order('id')

  if (error || !candidates || candidates.length === 0) {
    return new Response(
      JSON.stringify({ ok: false, message: 'No unscheduled questions available', error }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)]

  const { error: updateError } = await supabase
    .from('daily_questions')
    .update({ question_date: todayISO })
    .eq('id', pick.id)

  if (updateError) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Failed to assign question', error: updateError }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ ok: true, message: `Assigned question ${pick.id} to ${todayISO}` }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
