'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ThinkContext, ThinkResponse } from '@/lib/ai/types';

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  role: 'user' | 'luna';
  content: string;
  response?: ThinkResponse;
  timestamp: string;
}

interface DbSession {
  id: string;
  context_type: ThinkContext;
  context_data: {
    childProfileId?: string;
    lessonId?: string;
    weekStartDate?: string;
  };
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

interface LunaContextParams {
  context: ThinkContext;
  childProfileId?: string;
  lessonId?: string;
  weekStartDate?: string;
}

interface LunaState {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  messages: ChatMessage[];
  error: string | null;
  currentContext: LunaContextParams | null;
  inputValue: string;
  currentSessionId: string | null;
  recentSessions: DbSession[];
}

interface LunaContextValue extends LunaState {
  openPanel: (params: LunaContextParams) => void;
  closePanel: () => void;
  setInputValue: (value: string) => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  loadSession: (sessionId: string) => void;
}

const LunaContext = createContext<LunaContextValue | null>(null);

// ============================================
// API HELPERS
// ============================================

async function fetchSessions(): Promise<DbSession[]> {
  try {
    const res = await fetch('/api/ai/sessions');
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  } catch {
    return [];
  }
}

async function saveSessionToDb(
  sessionId: string | null,
  contextType: ThinkContext,
  contextData: LunaContextParams,
  messages: ChatMessage[]
): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        contextType,
        contextData: {
          childProfileId: contextData.childProfileId,
          lessonId: contextData.lessonId,
          weekStartDate: contextData.weekStartDate,
        },
        messages,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sessionId;
  } catch {
    return null;
  }
}

async function deleteSessionFromDb(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai/sessions?id=${sessionId}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================
// PROVIDER
// ============================================

export function LunaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LunaState>({
    isOpen: false,
    isLoading: false,
    isSaving: false,
    messages: [],
    error: null,
    currentContext: null,
    inputValue: '',
    currentSessionId: null,
    recentSessions: [],
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load sessions from database on mount
  useEffect(() => {
    fetchSessions().then(sessions => {
      setState(prev => ({ ...prev, recentSessions: sessions }));
    });
  }, []);

  // Debounced save to database when messages change
  useEffect(() => {
    if (!state.currentContext || state.messages.length === 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save to avoid excessive API calls
    saveTimeoutRef.current = setTimeout(async () => {
      setState(prev => ({ ...prev, isSaving: true }));
      
      const newSessionId = await saveSessionToDb(
        state.currentSessionId,
        state.currentContext!.context,
        state.currentContext!,
        state.messages
      );

      if (newSessionId && !state.currentSessionId) {
        setState(prev => ({ ...prev, currentSessionId: newSessionId, isSaving: false }));
      } else {
        setState(prev => ({ ...prev, isSaving: false }));
      }
    }, 1000); // Save 1 second after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.messages, state.currentSessionId, state.currentContext]);

  const openPanel = useCallback(async (params: LunaContextParams) => {
    // Fetch latest sessions from DB
    const sessions = await fetchSessions();
    
    // Look for an existing session with matching context
    const existingSession = sessions.find(s => 
      s.context_type === params.context &&
      s.context_data?.childProfileId === params.childProfileId &&
      s.context_data?.lessonId === params.lessonId &&
      s.context_data?.weekStartDate === params.weekStartDate
    );

    if (existingSession) {
      setState(prev => ({
        ...prev,
        isOpen: true,
        currentContext: params,
        currentSessionId: existingSession.id,
        messages: existingSession.messages || [],
        recentSessions: sessions,
        error: null,
        inputValue: '',
      }));
    } else {
      setState(prev => ({
        ...prev,
        isOpen: true,
        currentContext: params,
        currentSessionId: null, // Will be set after first save
        messages: [],
        recentSessions: sessions,
        error: null,
        inputValue: '',
      }));
    }
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    const session = state.recentSessions.find(s => s.id === sessionId);
    if (session) {
      setState(prev => ({
        ...prev,
        currentSessionId: session.id,
        currentContext: {
          context: session.context_type,
          ...session.context_data,
        },
        messages: session.messages || [],
        error: null,
        inputValue: '',
      }));
    }
  }, [state.recentSessions]);

  const closePanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const setInputValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, inputValue: value }));
  }, []);

  const clearMessages = useCallback(async () => {
    if (state.currentSessionId) {
      await deleteSessionFromDb(state.currentSessionId);
      const updatedSessions = state.recentSessions.filter(s => s.id !== state.currentSessionId);
      setState(prev => ({ 
        ...prev, 
        messages: [], 
        error: null,
        currentSessionId: null,
        recentSessions: updatedSessions,
      }));
    } else {
      setState(prev => ({ ...prev, messages: [], error: null }));
    }
  }, [state.currentSessionId, state.recentSessions]);

  const sendMessage = useCallback(async (message: string) => {
    if (!state.currentContext) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      inputValue: '',
      messages: [...prev.messages, userMessage],
    }));

    try {
      // Build conversation history for context
      const history = state.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.role === 'user' ? m.content : JSON.stringify(m.response),
      }));

      const body = {
        context: state.currentContext.context,
        message,
        history, // Pass conversation history
        childProfileId: state.currentContext.childProfileId,
        lessonId: state.currentContext.lessonId,
        weekStartDate: state.currentContext.weekStartDate,
      };

      const res = await fetch('/api/ai/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data: ThinkResponse = await res.json();
      
      const lunaMessage: ChatMessage = {
        role: 'luna',
        content: '',
        response: data,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, lunaMessage],
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Something went wrong',
      }));
    }
  }, [state.currentContext]);

  return (
    <LunaContext.Provider
      value={{
        ...state,
        openPanel,
        closePanel,
        setInputValue,
        sendMessage,
        clearMessages,
        loadSession,
      }}
    >
      {children}
    </LunaContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useLuna() {
  const context = useContext(LunaContext);
  if (!context) {
    throw new Error('useLuna must be used within a LunaProvider');
  }
  return context;
}


