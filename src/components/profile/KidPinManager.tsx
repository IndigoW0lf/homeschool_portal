'use client';

import { useState, useRef, useEffect } from 'react';
import { Lock, Check, ArrowClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface Kid {
  id: string;
  name: string;
}

interface KidPinManagerProps {
  kids: Kid[];
}

export function KidPinManager({ kids }: KidPinManagerProps) {
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (selectedKid) {
      setPin('');
      setConfirmPin('');
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
  }, [selectedKid]);

  const handlePinChange = (index: number, value: string, isConfirm: boolean) => {
    if (!/^\d*$/.test(value)) return;
    
    const refs = isConfirm ? confirmInputRefs : pinInputRefs;
    const setter = isConfirm ? setConfirmPin : setPin;
    const currentValue = isConfirm ? confirmPin : pin;
    
    const chars = currentValue.split('');
    chars[index] = value.slice(-1);
    const newValue = chars.join('').slice(0, 4);
    setter(newValue);

    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
    const refs = isConfirm ? confirmInputRefs : pinInputRefs;
    const currentValue = isConfirm ? confirmPin : pin;
    
    if (e.key === 'Backspace' && !currentValue[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleResetPin = async () => {
    if (!selectedKid || pin.length !== 4 || confirmPin.length !== 4) return;
    
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/kids/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId: selectedKid, pin }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('PIN updated successfully!');
        setSelectedKid(null);
        setPin('');
        setConfirmPin('');
      } else {
        toast.error(result.error || 'Failed to update PIN');
      }
    } catch {
      toast.error('Failed to update PIN');
    } finally {
      setIsLoading(false);
    }
  };

  if (kids.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        No kids added yet. Add a kid from the dashboard to manage their PIN.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={20} className="text-[var(--lavender-500)]" />
        <h3 className="font-medium text-gray-900 dark:text-white">Kid PIN Management</h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Each kid uses their PIN to access their portal. Reset their PIN if they forget it.
      </p>

      {/* Kid List */}
      <div className="space-y-2">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <span className="font-medium text-gray-900 dark:text-white">{kid.name}</span>
            <button
              onClick={() => setSelectedKid(selectedKid === kid.id ? null : kid.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--lavender-100)] dark:bg-[var(--lavender-900)]/30 text-[var(--lavender-600)] dark:text-[var(--lavender-400)] rounded-lg hover:opacity-80 transition-opacity"
            >
              <ArrowClockwise size={14} />
              Reset PIN
            </button>
          </div>
        ))}
      </div>

      {/* Reset PIN Form */}
      {selectedKid && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Set New PIN for {kids.find(k => k.id === selectedKid)?.name}
          </h4>

          <div className="space-y-4">
            {/* New PIN */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">New PIN</label>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={el => { pinInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[index] || ''}
                    onChange={(e) => handlePinChange(index, e.target.value, false)}
                    onKeyDown={(e) => handleKeyDown(index, e, false)}
                    className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[var(--lavender-500)] outline-none"
                  />
                ))}
              </div>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Confirm PIN</label>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={el => { confirmInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={confirmPin[index] || ''}
                    onChange={(e) => handlePinChange(index, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(index, e, true)}
                    className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[var(--lavender-500)] outline-none"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedKid(null)}
                className="flex-1 py-2 px-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPin}
                disabled={pin.length !== 4 || confirmPin.length !== 4 || isLoading}
                className="flex-1 py-2 px-4 bg-[var(--lavender-500)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
              >
                {isLoading ? 'Saving...' : (
                  <>
                    <Check size={16} />
                    Save PIN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
