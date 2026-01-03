'use client';

import { useState, useEffect } from 'react';
import { NotePencil, Check, ArrowsClockwise } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/browser';
import { toast } from 'sonner';

interface JournalSettingsProps {
  kids: Array<{ id: string; name: string }>;
}

const PROMPT_TYPES = [
  { id: 'gratitude', label: '🙏 Gratitude', description: 'What are you thankful for?' },
  { id: 'reflection', label: '💭 Reflection', description: 'What did you learn today?' },
  { id: 'creativity', label: '✨ Creativity', description: 'Imagine and create!' },
  { id: 'goals', label: '🎯 Goals', description: 'What do you want to achieve?' },
  { id: 'feelings', label: '❤️ Feelings', description: 'How are you feeling?' },
  { id: 'memory', label: '📸 Memory', description: 'Describe a favorite memory' },
];

interface KidJournalSettings {
  journalEnabled: boolean;
  journalAllowSkip: boolean;
  journalPromptTypes: string[];
}

export function JournalSettings({ kids }: JournalSettingsProps) {
  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || '');
  const [settings, setSettings] = useState<KidJournalSettings>({
    journalEnabled: true,
    journalAllowSkip: true,
    journalPromptTypes: ['gratitude', 'reflection', 'creativity'],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedKid) fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKid]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('kids')
        .select('journal_enabled, journal_allow_skip, journal_prompt_types')
        .eq('id', selectedKid)
        .single();

      if (data) {
        setSettings({
          journalEnabled: data.journal_enabled ?? true,
          journalAllowSkip: data.journal_allow_skip ?? true,
          journalPromptTypes: data.journal_prompt_types || ['gratitude', 'reflection', 'creativity'],
        });
      }
    } catch (error) {
      console.error('Failed to fetch journal settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('kids')
        .update({
          journal_enabled: settings.journalEnabled,
          journal_allow_skip: settings.journalAllowSkip,
          journal_prompt_types: settings.journalPromptTypes,
        })
        .eq('id', selectedKid);

      if (error) throw error;
      toast.success('Journal settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePromptType = (typeId: string) => {
    setSettings(prev => ({
      ...prev,
      journalPromptTypes: prev.journalPromptTypes.includes(typeId)
        ? prev.journalPromptTypes.filter(t => t !== typeId)
        : [...prev.journalPromptTypes, typeId],
    }));
  };

  const selectedKidName = kids.find(k => k.id === selectedKid)?.name || 'Kid';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <NotePencil size={24} weight="fill" className="text-pink-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Journal Settings
        </h3>
      </div>

      {/* Kid Selector */}
      {kids.length > 1 && (
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

      {isLoading ? (
        <div className="text-center py-4">
          <ArrowsClockwise size={20} className="animate-spin mx-auto text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Enable Daily Journal</p>
              <p className="text-sm text-gray-500">Show journal prompt on {selectedKidName}'s home</p>
            </div>
            <input
              type="checkbox"
              checked={settings.journalEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, journalEnabled: e.target.checked }))}
              className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
            />
          </label>

          {/* Allow Skip Toggle */}
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Allow Skip</p>
              <p className="text-sm text-gray-500">Let {selectedKidName} skip the daily prompt</p>
            </div>
            <input
              type="checkbox"
              checked={settings.journalAllowSkip}
              onChange={(e) => setSettings(prev => ({ ...prev, journalAllowSkip: e.target.checked }))}
              className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
            />
          </label>

          {/* Prompt Types */}
          <div>
            <p className="font-medium text-gray-800 dark:text-white mb-2">Prompt Types</p>
            <p className="text-sm text-gray-500 mb-3">Select which types of prompts {selectedKidName} sees</p>
            <div className="grid grid-cols-2 gap-2">
              {PROMPT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => togglePromptType(type.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    settings.journalPromptTypes.includes(type.id)
                      ? 'bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-500'
                      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full py-2 px-4 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <ArrowsClockwise size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            Save Journal Settings
          </button>
        </div>
      )}
    </div>
  );
}
