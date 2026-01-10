'use client';

import { useState, useRef, useEffect } from 'react';
import { Lock, ArrowClockwise, Check } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Kid } from '@/types';

interface KidPinManagerProps {
  kids: Kid[];
  kidId?: string;
}

export function KidPinManager({ kids, kidId }: KidPinManagerProps) {
  const [selectedKid, setSelectedKid] = useState<string | null>(kidId || null);
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update selected kid if prop changes
  useEffect(() => {
    if (kidId) setSelectedKid(kidId);
  }, [kidId]);

  useEffect(() => {
    if (selectedKid) {
      setPin('');
      setConfirmPin('');
      // Auto-focus first input
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
        // If in modal mode (kidId present), don't clear selection
        if (!kidId) {
            setSelectedKid(null);
        }
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
        No kids added yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!kidId && (
        <>
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
        </>
      )}

      {/* Reset PIN Form */}
      {selectedKid && (
        <div className={cn(
          "mt-4",
          !kidId && "p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200"
        )}>
          {!kidId && (
             <h4 className="font-medium text-gray-900 dark:text-white mb-3">
               Set New PIN for {kids.find(k => k.id === selectedKid)?.name}
             </h4>
          )}

          <div className="space-y-4">
            {/* New PIN */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">New PIN</label>
              <div className="flex gap-2 justify-center sm:justify-start">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={`pin-${i}`}
                    ref={(el) => { if (pinInputRefs.current) pinInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[i] || ''}
                    onChange={(e) => handlePinChange(i, e.target.value, false)}
                    onKeyDown={(e) => handleKeyDown(i, e, false)}
                    className="w-12 h-12 text-center text-xl font-bold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[var(--lavender-500)]"
                  />
                ))}
              </div>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm PIN</label>
              <div className="flex gap-2 justify-center sm:justify-start">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={`confirm-${i}`}
                    ref={(el) => { if (confirmInputRefs.current) confirmInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={confirmPin[i] || ''}
                    onChange={(e) => handlePinChange(i, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(i, e, true)}
                    className="w-12 h-12 text-center text-xl font-bold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[var(--lavender-500)]"
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleResetPin}
              disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
              className="w-full sm:w-auto px-6 py-2 bg-[var(--lavender-500)] text-white font-medium rounded-lg hover:bg-[var(--lavender-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update PIN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
