import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name, hidden } = await request.json();

    console.log('API: Toggling category', name, 'to hidden:', hidden);

    // Update the category
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ hidden })
      .eq('name', name)
      .select();

    console.log('API: Supabase response:', { data, error });

    if (error) {
      console.error('API: Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Category not found or not updated' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0] 
    });

  } catch (error: any) {
    console.error('API: Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}