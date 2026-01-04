'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ParentOnboarding } from '@/components/onboarding';
import { supabase } from '@/lib/supabase/browser';

interface ParentOnboardingWrapperProps {
  userId: string;
  hasSeenTutorial: boolean;
}

export function ParentOnboardingWrapper({ userId, hasSeenTutorial }: ParentOnboardingWrapperProps) {
  // Use ref to track if we've already shown/dismissed the onboarding this session
  const hasShownRef = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [familyName, setFamilyName] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only show once per session - if already shown/dismissed, don't show again
    if (hasShownRef.current) return;
    
    // Check localStorage for session-level dismissal
    const dismissed = localStorage.getItem(`onboarding_dismissed_${userId}`);
    if (dismissed) return;

    // Show onboarding if user hasn't seen it (from DB)
    if (!hasSeenTutorial) {
      setShowOnboarding(true);
      hasShownRef.current = true;
    }
    
    // Also show if just joined a family (has ?joined=true in URL)
    const justJoined = searchParams.get('joined') === 'true';
    if (justJoined && !hasSeenTutorial) {
      setShowOnboarding(true);
      hasShownRef.current = true;
      fetchFamilyName();
    }
  }, [hasSeenTutorial, searchParams, userId]);

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
    
    // Mark as dismissed in localStorage (session-level)
    localStorage.setItem(`onboarding_dismissed_${userId}`, 'true');
    
    // Mark tutorial as seen in DB (permanent)
    await supabase
      .from('profiles')
      .update({ has_seen_tutorial: true })
      .eq('id', userId);
  };

  if (!showOnboarding) return null;

  return <ParentOnboarding onComplete={handleComplete} familyName={familyName} />;
}
