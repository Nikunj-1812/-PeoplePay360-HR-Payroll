import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function FinalCTA({ onOpenApp, onScrollToWorkflow }) {
  return (
    <section style={{
      padding: '100px 0',
      backgroundColor: '#F6FAFD',
      color: '#0A1931',
      borderBottom: '1px solid rgba(26, 61, 99, 0.12)',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(74, 127, 167, 0.12)',
          color: '#4A7FA7',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={14} color="#4A7FA7" />
          <span>PRODUCTION-READY HRMS & PAYROLL</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(30px, 4.5vw, 48px)',
          fontWeight: '800',
          lineHeight: '1.2',
          letterSpacing: '-0.5px',
          color: '#0A1931',
          marginBottom: '18px'
        }}>
          Bring HR and payroll <br />
          into one flow.
        </h2>

        <p style={{
          fontSize: '17px',
          color: '#4A7FA7',
          lineHeight: '1.6',
          marginBottom: '36px',
          maxWidth: '640px'
        }}>
          PeoplePay360 connects the workforce lifecycle with the payroll process in one operational platform.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onOpenApp}
            className="btn btn-primary"
            style={{
              backgroundColor: '#0A1931',
              color: '#B3CFE5',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(10, 25, 49, 0.2)'
            }}
          >
            <span>Open PeoplePay360</span>
            <ArrowRight size={17} />
          </button>

          <button
            onClick={onScrollToWorkflow}
            className="btn btn-secondary"
            style={{
              padding: '14px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            Explore the Workflow
          </button>
        </div>
      </div>
    </section>
  );
}
