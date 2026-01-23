'use client';

import { useState } from 'react';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

interface OnboardingModalProps {
  slides: OnboardingSlide[];
  onComplete: () => void;
  welcomeMessage?: string;
}

export function OnboardingModal({ slides, onComplete, welcomeMessage }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--background-elevated)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-muted hover:text-muted dark:hover:text-muted transition-colors z-10"
          aria-label="Skip tutorial"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 pt-12 text-center">
          {/* Welcome message for invited users */}
          {welcomeMessage && currentSlide === 0 && (
            <div className="mb-4 px-4 py-2 bg-[var(--lavender-100)] dark:bg-[var(--lavender-900)]/30 rounded-full inline-block">
              <span className="text-sm font-medium text-[var(--lavender-700)] dark:text-[var(--lavender-300)]">
                {welcomeMessage}
              </span>
            </div>
          )}

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--lavender-400)] to-[var(--ember-400)] mb-6">
            <div className="text-white">
              {slide.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-heading mb-3">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-muted mb-2">
            {slide.description}
          </p>

          {/* Highlight text */}
          {slide.highlight && (
            <p className="text-sm font-medium text-[var(--ember-500)]">
              {slide.highlight}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8">
          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentSlide
                    ? "w-6 bg-[var(--ember-500)]"
                    : "bg-[var(--moon-200)] dark:bg-[var(--night-600)] hover:bg-[var(--moon-300)]"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="flex-1 py-3 px-4 bg-[var(--background-secondary)] text-heading dark:text-muted rounded-xl font-medium hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-600)] transition-colors flex items-center justify-center gap-2"
              >
                <CaretLeft size={18} weight="bold" />
                Back
              </button>
            )}
            <button
              onClick={nextSlide}
              className={cn(
                "flex-1 py-3 px-4 bg-gradient-to-r from-[var(--lavender-500)] to-[var(--ember-500)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
                currentSlide === 0 && "w-full"
              )}
            >
              {isLastSlide ? "Let's Go!" : "Next"}
              {!isLastSlide && <CaretRight size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
