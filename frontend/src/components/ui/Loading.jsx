import React from 'react';

export function GlobalLoadingScreen({ message = 'Loading PeoplePay360 HRMS...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--surface)',
      color: 'var(--text-main)',
      gap: '16px'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        border: '4px solid var(--border-color)',
        borderTop: '4px solid #B3CFE5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ fontSize: '18px', fontWeight: '800', color: '#B3CFE5', letterSpacing: '-0.5px' }}>
        PeoplePay360
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
        {message}
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div style={{
        height: '40px',
        width: '240px',
        backgroundColor: 'var(--border-color)',
        borderRadius: '6px',
        opacity: 0.6
      }} />
      <div className="data-table-container">
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '32px',
                width: '100%',
                backgroundColor: 'var(--surface)',
                borderRadius: '4px',
                opacity: 0.5
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
