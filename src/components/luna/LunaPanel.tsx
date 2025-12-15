'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { X, Sparkle, PaperPlaneRight, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useLuna } from './LunaContext';
import { LunaSuggestionCard } from './LunaSuggestionCard';
import { cn } from '@/lib/utils';

/**
 * Luna Side Panel
 * 
 * Sliding side-sheet for AI interactions.
 * - Fixed right, full height, 400px wide
 * - ESC closes, click backdrop closes
 * - Accessible: focus trap, role="dialog"
 */
export function LunaPanel() {
  const {
    isOpen,
    isLoading,
    messages,
    error,
    inputValue,
    closePanel,
    setInputValue,
    sendMessage,
    clearMessages,
  } = useLuna();

  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePanel]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
    }
  }, [inputValue, isLoading, sendMessage]);



  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Luna AI assistant"
        aria-modal="true"
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-md",
          "bg-white dark:bg-gray-900 shadow-2xl",
          "flex flex-col",
          "animate-in slide-in-from-right duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkle size={24} weight="duotone" className="text-[var(--fabric-lilac)]" />
            <div>
              <h2 className="heading-sm">Luna</h2>
              <p className="text-xs text-muted">Thinking partner • Not an expert</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setShowNewChatConfirm(true)}
                className="btn-icon"
                aria-label="Start new chat"
                title="Start new chat"
              >
                <ArrowCounterClockwise size={20} weight="duotone" className="text-gray-400" />
              </button>
            )}
            <button
              onClick={closePanel}
              className="btn-icon"
              aria-label="Close Luna panel"
            >
              <X size={24} weight="duotone" className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* New Chat Confirmation */}
        {showNewChatConfirm && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
              Start a new conversation? This will clear the current chat.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearMessages();
                  setShowNewChatConfirm(false);
                }}
                className="btn-sm bg-amber-600 hover:bg-amber-700 text-white"
              >
                Yes, start fresh
              </button>
              <button
                onClick={() => setShowNewChatConfirm(false)}
                className="btn-sm text-amber-700 dark:text-amber-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error state */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div key={index} className="space-y-3">
              {/* User message */}
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[var(--fabric-lilac)]/10 dark:bg-[var(--fabric-lilac)]/20 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{msg.content}</p>
                  </div>
                </div>
              )}

              {/* Luna response */}
              {msg.role === 'luna' && msg.response && (
                <div className="space-y-4">
                  {/* Clarifying questions */}
                  {msg.response.clarifying_questions.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider">
                        Questions to think about
                      </p>
                      <ul className="space-y-2">
                        {msg.response.clarifying_questions.map((q, i) => (
                          <li 
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="text-[var(--fabric-lilac)] mt-0.5">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted italic">
                        Share your thoughts on any of these below
                      </p>
                    </div>
                  )}

                  {/* Suggestions */}
                  {msg.response.suggestions.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider">
                        Some thoughts
                      </p>
                      {msg.response.suggestions.map((suggestion, i) => (
                        <LunaSuggestionCard key={i} suggestion={suggestion} />
                      ))}
                    </div>
                  )}

                  {/* Empty response */}
                  {msg.response.clarifying_questions.length === 0 && msg.response.suggestions.length === 0 && (
                    <p className="text-muted text-sm text-center py-4">
                      I don&apos;t have any suggestions right now. Could you tell me more?
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-3 p-4">
              <div className="w-5 h-5 border-2 border-[var(--fabric-lilac)] border-t-transparent rounded-full animate-spin" />
              <span className="text-muted text-sm">Thinking...</span>
            </div>
          )}

          {/* Initial state */}
          {messages.length === 0 && !isLoading && !error && (
            <div className="text-center py-8 text-muted">
              <Sparkle size={32} weight="duotone" className="mx-auto mb-3 text-[var(--fabric-lilac)]" />
              <p className="text-sm">What are you thinking about?</p>
              <p className="text-xs mt-1">I&apos;m here to help you think it through.</p>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What's on your mind?"
              className="input flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </button>
          </div>
          <p className="text-xs text-muted mt-2 text-center">
            Your choice is always best. Luna just offers thoughts.
          </p>
        </form>
      </div>
    </>
  );
}
