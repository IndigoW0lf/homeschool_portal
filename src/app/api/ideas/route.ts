import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/ideas
 * Save a new idea from Luna suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, user_message, suggestion_data } = body;

    if (!title || !content) {
      console.error('Save Idea Failed: Missing title or content', { title, contentLength: content?.length });
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('saved_ideas')
      .insert({
        user_id: user.id,
        title,
        content,
        user_message,
        source_type: 'luna',
        suggestion_data,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving idea:', error);
      return NextResponse.json(
        { error: 'Failed to save idea' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Ideas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ideas
 * List all saved ideas for the current user
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('saved_ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ideas:', error);
      return NextResponse.json(
        { error: 'Failed to load ideas' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Ideas API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
