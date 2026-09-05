import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    // Sanitize string output
    const cleanMsg = typeof message === 'string' ? message : (message?.message || 'Action completed');
    
    setToasts(prev => [...prev.slice(-4), { id, message: cleanMsg, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning')
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        width: 'calc(100vw - 48px)'
      }}>
        {toasts.map(t => {
          const bg = t.type === 'success' ? '#10B981' :
                     t.type === 'error' ? '#EF4444' :
                     t.type === 'warning' ? '#F59E0B' : '#4A7FA7';
          const Icon = t.type === 'success' ? CheckCircle :
                     t.type === 'error' ? XCircle :
                     t.type === 'warning' ? AlertTriangle : Info;

          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--card-bg)',
                borderLeft: `4px solid ${bg}`,
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(10, 25, 49, 0.15)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: '500',
                animation: 'slideIn 200ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={bg} />
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
