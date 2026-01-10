'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Pencil, Trash, Check, X, ArrowsClockwise, Storefront } from '@phosphor-icons/react';
import { REWARD_TEMPLATES, REWARD_CATEGORIES, RewardTemplate } from '@/lib/reward-templates';

interface RewardManagerProps {
  kids: Array<{ id: string; name: string }>;
  kidId?: string;
}

interface KidReward {
  id: string;
  kid_id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  moon_cost: number;
  is_active: boolean;
}

export function RewardManager({ kids, kidId }: RewardManagerProps) {
  const [selectedKid, setSelectedKid] = useState(kidId || kids[0]?.id || '');
  const [rewards, setRewards] = useState<KidReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof REWARD_CATEGORIES>('screen_time');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (selectedKid) fetchRewards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKid]);

  useEffect(() => {
    if (kidId) setSelectedKid(kidId);
  }, [kidId]);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rewards?kidId=${selectedKid}`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFromTemplate = async (template: RewardTemplate) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid,
          name: template.name,
          description: template.description,
          emoji: template.emoji,
          category: template.category,
          moonCost: template.suggestedCost,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Added "${template.name}"` });
        fetchRewards();
        setTimeout(() => setMessage(null), 2000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add reward' });
    }
  };

  const updateCost = async (id: string, newCost: number) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, moonCost: newCost }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchRewards();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  const deleteReward = async (id: string) => {
    if (!confirm('Remove this reward?')) return;
    
    try {
      const res = await fetch(`/api/rewards?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Reward removed' });
        fetchRewards();
        setTimeout(() => setMessage(null), 2000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const selectedKidName = kids.find(k => k.id === selectedKid)?.name || 'Kid';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Storefront size={24} weight="fill" className="text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shop Rewards
        </h3>
      </div>

      {/* Kid Selector */}
      {!kidId && kids.length > 1 && (
        <select
          value={selectedKid}
          onChange={(e) => setSelectedKid(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          {kids.map(kid => (
            <option key={kid.id} value={kid.id}>{kid.name}</option>
          ))}
        </select>
      )}

      {/* Message */}
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      {/* Add from Templates Button */}
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center gap-2"
      >
        <Plus size={20} weight="bold" />
        Add Reward from Templates
      </button>

      {/* Template Picker */}
      {showTemplates && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-purple-800 dark:text-purple-300">
              Choose a Reward Template
            </h4>
            <button 
              onClick={() => setShowTemplates(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(REWARD_CATEGORIES) as (keyof typeof REWARD_CATEGORIES)[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                }`}
              >
                {REWARD_CATEGORIES[cat].emoji} {REWARD_CATEGORIES[cat].label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {REWARD_TEMPLATES.filter(t => t.category === selectedCategory).map(template => (
              <button
                key={template.id}
                onClick={() => addFromTemplate(template)}
                className="p-3 text-left rounded-lg bg-white dark:bg-gray-800 hover:ring-2 hover:ring-purple-400 transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{template.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ~{template.suggestedCost} moons
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Rewards List */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {selectedKidName}'s Shop Rewards ({rewards.length})
        </h4>

        {isLoading ? (
          <div className="text-center py-4">
            <ArrowsClockwise size={20} className="animate-spin mx-auto text-gray-400" />
          </div>
        ) : rewards.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No rewards yet. Add some from the templates above!
          </p>
        ) : (
          <div className="space-y-2">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-xl">{reward.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {reward.name}
                  </p>
                </div>

                {/* Edit Cost */}
                {editingId === reward.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded border text-center"
                      min={1}
                    />
                    <button
                      onClick={() => updateCost(reward.id, editCost)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-bold text-yellow-600">
                      🌙 {reward.moon_cost}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(reward.id);
                        setEditCost(reward.moon_cost);
                      }}
                      className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded"
                      title="Edit cost"
                    >
                      <Pencil size={16} />
                    </button>
                  </>
                )}

                <button
                  onClick={() => deleteReward(reward.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                  title="Remove"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
