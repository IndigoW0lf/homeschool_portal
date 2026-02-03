'use client';

import { useState, useEffect } from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Gift, Plus, Pencil, Trash, Check, X, ArrowsClockwise, Storefront, Star, FloppyDisk, Infinity as InfinityIcon } from '@phosphor-icons/react';
import { REWARD_TEMPLATES, REWARD_CATEGORIES, RewardTemplate } from '@/lib/reward-templates';

// Common icons for the picker
const ICON_PICKER_OPTIONS = [
  'GameController', 'DeviceMobile', 'Television', 'DeviceTablet', 'Headphones',
  'Bicycle', 'Basketball', 'SoccerBall', 'Trophy', 'Medal',
  'Cookie', 'IceCream', 'Pizza', 'Popcorn', 'Candy',
  'Palette', 'MusicNotes', 'Book', 'Pencil', 'Backpack',
  'Car', 'Airplane', 'Train', 'Rocket', 'Ufo',
  'Sun', 'Moon', 'CloudRain', 'Fire', 'Snowflake',
  'Smiley', 'Heart', 'Star', 'Gift', 'Ticket',
  'Money', 'PiggyBank', 'CreditCard', 'ShoppingBag', 'Tag'
];

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
  icon?: string;
  category: string;
  moon_cost: number;
  is_active: boolean;
  is_unlimited: boolean;
}

interface CustomTemplate extends RewardTemplate {
  icon?: string;
  is_unlimited?: boolean;
}

export function RewardManager({ kids, kidId }: RewardManagerProps) {
  const [selectedKid, setSelectedKid] = useState(kidId || kids[0]?.id || '');
  const [rewards, setRewards] = useState<KidReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof REWARD_CATEGORIES | 'custom'>('screen_time');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Custom Form State
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    moonCost: 10,
    icon: 'Gift',
    category: 'custom',
    isUnlimited: true,
    saveAsTemplate: false
  });

  // DB Templates
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  useEffect(() => {
    if (selectedKid) fetchRewards();
    fetchCustomTemplates();
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

  const fetchCustomTemplates = async () => {
    try {
      const res = await fetch('/api/rewards/templates');
      if (res.ok) {
        const data = await res.json();
        setCustomTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const addFromTemplate = async (template: RewardTemplate | CustomTemplate) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid,
          name: template.name,
          description: template.description,
          emoji: template.emoji,
          icon: (template as CustomTemplate).icon,
          category: template.category,
          moonCost: template.suggestedCost,
          isUnlimited: (template as CustomTemplate).is_unlimited ?? true,
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

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Add to Kid Rewards
      const rewardRes = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid,
          name: newItem.name,
          description: newItem.description,
          category: newItem.category,
          moonCost: newItem.moonCost,
          icon: newItem.icon,
          isUnlimited: newItem.isUnlimited,
          emoji: '🎁' // Fallback
        }),
      });

      if (!rewardRes.ok) throw new Error('Failed to create reward');

      // 2. Save as Template if requested
      if (newItem.saveAsTemplate) {
        await fetch('/api/rewards/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newItem.name,
            description: newItem.description,
            category: newItem.category,
            moonCost: newItem.moonCost,
            icon: newItem.icon,
            isUnlimited: newItem.isUnlimited,
            emoji: '🎁'
          }),
        });
        fetchCustomTemplates();
      }

      setMessage({ type: 'success', text: `Created "${newItem.name}"` });
      setShowCustomForm(false);
      setNewItem({
        name: '',
        description: '',
        moonCost: 10,
        icon: 'Gift',
        category: 'custom',
        isUnlimited: true,
        saveAsTemplate: false
      });
      fetchRewards();
      setTimeout(() => setMessage(null), 2000);

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to create reward' });
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
  
  const toggleUnlimited = async (reward: KidReward) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reward.id, isUnlimited: !reward.is_unlimited }),
      });

      if (res.ok) {
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

  // Helper to render icon
  const renderIcon = (iconName: string | undefined, emoji: string, size = 24) => {
    if (iconName && (PhosphorIcons as any)[iconName]) {
      const IconCmp = (PhosphorIcons as any)[iconName];
      return <IconCmp size={size} weight="duotone" className="text-[var(--nebula-purple)]" />;
    }
    return <span style={{ fontSize: size }}>{emoji}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Storefront size={24} weight="fill" className="text-[var(--nebula-purple)]" />
        <h3 className="text-lg font-semibold text-heading">
          Shop Rewards
        </h3>
      </div>

      {/* Kid Selector */}
      {!kidId && kids.length > 1 && (
        <select
          value={selectedKid}
          onChange={(e) => setSelectedKid(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)]"
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowCustomForm(true); setShowTemplates(false); }}
          className="flex-1 py-3 px-4 rounded-lg bg-[var(--nebula-purple)] text-white hover:opacity-90 flex items-center justify-center gap-2 transition-all font-medium"
        >
          <Plus size={20} weight="bold" />
          Create Custom Reward
        </button>
        <button
          onClick={() => { setShowTemplates(!showTemplates); setShowCustomForm(false); }}
          className="flex-1 py-3 px-4 rounded-lg border-2 border-dashed border-[var(--nebula-purple)]/40 text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/10 flex items-center justify-center gap-2 transition-all"
        >
          <Star size={20} weight="bold" />
          Browse Ideas
        </button>
      </div>

      {/* Custom Item Form */}
      {showCustomForm && (
        <div className="bg-[var(--background-secondary)] rounded-xl p-4 space-y-4 border border-[var(--border)] animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-heading">Create New Reward</h4>
            <button onClick={() => setShowCustomForm(false)}><X size={20} /></button>
          </div>
          
          <form onSubmit={handleCreateCustom} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="w-full">
                  <label className="block text-sm text-muted mb-1">Title</label>
                  <input
                    required
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)]"
                    placeholder="e.g. Extra Tech Time"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm text-muted mb-1">Cost (Moons)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newItem.moonCost}
                    onChange={e => setNewItem({...newItem, moonCost: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewItem({...newItem, isUnlimited: !newItem.isUnlimited})}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                      newItem.isUnlimited 
                        ? 'border-[var(--nebula-purple)] bg-[var(--nebula-purple)]/10 text-[var(--nebula-purple)]'
                        : 'border-[var(--border)] text-muted'
                    }`}
                  >
                    <InfinityIcon size={18} weight={newItem.isUnlimited ? "fill" : "regular"} />
                    {newItem.isUnlimited ? 'Unlimited Purchases' : 'One-time Purchase'}
                  </button>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                 <label className="block text-sm text-muted mb-2">Select Icon</label>
                 <div className="grid grid-cols-5 gap-2 h-40 overflow-y-auto p-2 border border-[var(--border)] rounded-lg bg-[var(--background-elevated)]">
                    {ICON_PICKER_OPTIONS.map(iconName => {
                      const IconCmp = (PhosphorIcons as any)[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewItem({...newItem, icon: iconName})}
                          className={`p-2 rounded flex items-center justify-center hover:bg-[var(--background-secondary)] ${
                            newItem.icon === iconName ? 'bg-[var(--nebula-purple)] text-white hover:bg-[var(--nebula-purple)]' : 'text-muted'
                          }`}
                          title={iconName}
                        >
                          <IconCmp size={24} />
                        </button>
                      );
                    })}
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newItem.saveAsTemplate}
                  onChange={e => setNewItem({...newItem, saveAsTemplate: e.target.checked})}
                  className="rounded border-[var(--border)] text-[var(--nebula-purple)] focus:ring-[var(--nebula-purple)]"
                />
                Save as template
              </label>
              
              <button
                type="submit"
                className="px-6 py-2 bg-[var(--nebula-purple)] text-white rounded-lg font-medium hover:opacity-90"
              >
                Create Reward
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Template Picker */}
      {showTemplates && (
        <div className="bg-[var(--background-secondary)]/50 rounded-xl p-4 space-y-4 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-[var(--nebula-purple)]">
              Choose a Reward Template
            </h4>
            <button onClick={() => setShowTemplates(false)}><X size={20} /></button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
             <button
                onClick={() => setSelectedCategory('custom')}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === 'custom'
                    ? 'bg-[var(--nebula-purple)] text-white'
                    : 'bg-[var(--background-elevated)] text-muted hover:bg-[var(--background)]'
                }`}
              >
                ⭐ My Templates
              </button>
            {(Object.keys(REWARD_CATEGORIES) as (keyof typeof REWARD_CATEGORIES)[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[var(--nebula-purple)] text-white'
                    : 'bg-[var(--background-elevated)] text-muted hover:bg-[var(--background)]'
                }`}
              >
                {REWARD_CATEGORIES[cat].emoji} {REWARD_CATEGORIES[cat].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {selectedCategory === 'custom' ? (
               customTemplates.length === 0 ? (
                 <p className="col-span-2 text-center text-sm text-muted py-4">
                   No custom templates yet. Create a reward and check "Save as template"!
                 </p>
               ) : (
                 customTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => addFromTemplate(template)}
                    className="p-3 text-left rounded-lg bg-[var(--background-elevated)] hover:ring-2 hover:ring-purple-400 transition-all flex items-start gap-3"
                  >
                    {renderIcon(template.icon, template.emoji || '🎁', 32)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-heading text-sm truncate">{template.name}</p>
                      <p className="text-xs text-muted">~{template.suggestedCost} moons</p>
                    </div>
                  </button>
                 ))
               )
            ) : (
              REWARD_TEMPLATES.filter(t => t.category === selectedCategory).map(template => (
                <button
                  key={template.id}
                  onClick={() => addFromTemplate(template)}
                  className="p-3 text-left rounded-lg bg-[var(--background-elevated)] hover:ring-2 hover:ring-purple-400 transition-all flex items-start gap-3"
                >
                  <span className="text-2xl">{template.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-heading text-sm truncate">{template.name}</p>
                    <p className="text-xs text-muted">~{template.suggestedCost} moons</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Current Rewards List */}
      <div>
        <h4 className="text-sm font-medium text-heading dark:text-muted mb-3">
          {selectedKidName}'s Shop Rewards ({rewards.length})
        </h4>

        {isLoading ? (
          <div className="text-center py-4">
            <ArrowsClockwise size={20} className="animate-spin mx-auto text-muted" />
          </div>
        ) : rewards.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No rewards yet. Create one or add from templates!
          </p>
        ) : (
          <div className="space-y-2">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg group"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-[var(--background-elevated)] rounded-full">
                  {renderIcon(reward.icon, reward.emoji, 24)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-heading truncate">
                      {reward.name}
                    </p>
                    {/* Unlimited Badge */}
                     <button
                        onClick={() => toggleUnlimited(reward)}
                        title={reward.is_unlimited ? "Unlimited items available" : "One-time purchase only"}
                        className={`text-xs px-1.5 py-0.5 rounded border ${
                          reward.is_unlimited 
                           ? 'border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20' 
                           : 'border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                        }`}
                     >
                       {reward.is_unlimited ? '∞' : '1x'}
                     </button>
                  </div>
                  {reward.description && <p className="text-xs text-muted truncate">{reward.description}</p>}
                </div>

                {/* Edit Cost */}
                {editingId === reward.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded border text-center text-sm"
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
                      className="p-1 text-muted hover:bg-[var(--background-secondary)] rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-bold text-yellow-600 flex items-center gap-1">
                      🌙 {reward.moon_cost}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(reward.id);
                        setEditCost(reward.moon_cost);
                      }}
                      className="p-1 text-muted hover:text-[var(--nebula-purple)] hover:bg-[var(--nebula-purple)]/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit cost"
                    >
                      <Pencil size={16} />
                    </button>
                  </>
                )}

                <button
                  onClick={() => deleteReward(reward.id)}
                  className="p-1 text-muted hover:text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
