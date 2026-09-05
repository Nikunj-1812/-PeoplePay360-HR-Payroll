import React from 'react';
import { BarChart3, Wallet, FileCheck, Users, CalendarCheck, Activity, Filter, CheckCircle2 } from 'lucide-react';
import AnimatedNumber from '../../utils/AnimatedNumber';

export default function DashboardSection() {
  return (
    <section style={{
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
            EXECUTIVE DASHBOARD & REPORTS
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#FFFFFF',
            marginBottom: '16px'
          }}>
            From operational data to decisions.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#B3CFE5',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            Live PostgreSQL queries drive every KPI, department cost breakdown, and monthly salary trend on the executive dashboard.
          </p>
        </div>

        {/* Dashboard Preview Composition Card */}
        <div className="card shadow-lg" style={{
          backgroundColor: '#102744',
          border: '1px solid rgba(179, 207, 229, 0.2)',
          borderRadius: '12px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Top Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#0A1931',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(179, 207, 229, 0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#B3CFE5' }}>
              <Filter size={15} color="#4A7FA7" />
              <span>Multi-Dimensional SQL Filters:</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '12px' }}>
              <span className="badge badge-primary">Period: All Periods</span>
              <span className="badge badge-primary">Department: All</span>
              <span className="badge badge-primary">Type: Full Time</span>
              <span className="badge badge-primary">Company: Odoo Pvt Ltd</span>
            </div>
          </div>

          {/* 5 KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px'
          }}>
            <div style={{ backgroundColor: '#0A1931', padding: '14px', borderRadius: '8px', border: '1px solid rgba(179, 207, 229, 0.12)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A7FA7', letterSpacing: '0.5px' }}>TOTAL NET SALARY PAID</div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: '#F6FAFD', margin: '4px 0' }}>
                <AnimatedNumber value={1845000} prefix="₹ " />
              </div>
              <span style={{ fontSize: '10px', color: '#10B981' }}>✓ Verified Payruns</span>
            </div>

            <div style={{ backgroundColor: '#0A1931', padding: '14px', borderRadius: '8px', border: '1px solid rgba(179, 207, 229, 0.12)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A7FA7', letterSpacing: '0.5px' }}>PAYSLIPS GENERATED</div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: '#F6FAFD', margin: '4px 0' }}>
                <AnimatedNumber value={250} />
              </div>
              <span style={{ fontSize: '10px', color: '#B3CFE5' }}>Across active payruns</span>
            </div>

            <div style={{ backgroundColor: '#0A1931', padding: '14px', borderRadius: '8px', border: '1px solid rgba(179, 207, 229, 0.12)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A7FA7', letterSpacing: '0.5px' }}>AVG NET SALARY / EMP</div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: '#F6FAFD', margin: '4px 0' }}>
                <AnimatedNumber value={73800} prefix="₹ " />
              </div>
              <span style={{ fontSize: '10px', color: '#B3CFE5' }}>Month / current period</span>
            </div>

            <div style={{ backgroundColor: '#0A1931', padding: '14px', borderRadius: '8px', border: '1px solid rgba(179, 207, 229, 0.12)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A7FA7', letterSpacing: '0.5px' }}>APPROVED TIME OFF</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#F6FAFD', margin: '4px 0' }}>
                <AnimatedNumber value={18} suffix=" Days" />
              </div>
              <span style={{ fontSize: '10px', color: '#10B981' }}>Selected period</span>
            </div>

            <div style={{ backgroundColor: '#0A1931', padding: '14px', borderRadius: '8px', border: '1px solid rgba(179, 207, 229, 0.12)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A7FA7', letterSpacing: '0.5px' }}>ATTENDANCE HEALTH</div>
              <div style={{ fontSize: '19px', fontWeight: '700', color: '#F6FAFD', margin: '4px 0' }}>
                <AnimatedNumber value={96} suffix=".4%" />
              </div>
              <span style={{ fontSize: '10px', color: '#10B981' }}>✓ Normal operations</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
