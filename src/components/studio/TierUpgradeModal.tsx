'use client';

import { X, Sparkle } from '@phosphor-icons/react';
import { type TierLimits } from '@/types/design-studio';
import { useState } from 'react';
import { toast } from 'sonner';

interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  kidId: string;
  currentTier: 1 | 2 | 3 | 4;
  nextTier: 2 | 3 | 4 | null;
  nextTierLimits: TierLimits | null;
  moonCost: number;
  currentMoonBalance: number;
  onUpgradeSuccess: () => void;
}

export function TierUpgradeModal({
  isOpen,
  onClose,
  kidId,
  currentTier,
  nextTier,
  nextTierLimits,
  moonCost,
  currentMoonBalance,
  onUpgradeSuccess,
}: TierUpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen || !nextTier || !nextTierLimits) return null;

  const canAfford = currentMoonBalance >= moonCost;

  const handleUpgrade = async () => {
    if (!canAfford) {
      toast.error('Not enough moons!');
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await fetch(`/api/kids/${kidId}/tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: nextTier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade tier');
      }

      toast.success(`🎉 Upgraded to ${nextTierLimits.name}!`);
      onUpgradeSuccess();
      onClose();
    } catch (error) {
      console.error('Error upgrading tier:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--background-elevated)] rounded-2xl shadow-xl border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
          >
            <X size={20} className="text-muted" />
          </button>
          
          <div className="text-center">
            <div className="text-5xl mb-3">{nextTierLimits.icon}</div>
            <h2 className="text-2xl font-bold text-heading mb-1">
              Upgrade to {nextTierLimits.name}
            </h2>
            <p className="text-sm text-muted">
              Unlock new design tools and features!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* New Features */}
          <div>
            <h3 className="text-sm font-semibold text-heading mb-3 flex items-center gap-2">
              <Sparkle size={16} className="text-[var(--ember-500)]" />
              What's New
            </h3>
            <ul className="space-y-2">
              {nextTierLimits.maxSavedDesigns !== 'unlimited' && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-body">
                    Save up to <strong>{nextTierLimits.maxSavedDesigns} designs</strong>
                  </span>
                </li>
              )}
              {nextTierLimits.maxSavedDesigns === 'unlimited' && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-body">
                    <strong>Unlimited</strong> saved designs!
                  </span>
                </li>
              )}
              
              {nextTier === 2 && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-body">
                    Unlock <strong>Draw tool</strong> with brush customization
                  </span>
                </li>
              )}
              
              {nextTier === 3 && (
                <>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-body">
                      Unlock <strong>Eraser tool</strong> and all brush sizes
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-body">
                      Design <strong>Full Outfits</strong> with all parts at once
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-body">
                      List designs in marketplace (earn moons!)
                    </span>
                  </li>
                </>
              )}
              
              {nextTier === 4 && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-body">
                    List up to <strong>5 designs</strong> in marketplace
                  </span>
                </li>
              )}
              
              {nextTierLimits.canEquipMultiple && currentTier === 1 && (
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-body">
                    <strong>Mix & match</strong> multiple designs
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Cost Display */}
          <div className="bg-[var(--background-secondary)] dark:bg-[var(--night-800)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Cost</span>
              <span className="text-lg font-bold text-heading flex items-center gap-1">
                {moonCost} <span className="text-[var(--celestial-500)]">🌙</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Your balance</span>
              <span className={`text-sm font-semibold ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                {currentMoonBalance} 🌙
              </span>
            </div>
            {!canAfford && (
              <p className="mt-2 text-xs text-red-500">
                You need {moonCost - currentMoonBalance} more moons!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] text-muted hover:bg-[var(--background-secondary)] transition-colors font-medium"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              disabled={!canAfford || isUpgrading}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--ember-500)] to-[var(--celestial-500)] text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
            >
              {isUpgrading ? 'Upgrading...' : 'Unlock Now!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
