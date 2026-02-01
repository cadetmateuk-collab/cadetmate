import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { moduleId, hidden } = await request.json();

    console.log('API: Toggling module', moduleId, 'to hidden:', hidden);

    // Update the module
    const { data, error } = await supabaseAdmin
      .from('modules')
      .update({ hidden })
      .eq('id', moduleId)
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
        { error: 'Module not found or not updated' },
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

// Optional: Add DELETE endpoint for deleting modules
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('id');

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}