'use client';

import { useEffect } from 'react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            background: 'linear-gradient(135deg, #1C2029 0%, #14171F 50%, #0D0F14 100%)',
          }}
        >
          <div className="text-center max-w-md">
            {/* Friendly illustration */}
            <div className="text-8xl mb-6">🌧️</div>
            
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-muted mb-6">
              Don&apos;t worry, it&apos;s not your fault! Our magical portal had a little hiccup.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 text-[var(--foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg, #B86A4B 0%, #D4A853 100%)',
                }}
              >
                ✨ Try Again
              </button>
              
              <a
                href="/"
                className="block w-full px-6 py-3 bg-[var(--background-elevated)]/10 text-[var(--foreground)] rounded-xl font-medium hover:bg-[var(--background-elevated)]/20 transition-colors border border-white/10"
              >
                🏠 Go Home
              </a>
            </div>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left bg-black/30 rounded-lg p-4 border border-white/10">
                <summary className="cursor-pointer text-sm font-medium text-muted">
                  🔧 Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
