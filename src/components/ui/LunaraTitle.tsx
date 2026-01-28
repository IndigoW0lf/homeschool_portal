'use client';

import React from 'react';

export type TitleGradient = 
  | 'sunset'      // Cosmic Rust
  | 'altar-flame' // Herbal Gold
  | 'ocean'       // Celestial Teal
  | 'teal-pink'   // Celestial Teal
  | 'gold'        // Herbal Gold
  | 'dusk'        // Slate
  | 'herbal-bloom'// Herbal Gold
  | 'cosmic'      // Foreground
  | 'moonlit';    // Celestial Teal

export type TitleSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface LunaraTitleProps {
  children: React.ReactNode;
  gradient?: TitleGradient;
  size?: TitleSize;
  as?: 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
}

const sizeClasses: Record<TitleSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
  hero: 'text-5xl md:text-6xl lg:text-7xl',
};

// Using solid palette colors for reliable display
const colorClasses: Record<TitleGradient, string> = {
  sunset: 'text-[var(--cosmic-rust-500)]',
  'altar-flame': 'text-[var(--herbal-gold)]',
  ocean: 'text-[var(--celestial-500)]',
  'teal-pink': 'text-[var(--celestial-400)]',
  gold: 'text-[var(--herbal-gold)]',
  dusk: 'text-[var(--slate-400)]',
  'herbal-bloom': 'text-[var(--herbal-gold)]',
  cosmic: 'text-[var(--foreground)]',
  moonlit: 'text-[var(--celestial-400)]',
};

export function LunaraTitle({
  children,
  gradient = 'sunset',
  size = 'lg',
  as: Component = 'h2',
  className = '',
}: LunaraTitleProps) {
  return (
    <Component
      className={`
        font-bold tracking-wide
        ${sizeClasses[size]}
        ${colorClasses[gradient]}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

