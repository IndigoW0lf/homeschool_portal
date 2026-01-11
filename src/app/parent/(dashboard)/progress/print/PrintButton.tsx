'use client';

export function PrintButton() {
  return (
    <button 
      className="print-btn no-print"
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
        fontWeight: 500
      }}
    >
      🖨️ Print Log
    </button>
  );
}
