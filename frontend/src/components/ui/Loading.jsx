import React from 'react';

export function Spinner({ size = 40, color = '#B3CFE5' }) {
  return (
    <>
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `3px solid var(--border-color)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export function CenteredSpinner({ size = 40, height = '260px' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: height,
      padding: '40px 0'
    }}>
      <Spinner size={size} />
    </div>
  );
}

export function GlobalLoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--surface)'
    }}>
      <Spinner size={48} />
    </div>
  );
}

export function PageSkeleton() {
  return <CenteredSpinner />;
}

export default CenteredSpinner;
