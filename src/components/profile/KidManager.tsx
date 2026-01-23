'use client';

import { useState } from 'react';
import { User, Plus, GraduationCap, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { KidSettingsModal } from './KidSettingsModal';
import { Kid } from '@/types';

interface KidManagerProps {
  kids: Kid[];
}

const GRADE_BANDS = [
  { value: 'K-2', label: 'K-2 (Ages 5-8)' },
  { value: '3-5', label: '3-5 (Ages 8-11)' },
  { value: '6-8', label: '6-8 (Ages 11-14)' },
  { value: '9-12', label: '9-12 (Ages 14-18)' },
];

function simpleHash(pin: string): string {
  let hash = 0;
  const salt = 'lunara_pin_salt_2024';
  const salted = salt + pin + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function KidManager({ kids }: KidManagerProps) {
  const router = useRouter();
  
  // Modal State
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);

  // Add Kid State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidGrade, setNewKidGrade] = useState('3-5');
  const [newKidPin, setNewKidPin] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addKid = async () => {
    if (!newKidName.trim() || newKidPin.length !== 4) {
      toast.error('Please enter a name and 4-digit PIN');
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Please sign in to add a kid');
        return;
      }

      const pinHash = simpleHash(newKidPin);
      const kidId = crypto.randomUUID();

      const { error } = await supabase
        .from('kids')
        .insert({
          id: kidId,
          name: newKidName.trim(),
          grade_band: newKidGrade,
          grades: [newKidGrade],
          pin_hash: pinHash,
          user_id: user.id,
        });

      if (error) throw error;
      
      toast.success(`${newKidName} added! 🌟`);
      setShowAddForm(false);
      setNewKidName('');
      setNewKidGrade('3-5');
      setNewKidPin('');
      router.refresh();
    } catch (err) {
      console.error('Failed to add kid:', err);
      toast.error('Failed to add kid. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="heading-sm flex items-center gap-2">
          <User size={20} weight="duotone" className="text-[var(--cosmic-rust-500)]" />
          Manage Kids
        </h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm"
          >
            <Plus size={16} weight="bold" />
            Add Kid
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-6 rounded-2xl bg-gradient-candle-teal border border-[var(--celestial-400)]/30 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-[var(--night-900)]">Add a new learner</h4>
            <button onClick={() => setShowAddForm(false)} className="text-[var(--night-700)] hover:text-[var(--night-900)]"><X size={20}/></button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--night-700)] uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                placeholder="Child's Name"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] focus:ring-2 focus:ring-[var(--cosmic-rust-500)] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--night-700)] uppercase tracking-wider mb-1.5">Grade Level</label>
              <select
                value={newKidGrade}
                onChange={(e) => setNewKidGrade(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] focus:ring-2 focus:ring-[var(--cosmic-rust-500)] outline-none"
              >
                {GRADE_BANDS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-[var(--night-700)] uppercase tracking-wider mb-1.5">4-Digit PIN</label>
             <input
               type="text"
               inputMode="numeric"
               maxLength={4}
               value={newKidPin}
               onChange={(e) => setNewKidPin(e.target.value.replace(/\D/g, ''))}
               placeholder="1234"
               className="w-32 px-4 py-2.5 text-center font-mono text-lg rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] focus:ring-2 focus:ring-[var(--cosmic-rust-500)] outline-none"
             />
             <p className="text-xs text-[var(--night-600)] mt-1">Used to log in to their portal.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-muted hover:bg-[var(--hover-overlay)] rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addKid}
              disabled={isAdding || !newKidName.trim() || newKidPin.length !== 4}
              className="btn-primary disabled:opacity-50"
            >
              {isAdding ? 'Adding...' : 'Create Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Kids Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kids.map(kid => (
          <button
            key={kid.id}
            onClick={() => setSelectedKid(kid)}
            className="group relative flex items-center gap-4 p-4 rounded-2xl card hover:shadow-md hover:border-[var(--cosmic-rust-400)] transition-all text-left"
          >
            {/* Avatar / Initials */}
            {kid.avatarUrl ? (
               <img src={kid.avatarUrl} alt={kid.name} className="w-14 h-14 rounded-full bg-[var(--background-secondary)] object-cover group-hover:scale-105 transition-transform" />
            ) : (
               <div className="w-14 h-14 rounded-full bg-[var(--cosmic-rust-100)] flex items-center justify-center text-[var(--cosmic-rust-600)] font-bold text-xl group-hover:scale-105 transition-transform">
                 {kid.name[0]}
               </div>
            )}

            <div>
              <h4 className="text-lg font-bold text-heading group-hover:text-[var(--cosmic-rust-600)] transition-colors">
                {kid.name}
              </h4>
              <div className="flex items-center gap-3 text-sm text-muted">
                {kid.grades && kid.grades.length > 0 ? (
                   <span className="flex items-center gap-1"><GraduationCap size={14} /> Grades {kid.grades.join(', ')}</span>
                ) : kid.gradeBand ? (
                   <span className="flex items-center gap-1"><GraduationCap size={14} /> Grade {kid.gradeBand}</span>
                ) : (
                   <span>No grade set</span>
                )}
              </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted">
               Settings →
            </div>
          </button>
        ))}

        {/* Add Card placeholder */}
        {kids.length === 0 && !showAddForm && (
           <button 
             onClick={() => setShowAddForm(true)}
             className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] text-muted hover:border-[var(--cosmic-rust-400)] hover:text-[var(--cosmic-rust-500)] hover:bg-[var(--cosmic-rust-100)]/50 transition-all"
           >
             <Plus size={32} />
             <span className="font-medium">Add a child</span>
           </button>
        )}
      </div>

      {/* Modal */}
      {selectedKid && (
        <KidSettingsModal 
          kid={selectedKid} 
          onClose={() => setSelectedKid(null)} 
        />
      )}
    </div>
  );
}
