'use client';

import { Lock, ArrowUp } from '@phosphor-icons/react';

interface LockedFeatureBadgeProps {
  featureName: string;
  requiredTier: 2 | 3 | 4;
  tierName: string;
  moonCost: number;
  onClick?: () => void;
  variant?: 'compact' | 'full';
}

export function LockedFeatureBadge({
  featureName,
  requiredTier,
  tierName,
  moonCost,
  onClick,
  variant = 'full',
}: LockedFeatureBadgeProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors group"
        title={`Unlock at ${tierName} (${moonCost} moons)`}
      >
        <Lock size={14} className="text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
          Tier {requiredTier}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-600 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
          <Lock size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-heading">
            {featureName}
          </p>
          <p className="text-xs text-muted">
            Unlock at <strong>{tierName}</strong> tier
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
        <span className="text-sm font-bold">{moonCost} 🌙</span>
        <ArrowUp size={16} className="rotate-45" />
      </div>
    </button>
  );
}
