'use client';

import React from 'react';

export type TitleGradient = 
  | 'sunset'      // cosmic-rust → ember-gold → nebula-pink
  | 'altar-flame' // candle-cream → herbal-gold → mystic-ember
  | 'ocean'       // celestial-teal
  | 'teal-pink'   // teal → pink
  | 'gold'        // ember-gold shimmer
  | 'dusk'        // deep-night → nebula-purple
  | 'herbal-bloom'// herbal-gold → midnight-bloom
  | 'cosmic'      // night → purple → pink
  | 'moonlit';    // cream → teal

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

const gradientClasses: Record<TitleGradient, string> = {
  sunset: 'bg-gradient-sunset',
  'altar-flame': 'bg-gradient-altar-flame',
  ocean: 'bg-gradient-ocean',
  'teal-pink': 'bg-gradient-teal-pink',
  gold: 'bg-gradient-rust-gold',
  dusk: 'bg-gradient-dusk',
  'herbal-bloom': 'bg-gradient-herbal-bloom',
  cosmic: 'bg-gradient-cosmic',
  moonlit: 'bg-gradient-candle-teal',
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
        font-magical font-normal tracking-wide
        ${sizeClasses[size]}
        ${gradientClasses[gradient]}
        bg-clip-text text-transparent
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
