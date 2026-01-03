'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Gear, Users, Trophy } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { KidPinManager } from '@/components/profile/KidPinManager';
import { KidManager } from '@/components/profile/KidManager';
import { MoonManager } from '@/components/profile/MoonManager';
import { RewardManager } from '@/components/profile/RewardManager';
import { RedemptionManager } from '@/components/profile/RedemptionManager';
import { JournalSettings } from '@/components/profile/JournalSettings';

interface SettingsTabsProps {
  user: User;
  kids: any[]; // Using any to avoid complex type imports for now, matching the page usage
}

export function SettingsTabs({ user, kids }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'kids' | 'rewards'>('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Gear },
    { id: 'kids', label: 'Kids & Access', icon: Users },
    { id: 'rewards', label: 'Rewards', icon: Trophy },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                isActive 
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <AccountSettings user={user} />
            </div>
          </div>
        )}

        {/* Kids & Access Tab */}
        {activeTab === 'kids' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <KidManager kids={kids.map(k => ({ id: k.id, name: k.name, gradeBand: k.gradeBand }))} />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <KidPinManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <JournalSettings kids={kids.map(k => ({ id: k.id, name: k.name }))} />
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <MoonManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <RedemptionManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <RewardManager kids={kids.map(k => ({ id: k.id, name: k.name }))} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
