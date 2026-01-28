'use client';

import { SignupData } from '../SignupWizard';
import { Confetti, RocketLaunch, UsersThree } from '@phosphor-icons/react';

interface CompleteStepProps {
  data: SignupData;
  onComplete: () => void;
  joiningFamily?: string | null;
}

export function CompleteStep({ data, onComplete, joiningFamily }: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center">
      {/* Celebration Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-2">
        {joiningFamily ? (
          <UsersThree size={40} weight="fill" className="text-[var(--foreground)]" />
        ) : (
          <Confetti size={40} weight="fill" className="text-[var(--foreground)]" />
        )}
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">
          {joiningFamily ? "You're in! 🎉" : "You're all set! 🎉"}
        </h2>
        <p className="text-muted">
          {joiningFamily ? (
            <>
              Welcome to <strong>{joiningFamily}</strong>, {data.displayName || 'friend'}!
              <br />
              You can now view and manage the family's homeschool activities.
            </>
          ) : (
            <>
              Welcome to Lunara Quest, {data.displayName || 'friend'}! 
              {data.kidName && (
                <>
                  <br />
                  {data.kidName} is ready for their learning adventure.
                </>
              )}
            </>
          )}
        </p>
      </div>

      {/* What's Next */}
      <div className="bg-[var(--background-secondary)]/50 rounded-xl p-4 text-left">
        <h3 className="font-medium text-heading mb-3">
          What's next:
        </h3>
        <ul className="space-y-2 text-sm text-muted">
          {joiningFamily ? (
            <>
              <li className="flex items-center gap-2">
                <span className="text-[var(--ember-500)]">→</span>
                View the family's lessons and assignments
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--ember-500)]">→</span>
                Check in on the kids' progress
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--ember-500)]">→</span>
                Collaborate on planning together
              </li>
            </>
          ) : (
            <>
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
            </>
          )}
        </ul>
      </div>

      {/* Note about email confirmation */}
      <p className="text-xs text-muted">
        Check your email to confirm your account. You can still explore while waiting!
      </p>

      {/* Action */}
      <button
        onClick={onComplete}
        className="w-full py-3 px-4 bg-[var(--ember-500)] text-[var(--foreground)] rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
      >
        <RocketLaunch size={20} weight="fill" />
        Go to Dashboard
      </button>
    </div>
  );
}
