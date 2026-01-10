'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Gear, Users, Butterfly } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { KidManager } from '@/components/profile/KidManager';
import { FamilyManager } from '@/components/profile/FamilyManager';
import { Kid } from '@/types';

interface SettingsTabsProps {
  user: User;
  kids: Kid[];
}

export function SettingsTabs({ user, kids }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<'kids' | 'general'>('kids');

  const tabs = [
    { id: 'kids', label: 'Family & Learners', icon: Users },
    { id: 'general', label: 'My Account', icon: Gear },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto sm:w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
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

        {/* Kids & Family Tab */}
        {activeTab === 'kids' && (
          <div className="space-y-6">
            
            {/* Kid Grid (Unified Management) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
               <KidManager kids={kids} />
            </div>

            {/* Family Members Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="mb-4">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Butterfly size={20} weight="duotone" className="text-blue-500" />
                    Family & Guardians
                 </h3>
                 <p className="text-sm text-gray-500">Manage adults who can access this account.</p>
              </div>
              <FamilyManager />
            </div>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <AccountSettings user={user} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
