'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type FeedbackType = 'success' | 'error';

export interface FeedbackOptions {
  type: FeedbackType;
  title: string;
  message?: string;
}

interface FeedbackContextValue {
  show: (opts: FeedbackOptions) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    return {
      show: (opts: FeedbackOptions) => {
        if (typeof window !== 'undefined') {
          if (opts.type === 'error') {
            console.error('[FeedbackModal not mounted]', opts.title, opts.message);
          }
        }
      },
    };
  }
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FeedbackOptions | null>(null);

  const show = useCallback((opts: FeedbackOptions) => {
    setState(opts);
  }, []);

  const dismiss = useCallback(() => {
    setState(null);
  }, []);

  useEffect(() => {
    if (!state) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, dismiss]);

  return (
    <FeedbackContext.Provider value={{ show }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          tabIndex={-1}
        >
          <div
            className={cn(
              'w-full max-w-sm rounded-2xl shadow-xl overflow-hidden',
              'bg-[var(--background-elevated)] border-2',
              'animate-in zoom-in-95 duration-200',
              state.type === 'success' && 'border-[var(--herbal-300)]',
              state.type === 'error' && 'border-[var(--cosmic-rust-400)]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              {state.type === 'success' && (
                <CheckCircle
                  size={48}
                  weight="duotone"
                  className="mx-auto mb-3 text-[var(--herbal-500)]"
                  aria-hidden
                />
              )}
              {state.type === 'error' && (
                <XCircle
                  size={48}
                  weight="duotone"
                  className="mx-auto mb-3 text-[var(--cosmic-rust-500)]"
                  aria-hidden
                />
              )}
              <h3 id="feedback-title" className="text-lg font-semibold text-[var(--foreground)]">
                {state.title}
              </h3>
              {state.message && (
                <p className="mt-2 text-sm text-[var(--muted)]">{state.message}</p>
              )}
              <p className="mt-4 text-xs text-[var(--muted)]">
                Click anywhere to close
              </p>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
