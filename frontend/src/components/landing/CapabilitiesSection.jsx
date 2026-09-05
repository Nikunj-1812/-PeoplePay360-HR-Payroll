import React from 'react';
import { Users, FileText, Clock, Sliders, CheckCircle, ArrowRight } from 'lucide-react';

export default function CapabilitiesSection() {
  const capabilities = [
    {
      num: '01',
      title: 'Employee Directory & Hub',
      icon: Users,
      desc: 'Centralized employee information with Kanban, List, and Form views. Tracks departments, managers, positions, contact details, and linked user authentication accounts.',
      features: ['Kanban / List / Form views', 'Smart Links with real-time counters', 'Historical contract & payslip linkage', 'Role-scoped data security']
    },
    {
      num: '02',
      title: 'Contracts & Schedules',
      icon: FileText,
      desc: 'Period-based contract resolution. Computes applicable wages and salary structures for any selected payroll period while preserving past contract history.',
      features: ['Period-specific wage applicability', 'Weekly 40h schedule patterns', 'Concurrent contract prevention', 'Expired contract tracking']
    },
    {
      num: '03',
      title: 'Attendance & Time Off',
      icon: Clock,
      desc: 'Real-time Check In / Check Out logging with worked hours auto-calculation, missing checkout exception detection, leave allocations, and manager approvals.',
      features: ['Strict Check In / Check Out terminology', 'Worked hours auto-computation', 'Leave allocation balance auto-deduction', 'Manual HR exception audit notes']
    },
    {
      num: '04',
      title: 'Salary Rules & Payruns',
      icon: Sliders,
      desc: 'Configurable ordered salary rules engine (Sequence 10..100) running through a 2-step Payrun Wizard with pre-flight warnings and Nodemailer bulk delivery.',
      features: ['Ordered Basic → HRA → Gross → Net rules', '2-Step Payrun Scope & Employee Wizard', 'Warnings for missing bank/contract data', 'Itemized PDF Payslip & Bulk Email']
    }
  ];

  return (
    <section id="capabilities" style={{
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
            PLATFORM CAPABILITIES
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#FFFFFF',
            marginBottom: '16px'
          }}>
            Engineered for precision HR & payroll operations.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#B3CFE5',
            lineHeight: '1.6',
            opacity: 0.9
          }}>
            Explore the core architectural modules built into the PeoplePay360 platform.
          </p>
        </div>

        {/* 4 Capability Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {capabilities.map((c, idx) => {
            const Icon = c.icon;
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
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <Icon size={20} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#4A7FA7' }}>{c.num}</span>
                </div>

                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>{c.title}</h3>
                  <p style={{ fontSize: '13px', color: '#B3CFE5', lineHeight: '1.6', margin: 0, opacity: 0.9 }}>{c.desc}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(179, 207, 229, 0.1)' }}>
                  {c.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F6FAFD' }}>
                      <CheckCircle size={14} color="#10B981" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
