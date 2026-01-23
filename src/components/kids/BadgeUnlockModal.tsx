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
          relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 
          rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl
          border border-purple-500/30
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-purple-300 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Sparkle decorations */}
        <div className="absolute top-4 left-4 animate-pulse">
          <Sparkle size={20} weight="fill" className="text-yellow-400" />
        </div>
        <div className="absolute bottom-8 right-8 animate-pulse delay-150">
          <Star size={16} weight="fill" className="text-yellow-300" />
        </div>
        <div className="absolute top-12 right-12 animate-pulse delay-300">
          <Sparkle size={14} weight="fill" className="text-purple-300" />
        </div>
        <div className="absolute bottom-12 left-8 animate-pulse delay-500">
          <Star size={12} weight="fill" className="text-pink-400" />
        </div>
        
        {/* Title */}
        <div className="mb-6">
          <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest mb-1">
            ✨ New Badge Unlocked! ✨
          </p>
        </div>
        
        {/* Badge Icon - Large and Glowing */}
        <div className="relative mx-auto mb-6">
          <div 
            className={`
              w-28 h-28 mx-auto rounded-full flex items-center justify-center
              bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-300
              shadow-lg shadow-yellow-500/30
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
          <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl animate-pulse" />
        </div>
        
        {/* Badge Name */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {badge.name}
        </h2>
        
        {/* Badge Description */}
        <p className="text-purple-200 text-sm mb-6 leading-relaxed">
          {badge.description}
        </p>
        
        {/* Category tag */}
        <div className="inline-block px-3 py-1 rounded-full bg-purple-800/50 text-purple-300 text-xs font-medium mb-6">
          {badge.category === 'milestone' && '🏆 Milestone Achievement'}
          {badge.category === 'subject' && '📚 Subject Mastery'}
          {badge.category === 'special' && '🌟 Special Achievement'}
        </div>
        
        {/* Continue button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 text-heading font-bold rounded-xl hover:from-yellow-300 hover:to-amber-400 transition-all shadow-lg shadow-yellow-500/30"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
