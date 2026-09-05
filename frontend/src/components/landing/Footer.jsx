import React from 'react';
import { Database, RefreshCw, Zap } from 'lucide-react';
import faviconImg from '../../assets/favicon.jpeg';

export default function Footer({ onOpenApp }) {
  return (
    <footer style={{
      backgroundColor: '#0A1931',
      color: '#F6FAFD',
      padding: '60px 0 30px 0',
      borderTop: '1px solid rgba(179, 207, 229, 0.15)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          {/* Brand Col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={faviconImg} alt="PeoplePay360" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#B3CFE5' }}>PeoplePay360</span>
            </div>
            <p style={{ fontSize: '13px', color: '#B3CFE5', lineHeight: '1.6', margin: 0, opacity: 0.8 }}>
              Integrated HR & Payroll Operations Platform built on PostgreSQL, Redis, and Socket.IO.
            </p>
          </div>

          {/* Links Col 1 */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#B3CFE5' }}>
              <a href="#problem" style={{ color: '#B3CFE5', textDecoration: 'none' }}>Connected Architecture</a>
              <a href="#workflow" style={{ color: '#B3CFE5', textDecoration: 'none' }}>Operational Workflow</a>
              <a href="#capabilities" style={{ color: '#B3CFE5', textDecoration: 'none' }}>Capabilities</a>
              <a href="#roles" style={{ color: '#B3CFE5', textDecoration: 'none' }}>Roles & RBAC</a>
            </div>
          </div>

          {/* Links Col 2 */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Core Modules</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#B3CFE5' }}>
              <span>Employees & Contracts</span>
              <span>Schedules & Attendance</span>
              <span>Time Off & Allocations</span>
              <span>Salary Rules & Payruns</span>
            </div>
          </div>

          {/* Tech Stack Col */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Technology Stack</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#B3CFE5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={14} color="#10B981" /> Neon PostgreSQL DB</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} color="#3B82F6" /> Upstash Redis Cache</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} color="#F59E0B" /> Socket.IO Real-Time</div>
            </div>
          </div>
        </div>

        {/* Bottom Copy */}
        <div style={{
          borderTop: '1px solid rgba(179, 207, 229, 0.1)',
          paddingTop: '24px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: '#4A7FA7'
        }}>
          <div>© 2026 PeoplePay360. All rights reserved. Built for enterprise HR & payroll excellence.</div>
          <button onClick={onOpenApp} style={{ background: 'none', border: 'none', color: '#B3CFE5', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
            Open Platform →
          </button>
        </div>
      </div>
    </footer>
  );
}
