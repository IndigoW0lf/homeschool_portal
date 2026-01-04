'use client';

import { OnboardingModal } from './OnboardingModal';
import { 
  Rocket, 
  Scroll, 
  Moon, 
  BookOpen 
} from '@phosphor-icons/react';

interface KidOnboardingProps {
  onComplete: () => void;
  kidName?: string;
}

const slides = [
  {
    icon: <Rocket size={40} weight="fill" />,
    title: "Welcome to Your Portal!",
    description: "This is your special space for learning adventures. Let's see what you can do here!",
    highlight: "Ready to explore? 🚀",
  },
  {
    icon: <Scroll size={40} weight="fill" />,
    title: "Check Your Daily Quests",
    description: "Every day you'll have lessons and activities waiting for you. Complete them to earn rewards!",
    highlight: "Start on your Overview page",
  },
  {
    icon: <Moon size={40} weight="fill" />,
    title: "Earn Moons & Badges",
    description: "Complete your work to collect moons! Save up to get rewards from the shop. Earn badges for special achievements.",
    highlight: "Check News for badge updates 🏆",
  },
  {
    icon: <BookOpen size={40} weight="fill" />,
    title: "Write in Your Journal",
    description: "Share your thoughts, ideas, and stories. Your journal is just for you (and grown-ups if you want).",
    highlight: "Find it in the sidebar →",
  },
];

export function KidOnboarding({ onComplete, kidName }: KidOnboardingProps) {
  // Customize first slide with kid's name
  const customSlides = kidName
    ? slides.map((slide, i) => 
        i === 0 
          ? { ...slide, title: `Welcome, ${kidName}!` }
          : slide
      )
    : slides;

  return (
    <OnboardingModal 
      slides={customSlides} 
      onComplete={onComplete}
    />
  );
}
