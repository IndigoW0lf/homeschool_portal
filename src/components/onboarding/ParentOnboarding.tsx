'use client';

import { OnboardingModal } from './OnboardingModal';
import { 
  Sparkle, 
  CalendarCheck, 
  ChartLineUp, 
  UsersThree 
} from '@phosphor-icons/react';

interface ParentOnboardingProps {
  onComplete: () => void;
  familyName?: string;
}

const slides = [
  {
    icon: <Sparkle size={40} weight="fill" />,
    title: "Welcome to Lunara Quest!",
    description: "Your magical homeschool companion for planning lessons, tracking progress, and keeping kids engaged.",
    highlight: "Let's take a quick tour ✨",
  },
  {
    icon: <CalendarCheck size={40} weight="fill" />,
    title: "Plan Lessons & Assignments",
    description: "Create lessons, schedule assignments on the calendar, and build playlists for each day.",
    highlight: "Find these in the sidebar →",
  },
  {
    icon: <ChartLineUp size={40} weight="fill" />,
    title: "Track Progress",
    description: "See how your kids are doing with completed assignments, earned moons, and badges.",
    highlight: "Check the Progress page for insights",
  },
  {
    icon: <UsersThree size={40} weight="fill" />,
    title: "Invite Family Members",
    description: "Add another parent, grandparent, or tutor to help manage your homeschool together.",
    highlight: "Find this in Settings → Kids & Access",
  },
];

export function ParentOnboarding({ onComplete, familyName }: ParentOnboardingProps) {
  const welcomeMessage = familyName 
    ? `Welcome to ${familyName}!` 
    : undefined;

  return (
    <OnboardingModal 
      slides={slides} 
      onComplete={onComplete}
      welcomeMessage={welcomeMessage}
    />
  );
}
