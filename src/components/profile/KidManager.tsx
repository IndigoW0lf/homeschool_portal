'use client';

import { useState } from 'react';
import { Pencil, Trash, Plus, Check, X, User, GraduationCap, Lock } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Kid {
  id: string;
  name: string;
  gradeBand?: string;
}

interface KidManagerProps {
  kids: Kid[];
}

const GRADE_BANDS = [
  { value: 'K-2', label: 'K-2 (Ages 5-8)' },
  { value: '3-5', label: '3-5 (Ages 8-11)' },
  { value: '6-8', label: '6-8 (Ages 11-14)' },
  { value: '9-12', label: '9-12 (Ages 14-18)' },
];

// Simple hash function for PINs (matches server-side)
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

export function KidManager({ kids: initialKids }: KidManagerProps) {
  const router = useRouter();
  const [kids, setKids] = useState<Kid[]>(initialKids);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('3-5');
  
  // Add new kid state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidGrade, setNewKidGrade] = useState('3-5');
  const [newKidPin, setNewKidPin] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEdit = (kid: Kid) => {
    setEditingId(kid.id);
    setEditName(kid.name);
    setEditGrade(kid.gradeBand || '3-5');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditGrade('3-5');
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      const { error } = await supabase
        .from('kids')
        .update({ 
          name: editName.trim(),
          grade_band: editGrade 
        })
        .eq('id', editingId);

      if (error) throw error;

      setKids(kids.map(k => 
        k.id === editingId 
          ? { ...k, name: editName.trim(), gradeBand: editGrade }
          : k
      ));
      
      toast.success('Kid updated!');
      cancelEdit();
      router.refresh();
    } catch (err) {
      console.error('Failed to update kid:', err);
      toast.error('Failed to update. Please try again.');
    }
  };

  const addKid = async () => {
    if (!newKidName.trim() || newKidPin.length !== 4) {
      toast.error('Please enter a name and 4-digit PIN');
      return;
    }

    setIsAdding(true);
    try {
      // Get current user for RLS
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
          pin_hash: pinHash,
          user_id: user.id, // Required for RLS!
        });

      if (error) throw error;

      setKids([...kids, { 
        id: kidId, 
        name: newKidName.trim(), 
        gradeBand: newKidGrade 
      }]);
      
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

  const deleteKid = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('kids')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const deletedKid = kids.find(k => k.id === id);
      setKids(kids.filter(k => k.id !== id));
      toast.success(`${deletedKid?.name} removed`);
      setDeletingId(null);
      router.refresh();
    } catch (err) {
      console.error('Failed to delete kid:', err);
      toast.error('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <User size={20} weight="duotone" className="text-[var(--ember-500)]" />
          Manage Kids
        </h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm font-medium text-[var(--ember-500)] hover:text-[var(--ember-600)] flex items-center gap-1"
          >
            <Plus size={16} weight="bold" />
            Add Kid
          </button>
        )}
      </div>

      {/* Add New Kid Form */}
      {showAddForm && (
        <div className="p-4 rounded-lg bg-[var(--ember-50)] dark:bg-[var(--ember-900)]/20 border border-[var(--ember-200)] dark:border-[var(--ember-800)] space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add a new kid</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                placeholder="Child's name"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Grade Level</label>
              <select
                value={newKidGrade}
                onChange={(e) => setNewKidGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[var(--ember-500)]"
              >
                {GRADE_BANDS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Lock size={12} /> 4-Digit PIN (for kid portal access)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={newKidPin}
              onChange={(e) => setNewKidPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-24 px-3 py-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[var(--ember-500)] tracking-widest"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setShowAddForm(false); setNewKidName(''); setNewKidPin(''); }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={addKid}
              disabled={isAdding || !newKidName.trim() || newKidPin.length !== 4}
              className="px-4 py-1.5 text-sm bg-[var(--ember-500)] text-white rounded-lg font-medium hover:bg-[var(--ember-600)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add Kid'}
            </button>
          </div>
        </div>
      )}

      {/* Kids List */}
      {kids.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <User size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No kids added yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 text-sm text-[var(--ember-500)] hover:underline"
          >
            Add your first child
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {kids.map((kid) => (
            <div 
              key={kid.id}
              className={cn(
                "p-3 rounded-lg border transition-all",
                editingId === kid.id 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : deletingId === kid.id
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
              )}
            >
              {editingId === kid.id ? (
                /* Edit Mode */
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      autoFocus
                    />
                    <select
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      {GRADE_BANDS.map(g => (
                        <option key={g.value} value={g.value}>{g.value}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center gap-1"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      className="px-2 py-1 text-xs text-white bg-green-500 hover:bg-green-600 rounded flex items-center gap-1"
                    >
                      <Check size={14} /> Save
                    </button>
                  </div>
                </div>
              ) : deletingId === kid.id ? (
                /* Delete Confirmation */
                <div className="space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Delete <strong>{kid.name}</strong>? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteKid(kid.id)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--ember-100)] dark:bg-[var(--ember-900)]/30 flex items-center justify-center text-[var(--ember-600)] dark:text-[var(--ember-400)] font-medium text-lg">
                      {kid.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{kid.name}</p>
                      {kid.gradeBand && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <GraduationCap size={12} /> Grade {kid.gradeBand}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(kid)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingId(kid.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
