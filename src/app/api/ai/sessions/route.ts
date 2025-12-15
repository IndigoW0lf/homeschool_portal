import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const MAX_SESSIONS_PER_USER = 10;
const SESSION_TTL_DAYS = 30;

/**
 * GET /api/ai/sessions
 * Fetch user's recent chat sessions
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(MAX_SESSIONS_PER_USER);

    if (error) {
      console.error('[AI Sessions] Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err) {
    console.error('[AI Sessions] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/ai/sessions
 * Create or update a chat session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, contextType, contextData, messages } = body;

    if (!contextType || !messages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If sessionId provided, update existing
    if (sessionId) {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({
          messages,
          context_data: contextData || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', user.id); // Ensure ownership

      if (error) {
        console.error('[AI Sessions] Update error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
      }

      return NextResponse.json({ sessionId });
    }

    // Create new session
    // First, check count and clean up old sessions if needed
    const { data: existingSessions } = await supabase
      .from('ai_chat_sessions')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (existingSessions && existingSessions.length >= MAX_SESSIONS_PER_USER) {
      // Delete oldest sessions to make room
      const sessionsToDelete = existingSessions.slice(MAX_SESSIONS_PER_USER - 1);
      await supabase
        .from('ai_chat_sessions')
        .delete()
        .in('id', sessionsToDelete.map(s => s.id));
    }

    // Also clean up sessions older than TTL
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SESSION_TTL_DAYS);
    await supabase
      .from('ai_chat_sessions')
      .delete()
      .eq('user_id', user.id)
      .lt('updated_at', cutoffDate.toISOString());

    // Create new session
    const { data: newSession, error } = await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: user.id,
        context_type: contextType,
        context_data: contextData || {},
        messages,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AI Sessions] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: newSession.id });
  } catch (err) {
    console.error('[AI Sessions] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/sessions?id=xxx
 * Delete a specific session
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get('id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ai_chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[AI Sessions] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AI Sessions] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
