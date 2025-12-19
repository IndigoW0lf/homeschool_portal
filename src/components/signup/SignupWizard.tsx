'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WelcomeStep } from './steps/WelcomeStep';
import { ParentAccountStep } from './steps/ParentAccountStep';
import { AddKidStep } from './steps/AddKidStep';
import { CompleteStep } from './steps/CompleteStep';

const STEPS = [
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
  kidAvatarUrl: '',
  kidPin: '',
  termsAccepted: false,
};

export function SignupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<SignupData>(initialData);
  const [userId, setUserId] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const updateData = (updates: Partial<SignupData>) => {
    setData(prev => ({ ...prev, ...updates }));
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
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    router.push('/parent');
  };

  return (
    <div className="card p-6 sm:p-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => {
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
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-[var(--ember-500)] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  )}
                >
                  {isCompleted ? <Check size={16} weight="bold" /> : step.number}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 hidden sm:block",
                    isActive ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 sm:w-16 h-0.5 mx-2",
                    index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 0 && (
          <WelcomeStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            setTurnstileToken={setTurnstileToken}
          />
        )}
        {currentStep === 1 && (
          <ParentAccountStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            setUserId={setUserId}
          />
        )}
        {currentStep === 2 && (
          <AddKidStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            userId={userId}
          />
        )}
        {currentStep === 3 && (
          <CompleteStep
            data={data}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
