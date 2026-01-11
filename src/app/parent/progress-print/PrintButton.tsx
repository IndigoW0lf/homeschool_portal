'use client';

import { useSearchParams } from 'next/navigation';
import { Printer, Books, ChartBar, Notebook, Moon, Sparkle, GraduationCap, PencilSimple } from '@phosphor-icons/react';

export function FilterControls({ 
  kids,
  currentKid,
  currentDays,
  currentSource
}: {
  kids: { id: string; name: string }[];
  currentKid?: string;
  currentDays: number;
  currentSource?: string;
}) {
  const searchParams = useSearchParams();
  
  // Use window.location to trigger a full page reload (required for server components)
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    window.location.href = `?${params.toString()}`;
  };

  return (
    <div className="no-print" style={{
      display: 'flex',
      gap: 16,
      marginBottom: 20,
      padding: 16,
      background: '#f9fafb',
      borderRadius: 8,
      flexWrap: 'wrap',
      alignItems: 'flex-end'
    }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>Student</label>
        <select
          value={currentKid || ''}
          onChange={(e) => updateParams('kid', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 140 }}
        >
          <option value="">All Students</option>
          {kids.map(kid => (
            <option key={kid.id} value={kid.id}>{kid.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>Time Period</label>
        <select
          value={currentDays}
          onChange={(e) => updateParams('days', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 160 }}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days (Quarter)</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
        </select>
      </div>
      
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>Source</label>
        <select
          value={currentSource || ''}
          onChange={(e) => updateParams('source', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 140 }}
        >
          <option value="">All Sources</option>
          <option value="lunara_quest">Lunara Quest</option>
          <option value="miacademy">MiAcademy</option>
          <option value="manual">Manual Entries</option>
        </select>
      </div>
    </div>
  );
}

export function PrintButton() {
  return (
    <button 
      className="no-print"
      onClick={() => window.print()}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        padding: '10px 20px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <Printer size={18} weight="bold" />
      Print Log
    </button>
  );
}

// Icons for use in the page
export const Icons = {
  Books,
  ChartBar,
  Notebook,
  Moon,
  Sparkle,
  GraduationCap,
  PencilSimple
};
