'use client';

import { useState } from 'react';
import { X, User, Lock, BookOpen, Star } from '@phosphor-icons/react';
import { Kid } from '@/types';
import { KidProfileEditor } from '@/components/kids/KidProfileEditor';
import { KidPinManager } from '@/components/profile/KidPinManager';
import { JournalSettings } from '@/components/profile/JournalSettings';
import { MoonManager } from '@/components/profile/MoonManager';
import { RewardManager } from '@/components/profile/RewardManager';
import { cn } from '@/lib/utils';

interface KidSettingsModalProps {
  kid: Kid;
  onClose: () => void;
  // We might need to refresh parent data on save
}

type Tab = 'profile' | 'access' | 'journal' | 'rewards';

export function KidSettingsModal({ kid, onClose }: KidSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'access' as const, label: 'Access & PIN', icon: Lock },
    { id: 'journal' as const, label: 'Journal', icon: BookOpen },
    { id: 'rewards' as const, label: 'Rewards & Shop', icon: Star },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            {kid.avatarUrl ? (
               <img src={kid.avatarUrl} alt={kid.name} className="w-10 h-10 rounded-full bg-gray-100" />
            ) : (
               <div className="w-10 h-10 rounded-full bg-[var(--ember-100)] dark:bg-[var(--ember-900)] flex items-center justify-center text-[var(--ember-600)] font-bold text-lg">
                 {kid.name[0]}
               </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {kid.name}
              </h2>
              <p className="text-sm text-gray-500">Settings & Preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-2 overflow-y-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-800 text-[var(--ember-600)] shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <tab.icon size={20} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-4">
                  <User size={24} weight="fill" className="text-[var(--ember-500)]" />
                  <h3 className="text-lg font-semibold">Edit Profile</h3>
                </div>
                {/* Note: KidProfileEditor handles its own saving. 
                    We assume kid object has enough data, or Editor handles fetching? 
                    Actually Editor requires initialData. We pass 'kid'. */}
                <KidProfileEditor kidId={kid.id} initialData={kid} />
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-6 max-w-lg">
                <KidPinManager kids={[kid]} kidId={kid.id} />
              </div>
            )}

            {activeTab === 'journal' && (
              <div className="space-y-6 max-w-lg">
                <JournalSettings kids={[kid]} kidId={kid.id} />
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-8">
                 <section className="space-y-4">
                    <MoonManager kids={[kid]} kidId={kid.id} />
                 </section>
                 
                 <hr className="border-gray-100 dark:border-gray-800" />
                 
                 <section className="space-y-4">
                    <RewardManager kids={[kid]} kidId={kid.id} />
                 </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
