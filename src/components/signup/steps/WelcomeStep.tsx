'use client';

import Link from 'next/link';
import { SignupData } from '../SignupWizard';
import { Sparkle, CheckSquare, Square } from '@phosphor-icons/react';

interface WelcomeStepProps {
  data: SignupData;
  updateData: (updates: Partial<SignupData>) => void;
  onNext: () => void;
}

export function WelcomeStep({ data, updateData, onNext }: WelcomeStepProps) {
  const canContinue = data.termsAccepted;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--lavender-400)] to-[var(--ember-400)] mb-4">
          <Sparkle size={32} weight="fill" className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Lunara Quest!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your magical homeschool companion awaits. Let's get you set up!
        </p>
      </div>

      {/* What You'll Get */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          What's included:
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Plan and organize your homeschool day
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Fun gamified experience for kids
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Luna AI assistant to help you plan
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Track progress and celebrate wins
          </li>
        </ul>
      </div>

      {/* Terms Checkbox */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={() => updateData({ termsAccepted: !data.termsAccepted })}
          className="flex items-start gap-3 w-full text-left"
        >
          {data.termsAccepted ? (
            <CheckSquare size={24} weight="fill" className="text-[var(--ember-500)] flex-shrink-0 mt-0.5" />
          ) : (
            <Square size={24} className="text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I agree to the{' '}
            <Link href="/legal/terms" className="text-[var(--ember-500)] hover:underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-[var(--ember-500)] hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </span>
        </button>
      </div>

      {/* Action */}
      <button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full py-3 px-4 bg-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Get Started
      </button>
    </div>
  );
}
