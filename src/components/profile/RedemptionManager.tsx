'use client';

import { useState, useEffect } from 'react';
import { Gift, Check, X, ArrowsClockwise, Clock } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';

interface RedemptionManagerProps {
  kids: Array<{ id: string; name: string }>;
}

interface Redemption {
  id: string;
  kid_id: string;
  reward_id: string;
  status: string;
  redeemed_at: string;
  source?: 'shop'; // To differentiate shop vs reward
  reward: {
    name: string;
    emoji: string;
    moon_cost: number;
  };
}

export function RedemptionManager({ kids }: RedemptionManagerProps) {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPendingRedemptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingRedemptions = async () => {
    setIsLoading(true);
    try {
      // Fetch for all kids
      const allRedemptions: Redemption[] = [];
      console.log('[RedemptionManager] Fetching for kids:', kids);
      for (const kid of kids) {
        const res = await fetch(`/api/rewards/redeem?kidId=${kid.id}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`[RedemptionManager] Kid ${kid.name}:`, data.redemptions);
          allRedemptions.push(...data.redemptions.map((r: Redemption) => ({ 
            ...r, 
            kidName: kid.name 
          })));
        } else {
          console.error(`[RedemptionManager] Failed for ${kid.name}:`, res.status);
        }
      }
      console.log('[RedemptionManager] Total redemptions:', allRedemptions);
      setRedemptions(allRedemptions);
    } catch (error) {
      console.error('Failed to fetch redemptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (redemptionId: string, status: 'approved' | 'denied' | 'fulfilled', source?: 'shop') => {
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId, status, source }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: data.message });
        // Remove from list
        setRedemptions(prev => prev.filter(r => r.id !== redemptionId));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  const getKidName = (kidId: string) => kids.find(k => k.id === kidId)?.name || 'Kid';

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <ArrowsClockwise size={20} className="animate-spin mx-auto text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Gift size={24} weight="fill" className="text-[var(--nebula-purple)]" />
        <h3 className="heading-sm">
          Pending Rewards
        </h3>
        {redemptions.length > 0 && (
          <span className="px-2 py-0.5 bg-[var(--nebula-purple)] text-[var(--foreground)] text-xs font-bold rounded-full">
            {redemptions.length}
          </span>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
          {message.text}
        </p>
      )}

      {redemptions.length === 0 ? (
        <div className="text-center py-6 text-muted">
          <Clock size={32} className="mx-auto mb-2 opacity-50" />
          <p>No pending reward requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {redemptions.map(redemption => (
            <div
              key={redemption.id}
              className="flex items-center gap-4 p-4 bg-gradient-taupe-pink rounded-xl border border-[var(--nebula-pink)]/30"
            >
              {/* Emoji */}
              <div className="text-3xl">{redemption.reward?.emoji || '🎁'}</div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-heading">
                  {redemption.reward?.name || 'Unknown Reward'}
                </p>
                <p className="text-sm text-muted">
                  {getKidName(redemption.kid_id)} • {formatDistanceToNow(new Date(redemption.redeemed_at), { addSuffix: true })}
                </p>
                <p className="text-xs text-[var(--ember-gold-400)]">
                  🌙 {redemption.reward?.moon_cost || 0} moons
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {redemption.source === 'shop' ? (
                  // Shop items: just mark as fulfilled
                  <button
                    onClick={() => handleAction(redemption.id, 'fulfilled', 'shop')}
                    className="px-3 py-2 bg-[var(--success-light)] text-[var(--success)] rounded-lg hover:bg-[var(--success)]/20 transition-colors font-medium text-sm flex items-center gap-1"
                    title="Mark as fulfilled"
                  >
                    <Check size={16} weight="bold" />
                    Fulfilled
                  </button>
                ) : (
                  // Legacy rewards: approve/deny
                  <>
                    <button
                      onClick={() => handleAction(redemption.id, 'approved')}
                      className="p-2 bg-[var(--success-light)] text-[var(--success)] rounded-lg hover:bg-[var(--success)]/20 transition-colors"
                      title="Approve"
                    >
                      <Check size={20} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleAction(redemption.id, 'denied')}
                      className="p-2 bg-[var(--error-light)] text-[var(--error)] rounded-lg hover:bg-[var(--error)]/20 transition-colors"
                      title="Deny (refund moons)"
                    >
                      <X size={20} weight="bold" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
