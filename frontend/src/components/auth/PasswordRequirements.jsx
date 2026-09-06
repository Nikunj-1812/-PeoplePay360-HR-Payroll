import React from 'react';
import { Check, X } from 'lucide-react';
import { checkPasswordRequirements } from '../../utils/passwordPolicy';

export default function PasswordRequirements({ password = '' }) {
  const reqs = checkPasswordRequirements(password);

  const items = [
    { label: '8+ characters', valid: reqs.minLength },
    { label: 'Uppercase (A-Z)', valid: reqs.hasUpper },
    { label: 'Lowercase (a-z)', valid: reqs.hasLower },
    { label: 'Number (0-9)', valid: reqs.hasNumber },
    { label: 'Special symbol (@$!%*?&#)', valid: reqs.hasSpecial }
  ];

  const score = items.filter(i => i.valid).length;
  let strengthLabel = 'Too Weak';
  let strengthColor = '#EF4444';
  let strengthWidth = '20%';

  if (!password) {
    strengthLabel = 'Enter Password';
    strengthColor = '#64748B';
    strengthWidth = '0%';
  } else if (score <= 2) {
    strengthLabel = 'Weak';
    strengthColor = '#EF4444';
    strengthWidth = '35%';
  } else if (score === 3 || score === 4) {
    strengthLabel = 'Moderate';
    strengthColor = '#F59E0B';
    strengthWidth = '70%';
  } else if (score === 5) {
    strengthLabel = 'Strong & Secure';
    strengthColor = '#10B981';
    strengthWidth = '100%';
  }

  return (
    <div style={{
      marginTop: '12px',
      padding: '14px',
      borderRadius: '12px',
      backgroundColor: 'rgba(10, 25, 49, 0.6)',
      border: '1px solid rgba(179, 207, 229, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Strength Progress Meter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Password Strength
        </span>
        <span style={{ fontSize: '11px', fontWeight: '700', color: strengthColor, transition: 'all 200ms ease' }}>
          {strengthLabel}
        </span>
      </div>

      <div style={{
        height: '4px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: strengthWidth,
          backgroundColor: strengthColor,
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      {/* Requirement Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: item.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: item.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: item.valid ? '#34D399' : '#64748B',
              transition: 'all 200ms ease'
            }}
          >
            {item.valid ? (
              <Check size={12} style={{ color: '#34D399', flexShrink: 0 }} />
            ) : (
              <X size={12} style={{ color: '#64748B', flexShrink: 0 }} />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
