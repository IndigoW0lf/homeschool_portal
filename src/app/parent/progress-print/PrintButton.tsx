'use client';

import { useState } from 'react';
import { Printer, Funnel } from '@phosphor-icons/react';

export function FilterControls({ 
  kids,
  initialKid,
  initialDays,
  initialSource
}: {
  kids: { id: string; name: string }[];
  initialKid?: string;
  initialDays: number;
  initialSource?: string;
}) {
  const [kid, setKid] = useState(initialKid || '');
  const [days, setDays] = useState(initialDays.toString());
  const [source, setSource] = useState(initialSource || '');
  
  const handleApply = () => {
    const params = new URLSearchParams();
    if (kid) params.set('kid', kid);
    if (days !== '30') params.set('days', days);
    if (source) params.set('source', source);
    
    const queryString = params.toString();
    window.location.href = queryString ? `?${queryString}` : window.location.pathname;
  };

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    minWidth: 150,
    backgroundColor: 'white'
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
          value={kid}
          onChange={(e) => setKid(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Students</option>
          {kids.map(k => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4, color: '#374151' }}>Time Period</label>
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          style={selectStyle}
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
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Sources</option>
          <option value="lunara_quest">Lunara Quest</option>
          <option value="miacademy">MiAcademy</option>
          <option value="manual">Manual Entries</option>
        </select>
      </div>
      
      <button
        onClick={handleApply}
        style={{
          padding: '8px 20px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 38
        }}
      >
        <Funnel size={16} weight="bold" />
        Apply Filters
      </button>
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
