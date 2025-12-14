'use client';

import { useEffect } from 'react';
import { MagicWand, ArrowClockwise, House } from '@phosphor-icons/react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <MagicWand size={80} weight="duotone" color="#caa2d8" className="mx-auto mb-4" />
        
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Something mysterious happened...
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          This page didn&apos;t load correctly. Let&apos;s try that again!
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary"
          >
            <ArrowClockwise size={18} weight="bold" />
            Try Again
          </button>
          
          <a
            href="/"
            className="btn-secondary"
          >
            <House size={18} weight="bold" />
            Home
          </a>
        </div>
        
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
            <p className="text-xs text-red-600 dark:text-red-400 font-mono">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
