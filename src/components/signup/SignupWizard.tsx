'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WelcomeStep } from './steps/WelcomeStep';
import { ParentAccountStep } from './steps/ParentAccountStep';
import { AddKidStep } from './steps/AddKidStep';
import { CompleteStep } from './steps/CompleteStep';

// Steps can be skipped for invite flow
const ALL_STEPS = [
  { id: 'welcome', label: 'Welcome', number: 1 },
  { id: 'account', label: 'Your Account', number: 2 },
  { id: 'kid', label: 'Add Kid', number: 3 },
  { id: 'complete', label: 'Complete', number: 4 },
];

export interface SignupData {
  // Parent account
  email: string;
  password: string;
  displayName: string;
  // Kid info
  kidName: string;
  gradeBand: string;
  grades: string[];
  kidAvatarUrl: string;
  kidPin: string; // 4-digit PIN for kid access
  // Meta
  termsAccepted: boolean;
}

const initialData: SignupData = {
  email: '',
  password: '',
  displayName: '',
  kidName: '',
  gradeBand: '3-5',
  grades: [],
  kidAvatarUrl: '',
  kidPin: '',
  termsAccepted: false,
};

export function SignupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<SignupData>(initialData);
  const [userId, setUserId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [skipKidStep, setSkipKidStep] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joiningFamilyName, setJoiningFamilyName] = useState<string | null>(null);

  // Check for invite redirect
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    const email = searchParams.get('email');
    
    // Pre-fill email from invite
    if (email) {
      setData(prev => ({ ...prev, email }));
    }
    
    // Extract invite code from redirect path
    if (redirect?.startsWith('/invite/')) {
      const code = redirect.replace('/invite/', '');
      setInviteCode(code);
    }
  }, [searchParams]);

  // Determine which steps to show
  const steps = skipKidStep
    ? ALL_STEPS.filter(s => s.id !== 'kid').map((s, i) => ({ ...s, number: i + 1 }))
    : ALL_STEPS;

  const updateData = (updates: Partial<SignupData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  // Check if joining family has kids after account creation
  const checkFamilyForKids = async () => {
    if (!inviteCode || !userId) return false;
    
    try {
      // Fetch the invite and family
      const response = await fetch(`/api/invites/check-family?code=${inviteCode}`);
      const result = await response.json();
      
      if (result.hasKids) {
        setSkipKidStep(true);
        setJoiningFamilyName(result.familyName);
        return true;
      }
    } catch (err) {
      console.error('Error checking family:', err);
    }
    return false;
  };

  const nextStep = async () => {
    // Verify turnstile token on first step transition
    if (currentStep === 0 && turnstileToken) {
      try {
        const response = await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const result = await response.json();
        if (!result.success) {
          console.error('Turnstile verification failed');
          return;
        }
      } catch (err) {
        console.error('Turnstile verification error:', err);
        return;
      }
    }
    
    // After account creation (step 1 -> 2), check if we should skip kid step
    if (currentStep === 1 && inviteCode) {
      const hasKids = await checkFamilyForKids();
      if (hasKids) {
        // Skip to complete step (which will handle invite acceptance)
        const completeStepIndex = steps.findIndex(s => s.id === 'complete');
        setCurrentStep(completeStepIndex);
        return;
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    // If we have an invite code, accept it before redirecting
    if (inviteCode) {
      try {
        const response = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ code: inviteCode }),
        });
        if (response.redirected) {
          window.location.href = response.url;
          return;
        }
      } catch (err) {
        console.error('Error accepting invite:', err);
      }
    }
    router.push('/parent');
  };

  // Map step index to step id for rendering
  const currentStepId = steps[currentStep]?.id;

  return (
    <div className="card p-6 sm:p-8">
      {/* Show joining family message if applicable */}
      {joiningFamilyName && (
        <div className="mb-6 p-4 bg-[var(--lavender-100)] dark:bg-[var(--lavender-900)]/20 rounded-xl border border-[var(--lavender-200)] dark:border-[var(--lavender-800)]">
          <p className="text-sm text-[var(--lavender-700)] dark:text-[var(--lavender-300)]">
            ✨ You're joining <strong>{joiningFamilyName}</strong> – the kids are already set up!
          </p>
        </div>
      )}

      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isCompleted
                      ? "bg-green-500 text-[var(--foreground)]"
                      : isActive
                      ? "bg-[var(--ember-500)] text-[var(--foreground)]"
                      : "bg-[var(--background-secondary)] text-muted"
                  )}
                >
                  {isCompleted ? <Check size={16} weight="bold" /> : step.number}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 hidden sm:block",
                    isActive ? "text-heading font-medium" : "text-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 sm:w-16 h-0.5 mx-2",
                    index < currentStep
                      ? "bg-green-500"
                      : "bg-[var(--background-secondary)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStepId === 'welcome' && (
          <WelcomeStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            setTurnstileToken={setTurnstileToken}
          />
        )}
        {currentStepId === 'account' && (
          <ParentAccountStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            setUserId={setUserId}
          />
        )}
        {currentStepId === 'kid' && (
          <AddKidStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            userId={userId}
          />
        )}
        {currentStepId === 'complete' && (
          <CompleteStep
            data={data}
            onComplete={handleComplete}
            joiningFamily={joiningFamilyName}
          />
        )}
      </div>
    </div>
  );
}
