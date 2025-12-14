'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Plus, PencilSimple, Trash, X, Check,
  // Holiday Icons
  Sun, Snowflake, Tree, Gift, Heart, Star, Sparkle, Confetti,
  Umbrella, Flower, Moon, Campfire, Airplane, House, Balloon,
  Cake, Coffee, BookOpen, MusicNote, GameController, Bed, Alarm
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Curated list of holiday/break-appropriate icons
const HOLIDAY_ICONS = [
  { id: 'sun', label: 'Summer/Sunny', Icon: Sun, color: '#e7b58d' },
  { id: 'snowflake', label: 'Winter', Icon: Snowflake, color: '#b6e1d8' },
  { id: 'tree', label: 'Christmas', Icon: Tree, color: '#b6e1d8' },
  { id: 'gift', label: 'Gifts/Birthday', Icon: Gift, color: '#ffcdf6' },
  { id: 'heart', label: 'Valentine\'s', Icon: Heart, color: '#ffcdf6' },
  { id: 'star', label: 'Special Day', Icon: Star, color: '#e7b58d' },
  { id: 'sparkle', label: 'Celebration', Icon: Sparkle, color: '#caa2d8' },
  { id: 'confetti', label: 'Party', Icon: Confetti, color: '#ffcdf6' },
  { id: 'umbrella', label: 'Rainy Day', Icon: Umbrella, color: '#b6e1d8' },
  { id: 'flower', label: 'Spring', Icon: Flower, color: '#ffcdf6' },
  { id: 'moon', label: 'Night/Rest', Icon: Moon, color: '#caa2d8' },
  { id: 'campfire', label: 'Camping', Icon: Campfire, color: '#e7b58d' },
  { id: 'airplane', label: 'Travel', Icon: Airplane, color: '#b6e1d8' },
  { id: 'house', label: 'Home Day', Icon: House, color: '#e7b58d' },
  { id: 'balloon', label: 'Birthday', Icon: Balloon, color: '#ffcdf6' },
  { id: 'cake', label: 'Birthday Cake', Icon: Cake, color: '#ffcdf6' },
  { id: 'coffee', label: 'Break', Icon: Coffee, color: '#e7b58d' },
  { id: 'book', label: 'Reading Day', Icon: BookOpen, color: '#b6e1d8' },
  { id: 'music', label: 'Music Day', Icon: MusicNote, color: '#caa2d8' },
  { id: 'game', label: 'Game Day', Icon: GameController, color: '#caa2d8' },
  { id: 'bed', label: 'Sleep In', Icon: Bed, color: '#b6e1d8' },
  { id: 'alarm', label: 'Early Out', Icon: Alarm, color: '#e7b58d' },
];

interface Holiday {
  id: string;
  name: string;
  emoji: string; // Now stores icon ID instead of emoji
  startDate: string;
  endDate: string | null;
}

interface HolidayManagerProps {
  initialHolidays: Holiday[];
}

export function HolidayManager({ initialHolidays }: HolidayManagerProps) {
  const router = useRouter();
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Form state
  const formDefaults = {
    name: '',
    emoji: 'star', // Default to star icon
    startDate: '',
    endDate: '',
  };
  const [formData, setFormData] = useState(formDefaults);

  const resetForm = () => {
    setFormData(formDefaults);
    setIsAdding(false);
    setEditingId(null);
    setShowIconPicker(false);
  };

  // Helper to render the icon from ID
  const renderIcon = (iconId: string, size = 24) => {
    const iconData = HOLIDAY_ICONS.find(i => i.id === iconId);
    if (iconData) {
      const IconComponent = iconData.Icon;
      return <IconComponent size={size} weight="duotone" color={iconData.color} />;
    }
    // Fallback for legacy emoji entries
    return <span className="text-lg">{iconId}</span>;
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.startDate) {
      toast.error('Please enter a name and start date');
      return;
    }

    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          emoji: formData.emoji,
          start_date: formData.startDate,
          end_date: formData.endDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create holiday');
      
      const newHoliday = await res.json();
      setHolidays([...holidays, {
        id: newHoliday.id,
        name: newHoliday.name,
        emoji: newHoliday.emoji,
        startDate: newHoliday.start_date,
        endDate: newHoliday.end_date,
      }]);
      
      toast.success('Holiday added!');
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to add holiday');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name || !formData.startDate) {
      toast.error('Please enter a name and start date');
      return;
    }

    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          emoji: formData.emoji,
          start_date: formData.startDate,
          end_date: formData.endDate || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update holiday');
      
      setHolidays(holidays.map(h => 
        h.id === id 
          ? { ...h, name: formData.name, emoji: formData.emoji, startDate: formData.startDate, endDate: formData.endDate || null }
          : h
      ));
      
      toast.success('Holiday updated!');
      resetForm();
      router.refresh();
    } catch {
      toast.error('Failed to update holiday');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this holiday?')) return;

    try {
      const res = await fetch(`/api/holidays/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete holiday');
      
      setHolidays(holidays.filter(h => h.id !== id));
      toast.success('Holiday deleted');
      router.refresh();
    } catch {
      toast.error('Failed to delete holiday');
    }
  };

  const startEdit = (holiday: Holiday) => {
    setEditingId(holiday.id);
    setFormData({
      name: holiday.name,
      emoji: holiday.emoji,
      startDate: holiday.startDate,
      endDate: holiday.endDate || '',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <Image 
          src="/assets/titles/breaks_holidays.svg" 
          alt="Holidays & Days Off" 
          width={200} 
          height={35}
          className="h-6 w-auto dark:brightness-110"
        />
        <button
          onClick={() => { 
            setFormData(formDefaults);
            setEditingId(null);
            setIsAdding(true); 
          }}
          className="text-xs flex items-center gap-1 bg-[var(--ember-50)] dark:bg-[var(--ember-900)/30] text-[var(--ember-600)] dark:text-[var(--ember-400)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--ember-100)] dark:hover:bg-[var(--ember-900)/50] transition-colors font-medium"
        >
          <Plus size={14} />
          Add Holiday
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
            {/* Icon Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className={cn(
                  "w-14 h-11 flex items-center justify-center rounded-lg border-2 transition-all",
                  showIconPicker 
                    ? "border-[var(--ember-500)] bg-[var(--ember-50)] dark:bg-[var(--ember-900)/20]" 
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300"
                )}
              >
                {renderIcon(formData.emoji, 28)}
              </button>
              
              {/* Icon Picker Dropdown */}
              {showIconPicker && (
                <>
                  {/* Click-outside overlay */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowIconPicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-3 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">Choose an icon</p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {HOLIDAY_ICONS.map(icon => (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, emoji: icon.id });
                            setShowIconPicker(false);
                          }}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:scale-110",
                            formData.emoji === icon.id 
                              ? "bg-[var(--ember-100)] dark:bg-[var(--ember-900)/30] ring-2 ring-[var(--ember-500)]" 
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                          title={icon.label}
                        >
                          <icon.Icon size={24} weight="duotone" color={icon.color} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <input
              type="text"
              placeholder="Holiday name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
            <input
              type="date"
              placeholder="End date (optional)"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm bg-[var(--ember-500)] text-white rounded-lg hover:bg-[var(--ember-600)]"
            >
              Add Holiday
            </button>
          </div>
        </div>
      )}

      {/* Holiday List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {holidays.length === 0 ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500">
            No holidays added yet. Click &quot;Add Holiday&quot; to get started!
          </div>
        ) : (
          holidays.sort((a, b) => a.startDate.localeCompare(b.startDate)).map(holiday => (
            <div
              key={holiday.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              {editingId === holiday.id ? (
                // Edit mode
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className={cn(
                      "w-12 h-10 flex items-center justify-center rounded border-2 transition-all",
                      showIconPicker 
                        ? "border-[var(--ember-500)] bg-[var(--ember-50)]" 
                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                    )}
                  >
                    {renderIcon(formData.emoji, 24)}
                  </button>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                  <div className="flex gap-1 md:col-span-4 justify-end">
                    <button
                      onClick={resetForm}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleUpdate(holiday.id)}
                      className="p-1 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="w-8 h-8 flex items-center justify-center">{renderIcon(holiday.emoji, 28)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-white">{holiday.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(holiday.startDate)}
                      {holiday.endDate && holiday.endDate !== holiday.startDate && (
                        <> - {formatDate(holiday.endDate)}</>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(holiday)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                      <PencilSimple size={20} weight="duotone" color="#caa2d8" />
                    </button>
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash size={20} weight="duotone" color="#ffcdf6" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
