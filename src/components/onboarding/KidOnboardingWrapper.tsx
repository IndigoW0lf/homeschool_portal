'use client';

import { useState } from 'react';
import { KidOnboarding } from '@/components/onboarding';
import { supabase } from '@/lib/supabase/browser';

interface KidOnboardingWrapperProps {
  kidId: string;
  kidName: string;
  hasSeenTutorial: boolean;
}

export function KidOnboardingWrapper({ kidId, kidName, hasSeenTutorial }: KidOnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenTutorial);

  const handleComplete = async () => {
    setShowOnboarding(false);
    
    // Mark tutorial as seen for this kid
    await supabase
      .from('kids')
      .update({ has_seen_tutorial: true })
      .eq('id', kidId);
  };

  if (!showOnboarding) return null;

  return <KidOnboarding onComplete={handleComplete} kidName={kidName} />;
}
