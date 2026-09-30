import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/admin';
import { requirePermissionApi } from '@/lib/auth/require-permission-api';

const columns = 'id, question_date, question, options, correct_answer, explanation, created_at';

export async function GET() {
  const auth = await requirePermissionApi('questions.update');
  if ('error' in auth) return auth.error;

  const { data, error } = await supabaseAdmin
    .from('daily_questions')
    .select(columns)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi('questions.create');
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const payload = questionPayload(body);
  if (!payload.question || !payload.correct_answer) {
    return NextResponse.json({ error: 'Question and correct answer are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('daily_questions')
    .insert(payload)
    .select(columns)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const auth = await requirePermissionApi('questions.update');
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'Question id is required' }, { status: 400 });

  const payload = questionPayload(body);
  const { data, error } = await supabaseAdmin
    .from('daily_questions')
    .update(payload)
    .eq('id', id)
    .select(columns)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const auth = await requirePermissionApi('questions.delete');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? '';
  if (!id) return NextResponse.json({ error: 'Question id is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('daily_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function questionPayload(body: {
  question_date?: string | null;
  question?: string;
  options?: unknown;
  correct_answer?: string;
  explanation?: string | null;
}) {
  const options = Array.isArray(body.options)
    ? body.options.map((option) => String(option)).filter(Boolean)
    : [];
  return {
    question_date: body.question_date || null,
    question: String(body.question ?? '').trim(),
    options,
    correct_answer: String(body.correct_answer ?? '').trim(),
    explanation: body.explanation ? String(body.explanation) : null,
  };
}
