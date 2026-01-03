'use client';

import { useState, useEffect } from 'react';
import { Moon, Gift, Clock, Sparkle, ArrowsClockwise } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';

interface MoonManagerProps {
  kids: Array<{ id: string; name: string }>;
}

interface Transaction {
  id: string;
  kid_id: string;
  date: string;
  item_id: string;
  stars_earned: number;
  source: string;
  note?: string;
  awarded_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  assignment: '📚 Assignment',
  journal: '📔 Journal',
  bonus: '🎁 Bonus from parent',
  daily_login: '✨ Daily login',
  purchase: '🛒 Shop purchase',
};

export function MoonManager({ kids }: MoonManagerProps) {
  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || '');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalMoons, setTotalMoons] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(5);
  const [bonusNote, setBonusNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch history when kid changes
  useEffect(() => {
    if (selectedKid) {
      fetchHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKid]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/moons?kidId=${selectedKid}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalMoons(data.totalMoons || 0);
      }
    } catch (error) {
      console.error('Failed to fetch moon history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendBonus = async () => {
    if (bonusAmount < 1 || !selectedKid) return;
    
    setIsSending(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/moons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid,
          amount: bonusAmount,
          note: bonusNote || 'Bonus from parent',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: data.message });
        setBonusNote('');
        fetchHistory(); // Refresh
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send bonus' });
    } finally {
      setIsSending(false);
    }
  };

  const selectedKidName = kids.find(k => k.id === selectedKid)?.name || 'Kid';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Moon size={24} weight="fill" className="text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Moon Rewards
        </h3>
      </div>

      {/* Kid Selector */}
      {kids.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Kid
          </label>
          <select
            value={selectedKid}
            onChange={(e) => setSelectedKid(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            {kids.map(kid => (
              <option key={kid.id} value={kid.id}>{kid.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 flex items-center gap-4">
        <Moon size={32} weight="fill" className="text-yellow-500" />
        <div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalMoons}</p>
          <p className="text-sm text-yellow-700/70 dark:text-yellow-400/70">{selectedKidName}'s moons</p>
        </div>
      </div>

      {/* Add Bonus Section */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gift size={20} weight="fill" className="text-purple-500" />
          <h4 className="font-medium text-purple-800 dark:text-purple-300">Give Bonus Moons</h4>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800"
              placeholder="Amount"
            />
          </div>
          <div className="flex-[2]">
            <input
              type="text"
              value={bonusNote}
              onChange={(e) => setBonusNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800"
              placeholder="Optional note (e.g., 'Great job on your project!')"
            />
          </div>
        </div>

        <button
          onClick={sendBonus}
          disabled={isSending}
          className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSending ? (
            <ArrowsClockwise size={18} className="animate-spin" />
          ) : (
            <Sparkle size={18} weight="fill" />
          )}
          Send {bonusAmount} Bonus Moons
        </button>

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Recent History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-gray-400" />
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Last 30 Days</h4>
        </div>

        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            <ArrowsClockwise size={20} className="animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No moon activity yet</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {transactions.map(tx => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {SOURCE_LABELS[tx.source] || tx.source}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(parseISO(tx.awarded_at), 'MMM d, h:mm a')}
                    {tx.note && ` • ${tx.note}`}
                  </p>
                </div>
                <span className={`font-bold ${tx.stars_earned > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.stars_earned > 0 ? '+' : ''}{tx.stars_earned}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
