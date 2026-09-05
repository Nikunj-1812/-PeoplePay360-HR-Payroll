import React from 'react';
import { ShieldCheck, Lock, Database, RefreshCw, KeyRound, Server } from 'lucide-react';

export default function SecuritySection() {
  const principles = [
    {
      title: 'Backend-Authoritative RBAC',
      icon: Lock,
      desc: 'Role authorization is enforced on Express server API routes and Socket.IO handshakes. Client spoofing is strictly rejected.'
    },
    {
      title: 'State-Machine Validation',
      icon: ShieldCheck,
      desc: 'Payruns move through strict states (Draft → Computed → Validated → Paid). Validation blocks processing if bank/contract errors exist.'
    },
    {
      title: 'Single Source of Truth',
      icon: Database,
      desc: 'Neon PostgreSQL acts as the single source of truth. Every mutation triggers immediate Redis cache invalidation and Socket.IO events.'
    }
  ];

  return (
    <section id="security" style={{
      padding: '90px 0',
      backgroundColor: '#0A1931',
      color: '#F6FAFD',
      borderBottom: '1px solid rgba(179, 207, 229, 0.12)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 60px auto' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#B3CFE5',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            SECURITY & ARCHITECTURE
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#FFFFFF',
            marginBottom: '16px'
          }}>
            Access designed around responsibility.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#B3CFE5',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            Built on standard enterprise web security practices, JWT authentication, and transactional state safety.
          </p>
        </div>

        {/* 3 Principles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="card card-interactive animate-fade-up"
                style={{
                  backgroundColor: '#102744',
                  border: '1px solid rgba(179, 207, 229, 0.18)',
                  borderRadius: '12px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(179, 207, 229, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B3CFE5'
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>{p.title}</h3>
                <p style={{ fontSize: '13px', color: '#B3CFE5', lineHeight: '1.6', margin: 0, opacity: 0.9 }}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
