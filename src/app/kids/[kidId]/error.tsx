'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function KidPortalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[KidPortal] Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cosmic bg-starfield flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🌙</div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/70 mb-6">
          A star got lost in the galaxy. Try again and it should come back!
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-white/20 text-white font-semibold hover:bg-white/30 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
