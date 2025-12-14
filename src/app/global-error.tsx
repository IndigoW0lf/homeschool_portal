'use client';

import { useEffect } from 'react';
import Image from 'next/image';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            {/* Friendly illustration placeholder */}
            <div className="text-8xl mb-6">🌧️</div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-500 mb-6">
              Don&apos;t worry, it&apos;s not your fault! Our magical portal had a little hiccup.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-[var(--ember-500,#E27D60)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                ✨ Try Again
              </button>
              
              <a
                href="/"
                className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                🏠 Go Home
              </a>
            </div>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600">
                  🔧 Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
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
