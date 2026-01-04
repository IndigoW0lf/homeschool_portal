'use client';

import { useState } from 'react';
import { seedDemoData } from '@/app/actions/demo';
import { Sparkle, Check, Warning } from '@phosphor-icons/react';

export function DemoDataManager() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSeed = async () => {
    setStatus('loading');
    try {
      const result = await seedDemoData();
      if (result.success) {
        setStatus('success');
        // Reset after 3s
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
            Demo Data
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4 max-w-md">
            Populate your account with example kids, lessons, schedule items, and journal entries. 
            Perfect for taking screenshots or testing the app logic.
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Sparkle size={24} className="text-indigo-500" weight="fill" />
        </div>
      </div>

      <button
        onClick={handleSeed}
        disabled={status === 'loading' || status === 'success'}
        className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
          status === 'success'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : status === 'error'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
        }`}
      >
        {status === 'loading' && (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating Magic...
          </>
        )}
        {status === 'success' && (
          <>
            <Check size={18} weight="bold" />
            Done!
          </>
        )}
        {status === 'error' && (
          <>
            <Warning size={18} weight="bold" />
            Error (Try Again)
          </>
        )}
        {status === 'idle' && (
          <>
            <Sparkle size={18} />
            Seed Demo Data
          </>
        )}
      </button>
      
      {status === 'success' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-2 animate-in fade-in">
          Created demo kids, lessons, and schedule items!
        </p>
      )}
    </div>
  );
}
