'use client';

import { useState, useEffect } from 'react';
import { Star, Sparkle, X } from '@phosphor-icons/react';
import { Badge, ALL_BADGES } from '@/lib/badges';

interface BadgeUnlockModalProps {
  badgeId: string | null;
  onClose: () => void;
}

export function BadgeUnlockModal({ badgeId, onClose }: BadgeUnlockModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const badge = badgeId ? ALL_BADGES.find(b => b.id === badgeId) : null;
  
  useEffect(() => {
    if (badge) {
      // Delay the animation slightly for better effect
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [badge]);
  
  if (!badge) return null;
  
  const Icon = badge.icon;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`
          relative bg-gradient-to-br from-[var(--nebula-purple-deep)] via-[var(--celestial-900)] to-[var(--night-900)] 
          rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl
          border border-[var(--nebula-purple)]/30
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--nebula-purple-light)] hover:text-[var(--foreground)] transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Sparkle decorations */}
        <div className="absolute top-4 left-4 animate-pulse">
          <Sparkle size={20} weight="fill" className="text-[var(--solar-400)]" />
        </div>
        <div className="absolute bottom-8 right-8 animate-pulse delay-150">
          <Star size={16} weight="fill" className="text-[var(--solar-300)]" />
        </div>
        <div className="absolute top-12 right-12 animate-pulse delay-300">
          <Sparkle size={14} weight="fill" className="text-[var(--nebula-purple-light)]" />
        </div>
        <div className="absolute bottom-12 left-8 animate-pulse delay-500">
          <Star size={12} weight="fill" className="text-[var(--nebula-pink)]" />
        </div>
        
        {/* Title */}
        <div className="mb-6">
          <p className="text-[var(--solar-400)] font-bold text-sm uppercase tracking-widest mb-1">
            ✨ New Badge Unlocked! ✨
          </p>
        </div>
        
        {/* Badge Icon - Large and Glowing */}
        <div className="relative mx-auto mb-6">
          <div 
            className={`
              w-28 h-28 mx-auto rounded-full flex items-center justify-center
              bg-gradient-to-br from-[var(--solar-200)] via-[var(--solar-300)] to-[var(--solar-400)]
              shadow-lg shadow-[var(--solar-500)]/30
              animate-pulse
            `}
          >
            <Icon 
              size={56} 
              weight="fill" 
              className={badge.color} 
            />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-[var(--solar-400)]/20 blur-xl animate-pulse" />
        </div>
        
        {/* Badge Name */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {badge.name}
        </h2>
        
        {/* Badge Description */}
        <p className="text-[var(--nebula-purple-light)] text-sm mb-6 leading-relaxed">
          {badge.description}
        </p>
        
        {/* Category tag */}
        <div className="inline-block px-3 py-1 rounded-full bg-[var(--nebula-purple)]/50 text-[var(--nebula-purple-light)] text-xs font-medium mb-6">
          {badge.category === 'milestone' && '🏆 Milestone Achievement'}
          {badge.category === 'subject' && '📚 Subject Mastery'}
          {badge.category === 'special' && '🌟 Special Achievement'}
        </div>
        
        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-gradient-to-r from-[var(--solar-400)] to-[var(--solar-500)] text-heading font-bold rounded-xl hover:from-[var(--solar-300)] hover:to-[var(--solar-400)] transition-all shadow-lg shadow-[var(--solar-500)]/30"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
