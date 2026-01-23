'use client';

import { useState } from 'react';
import { Printer, Funnel, X } from '@phosphor-icons/react';

interface PrintLogGeneratorProps {
  kids: { id: string; name: string }[];
}

export function PrintLogGenerator({ kids }: PrintLogGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKid, setSelectedKid] = useState('');
  const [days, setDays] = useState('30');
  const [source, setSource] = useState('');

  const generatePrintUrl = () => {
    const params = new URLSearchParams();
    if (selectedKid) params.set('kid', selectedKid);
    if (days !== '30') params.set('days', days);
    if (source) params.set('source', source);
    
    const queryString = params.toString();
    return `/parent/progress-print${queryString ? `?${queryString}` : ''}`;
  };

  const handleGenerate = () => {
    const url = generatePrintUrl();
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm font-medium text-muted dark:text-muted hover:text-[var(--ember-500)] hover:bg-[var(--background-secondary)] dark:hover:bg-[var(--night-800)] rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Printer size={16} weight="duotone" />
        Print Log
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-[var(--background-elevated)] rounded-xl border border-[var(--border)] shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-heading flex items-center gap-2">
                <Funnel size={16} />
                Generate Print Log
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted hover:text-muted dark:hover:text-muted rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Student */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Student
                </label>
                <select
                  value={selectedKid}
                  onChange={(e) => setSelectedKid(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading"
                >
                  <option value="">All Students</option>
                  {kids.map(kid => (
                    <option key={kid.id} value={kid.id}>{kid.name}</option>
                  ))}
                </select>
              </div>

              {/* Time Period */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Time Period
                </label>
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days (Quarter)</option>
                  <option value="180">Last 6 Months</option>
                  <option value="365">Last Year</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-white dark:bg-[var(--background-secondary)] text-heading"
                >
                  <option value="">All Sources</option>
                  <option value="lunara_quest">Lunara Quest</option>
                  <option value="miacademy">MiAcademy</option>
                  <option value="manual">Manual Entries</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full px-4 py-2.5 bg-[var(--ember-500)] hover:bg-[var(--ember-600)] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={18} weight="bold" />
                Generate Printable Log
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
