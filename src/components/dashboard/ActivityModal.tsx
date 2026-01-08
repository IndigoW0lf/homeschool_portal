'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CaretDown, Sparkle, Clock, Users, CalendarBlank, Link as LinkIcon, Paperclip, Books, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LunaTriggerButton } from '@/components/luna';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: { id: string; name: string }[];
}

// Life skills + academic categories
const CATEGORIES = [
  { value: 'Math', group: 'Academic', emoji: '🔢' },
  { value: 'Science', group: 'Academic', emoji: '🔬' },
  { value: 'History', group: 'Academic', emoji: '📜' },
  { value: 'Language Arts', group: 'Academic', emoji: '📚' },
  { value: 'Art', group: 'Academic', emoji: '🎨' },
  { value: 'Music', group: 'Academic', emoji: '🎵' },
  { value: 'PE', group: 'Academic', emoji: '🏃' },
  { value: 'Coding', group: 'Academic', emoji: '💻' },
  { value: 'Self & Mind', group: 'Life Skills', emoji: '🧠' },
  { value: 'Thinking & Truth', group: 'Life Skills', emoji: '💡' },
  { value: 'Agency & Responsibility', group: 'Life Skills', emoji: '⚡' },
  { value: 'Relationships & Community', group: 'Life Skills', emoji: '🤝' },
  { value: 'Body & Nervous System', group: 'Life Skills', emoji: '❤️' },
  { value: 'Systems & Society', group: 'Life Skills', emoji: '🌍' },
];

const TIME_OPTIONS = [
  { value: 10, label: '10 min', short: '10m' },
  { value: 15, label: '15 min', short: '15m' },
  { value: 20, label: '20 min', short: '20m' },
  { value: 30, label: '30 min', short: '30m' },
  { value: 45, label: '45 min', short: '45m' },
  { value: 60, label: '1 hour', short: '1h' },
  { value: 90, label: '1.5 hours', short: '1.5h' },
];

interface LinkItem {
  label: string;
  url: string;
}

interface FormData {
  title: string;
  activityType: 'lesson' | 'assignment';
  category: string;
  description: string;
  estimatedMinutes: number;
  steps: string[];
  links: LinkItem[];
  assignTo: string[];
  scheduleDate: string;
  generateWorksheet: boolean;
}

export function ActivityModal({ isOpen, onClose, kids }: ActivityModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<FormData>({
    title: '',
    activityType: 'lesson',
    category: 'Math',
    description: '',
    estimatedMinutes: 30,
    steps: [],
    links: [],
    assignTo: kids.map(k => k.id),
    scheduleDate: new Date().toISOString().split('T')[0],
    generateWorksheet: false,
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  // Steps helpers
  const addStep = () => updateForm({ steps: [...form.steps, ''] });
  const updateStep = (idx: number, value: string) => {
    const newSteps = [...form.steps];
    newSteps[idx] = value;
    updateForm({ steps: newSteps });
  };
  const removeStep = (idx: number) => {
    updateForm({ steps: form.steps.filter((_, i) => i !== idx) });
  };

  // Links helpers
  const addLink = () => updateForm({ links: [...form.links, { label: '', url: '' }] });
  const updateLink = (idx: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...form.links];
    newLinks[idx][field] = value;
    updateForm({ links: newLinks });
  };
  const removeLink = (idx: number) => {
    updateForm({ links: form.links.filter((_, i) => i !== idx) });
  };

  const toggleKid = (kidId: string) => {
    if (form.assignTo.includes(kidId)) {
      updateForm({ assignTo: form.assignTo.filter(id => id !== kidId) });
    } else {
      updateForm({ assignTo: [...form.assignTo, kidId] });
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = form.activityType === 'lesson' ? '/api/lessons' : '/api/assignments';
      
      const payload = {
        title: form.title,
        type: form.category,
        description: form.description,
        instructions: form.description,
        estimated_minutes: form.estimatedMinutes,
        steps: form.steps.filter(s => s.trim()),
        links: form.links.filter(l => l.label && l.url),
        assignTo: form.assignTo,
        scheduleDate: form.scheduleDate,
        generateWorksheet: form.generateWorksheet,
      };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`${form.activityType === 'lesson' ? 'Lesson' : 'Assignment'} created!`);
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === form.category);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header with Luna */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Activity</h2>
          <LunaTriggerButton context="GENERAL" label="Ask Luna" iconOnly />
        </div>

        {/* Type Toggle - Prominent */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateForm({ activityType: 'lesson' })}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              form.activityType === 'lesson'
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            )}
          >
            <Books size={28} weight="duotone" className={form.activityType === 'lesson' ? "text-blue-500" : "text-gray-400"} />
            <span className={cn("font-semibold", form.activityType === 'lesson' ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400")}>
              Lesson
            </span>
            <span className="text-xs text-gray-500">Teaching content</span>
          </button>
          <button
            type="button"
            onClick={() => updateForm({ activityType: 'assignment' })}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              form.activityType === 'assignment'
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            )}
          >
            <PencilSimple size={28} weight="duotone" className={form.activityType === 'assignment' ? "text-purple-500" : "text-gray-400"} />
            <span className={cn("font-semibold", form.activityType === 'assignment' ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400")}>
              Assignment
            </span>
            <span className="text-xs text-gray-500">Practice work</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <input
            type="text"
            value={form.title}
            onChange={e => updateForm({ title: e.target.value })}
            placeholder="What are we learning today?"
            className="w-full text-lg font-medium bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:border-[var(--ember-500)] focus:ring-0 py-2 px-0 placeholder:text-gray-400"
            autoFocus
          />
        </div>

        {/* Category + Time Row */}
        <div className="flex gap-3">
          {/* Category Dropdown */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={e => updateForm({ category: e.target.value })}
                className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 pl-10 pr-8 text-sm font-medium focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent"
              >
                <optgroup label="📚 Academic">
                  {CATEGORIES.filter(c => c.group === 'Academic').map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                  ))}
                </optgroup>
                <optgroup label="🧠 Life Skills">
                  {CATEGORIES.filter(c => c.group === 'Life Skills').map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                  ))}
                </optgroup>
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                {selectedCategory?.emoji}
              </span>
              <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          {/* Time Pills */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
              <Clock size={12} /> Duration
            </label>
            <div className="flex flex-wrap gap-1">
              {[15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => updateForm({ estimatedMinutes: mins })}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded-md transition-all",
                    form.estimatedMinutes === mins
                      ? "bg-[var(--ember-500)] text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Instructions</label>
          <textarea
            value={form.description}
            onChange={e => updateForm({ description: e.target.value })}
            placeholder="Describe what the student should do..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-[var(--ember-500)] focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Steps (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500">Steps (optional)</label>
            <button type="button" onClick={addStep} className="text-xs text-[var(--ember-500)] hover:underline flex items-center gap-1">
              <Plus size={12} /> Add Step
            </button>
          </div>
          {form.steps.length > 0 && (
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              {form.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[var(--ember-500)] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                    placeholder={`Step ${idx + 1}...`}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 px-2 text-sm"
                  />
                  <button type="button" onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-500">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <LinkIcon size={12} /> Links (optional)
            </label>
            <button type="button" onClick={addLink} className="text-xs text-[var(--ember-500)] hover:underline flex items-center gap-1">
              <Plus size={12} /> Add Link
            </button>
          </div>
          {form.links.length > 0 && (
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              {form.links.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(idx, 'label', e.target.value)}
                    placeholder="Label"
                    className="w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 px-2 text-sm"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={e => updateLink(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1.5 px-2 text-sm"
                  />
                  <button type="button" onClick={() => removeLink(idx)} className="text-gray-400 hover:text-red-500">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Section - Card Style */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <CalendarBlank size={16} className="text-[var(--ember-500)]" />
            Schedule
          </h4>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Kids */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                <Users size={12} className="inline mr-1" /> Assign to
              </label>
              <div className="flex gap-2">
                {kids.map(kid => (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => toggleKid(kid.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      form.assignTo.includes(kid.id)
                        ? "bg-[var(--ember-500)] text-white shadow-sm"
                        : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                    )}
                  >
                    {kid.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Date</label>
              <input
                type="date"
                value={form.scheduleDate}
                onChange={e => updateForm({ scheduleDate: e.target.value })}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1.5 px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* AI Worksheet Toggle */}
        <label className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl cursor-pointer border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
          <input
            type="checkbox"
            checked={form.generateWorksheet}
            onChange={e => updateForm({ generateWorksheet: e.target.checked })}
            className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex-1">
            <span className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Sparkle size={18} weight="fill" className="text-purple-500" />
              Auto-generate worksheet
            </span>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5">
              AI will create practice questions based on this activity
            </p>
          </div>
        </label>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.title.trim()}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
              form.activityType === 'lesson'
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white",
              (isSubmitting || !form.title.trim()) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? 'Creating...' : `Create ${form.activityType === 'lesson' ? 'Lesson' : 'Assignment'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
