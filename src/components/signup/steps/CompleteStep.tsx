'use client';

import { SignupData } from '../SignupWizard';
import { Confetti, RocketLaunch } from '@phosphor-icons/react';
import Link from 'next/link';

interface CompleteStepProps {
  data: SignupData;
  onComplete: () => void;
}

export function CompleteStep({ data, onComplete }: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center">
      {/* Celebration Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-2">
        <Confetti size={40} weight="fill" className="text-white" />
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You're all set! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to Lunara Quest, {data.displayName || 'friend'}! 
          {data.kidName && (
            <>
              <br />
              {data.kidName} is ready for their learning adventure.
            </>
          )}
        </p>
      </div>

      {/* What's Next */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-left">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          What's next:
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <span className="text-[var(--ember-500)]">→</span>
            Set up your first lesson or assignment
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--ember-500)]">→</span>
            Explore {data.kidName || "your child"}'s portal
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--ember-500)]">→</span>
            Ask Luna for planning help anytime
          </li>
        </ul>
      </div>

      {/* Note about email confirmation */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Check your email to confirm your account. You can still explore while waiting!
      </p>

      {/* Action */}
      <button
        onClick={onComplete}
        className="w-full py-3 px-4 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
      >
        <RocketLaunch size={20} weight="fill" />
        Go to Dashboard
      </button>
    </div>
  );
}
