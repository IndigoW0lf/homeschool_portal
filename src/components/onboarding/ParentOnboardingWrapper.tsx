'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ParentOnboarding } from '@/components/onboarding';
import { supabase } from '@/lib/supabase/browser';

interface ParentOnboardingWrapperProps {
  userId: string;
  hasSeenTutorial: boolean;
}

export function ParentOnboardingWrapper({ userId, hasSeenTutorial }: ParentOnboardingWrapperProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [familyName, setFamilyName] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show onboarding if user hasn't seen it
    if (!hasSeenTutorial) {
      setShowOnboarding(true);
    }
    
    // Also show if just joined a family
    const justJoined = searchParams.get('joined') === 'true';
    if (justJoined) {
      setShowOnboarding(true);
      // Fetch family name for joined users
      fetchFamilyName();
    }
  }, [hasSeenTutorial, searchParams]);

  const fetchFamilyName = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('family:families(name)')
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const family = data?.family as any;
    if (family?.name) {
      setFamilyName(family.name);
    }
  };

  const handleComplete = async () => {
    setShowOnboarding(false);
    
    // Mark tutorial as seen
    await supabase
      .from('profiles')
      .update({ has_seen_tutorial: true })
      .eq('id', userId);
  };

  if (!showOnboarding) return null;

  return <ParentOnboarding onComplete={handleComplete} familyName={familyName} />;
}
