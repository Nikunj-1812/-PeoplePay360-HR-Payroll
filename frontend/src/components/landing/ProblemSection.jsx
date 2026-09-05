import React from 'react';
import { Users, Clock, Receipt, BarChart3, ArrowRight, ShieldAlert, Check } from 'lucide-react';

export default function ProblemSection() {
  const pillars = [
    {
      step: '01',
      title: 'Employee Data',
      icon: Users,
      desc: 'Central employee records, department structures, job positions, and contract history.',
      benefit: 'Single Source of Truth'
    },
    {
      step: '02',
      title: 'Time & Leave',
      icon: Clock,
      desc: 'Working schedule rules, Check In / Check Out logs, and automated leave deductions.',
      benefit: 'Zero Manual Entry'
    },
    {
      step: '03',
      title: 'Payroll Engine',
      icon: Receipt,
      desc: 'Ordered salary rules (Basic → HRA → Gross → PF → Net) and 2-step validation payruns.',
      benefit: '100% Verified Computation'
    },
    {
      step: '04',
      title: 'Reporting & KPIs',
      icon: BarChart3,
      desc: 'Live PostgreSQL aggregated dashboards, salary expenditure trends, and exportable reports.',
      benefit: 'Real-Time Insights'
    }
  ];

  return (
    <section id="problem" style={{
      padding: '90px 0',
      backgroundColor: '#F6FAFD',
      color: '#0A1931',
      borderBottom: '1px solid rgba(26, 61, 99, 0.12)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 60px auto' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#4A7FA7',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            THE OPERATIONAL PROBLEM
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#0A1931',
            marginBottom: '16px'
          }}>
            HR data shouldn't live in disconnected workflows.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4A7FA7',
            lineHeight: '1.6'
          }}>
            Traditional HR tools isolate employee profiles, attendance logs, and payroll calculations into static spreadsheets. PeoplePay360 unifies the complete chain into one continuous operational flow.
          </p>
        </div>

        {/* Connected 4-Pillars Container */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          position: 'relative'
        }}>
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div 
                key={idx}
                className="card card-interactive animate-fade-up"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(26, 61, 99, 0.12)',
                  borderRadius: '10px',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(179, 207, 229, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1A3D63'
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#4A7FA7' }}>{p.step}</span>
                </div>

                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0A1931', marginBottom: '6px' }}>{p.title}</h3>
                  <p style={{ fontSize: '13px', color: '#4A7FA7', lineHeight: '1.5', margin: 0 }}>{p.desc}</p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(26, 61, 99, 0.08)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#10B981' }}>
                  <Check size={14} /> {p.benefit}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Statement & Connecting Line */}
        <div style={{
          marginTop: '50px',
          padding: '20px 30px',
          borderRadius: '10px',
          backgroundColor: '#0A1931',
          color: '#F6FAFD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(10, 25, 49, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B3CFE5' }} />
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>
              PeoplePay360 connects the entire operational chain.
            </span>
          </div>
          <span style={{ fontSize: '13px', color: '#B3CFE5', fontWeight: '500' }}>
            Employee → Schedule → Attendance → Time Off → Salary Rules → Payrun → Payslip
          </span>
        </div>
      </div>
    </section>
  );
}
