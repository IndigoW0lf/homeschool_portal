'use client';

import { SignupWizard } from '@/components/signup/SignupWizard';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800">
      <div className="max-w-xl mx-auto px-4 py-12">
        <SignupWizard />
      </div>
    </div>
  );
}
