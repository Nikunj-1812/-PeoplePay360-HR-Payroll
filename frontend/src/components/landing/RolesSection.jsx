import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RolesSection() {
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);

  const roles = [
    {
      id: 'employee',
      name: 'Employee',
      tag: 'Self-Service Role',
      badgeColor: '#8B5CF6',
      desc: 'Can access own employee profile, attendance Check In / Check Out, view own leave balances, submit leave requests, and view own payslips.',
      permissions: [
        'View own employee record & contract terms',
        'Perform daily Check In & Check Out',
        'Request time off & view remaining allocations',
        'View and download personal PDF payslips'
      ],
      restrictions: [
        'Cannot access HR management or company-wide employees',
        'Cannot access payroll administration or salary rules',
        'Cannot view other employees\' private data (403 Forbidden)'
      ]
    },
    {
      id: 'hr_manager',
      name: 'HR Manager',
      tag: 'HR Operations Role',
      badgeColor: '#F59E0B',
      desc: 'Full control over employee records, working schedule patterns, contracts, attendance corrections, and leave approval workflows.',
      permissions: [
        'Manage employees (Kanban, List, Form)',
        'Manage employment contracts & schedule assignments',
        'Approve or refuse employee time-off requests',
        'Correct attendance exceptions and missing checkouts'
      ],
      restrictions: [
        'Cannot access payroll computation or payrun creation',
        'Cannot edit salary structures or salary rules'
      ]
    },
    {
      id: 'hr_payroll_user',
      name: 'HR Payroll User',
      tag: 'Payroll Execution Role',
      badgeColor: '#10B981',
      desc: 'Has full HR Manager capabilities plus payrun creation via 2-Step Wizard, payroll computation, validation, and payslip distribution.',
      permissions: [
        'Create & process 2-step payrun batches',
        'Compute salary rules & validate payroll state',
        'Generate PDF payslips & send bulk Nodemailer emails',
        'Read-only access to salary structures and rules'
      ],
      restrictions: [
        'Cannot create or modify salary structure rules',
        'Cannot access system settings or user role assignment'
      ]
    },
    {
      id: 'hr_payroll_manager',
      name: 'HR Payroll Manager',
      tag: 'Payroll Administration Role',
      badgeColor: '#3B82F6',
      desc: 'Full administrative control over HR operations, payruns, payslips, salary structures, and ordered salary rules configuration.',
      permissions: [
        'Create, edit & reorder salary computation rules',
        'Configure salary structures and percentage/formula logic',
        'Full management of payruns, validation & mark as paid',
        'Access executive payroll reports & CSV exports'
      ],
      restrictions: [
        'Cannot perform root system user management or role re-assignment'
      ]
    },
    {
      id: 'admin',
      name: 'System Admin',
      tag: 'Full Platform Authority',
      badgeColor: '#E11D48',
      desc: 'Unrestricted control over all HR, payroll, user account management, role assignments, system settings, and audit logs.',
      permissions: [
        'Complete system administration & settings access',
        'User management (Create, Edit, Deactivate, Reset Password)',
        'Role assignment & permissions management',
        'Unrestricted access across all platform capabilities'
      ],
      restrictions: ['Root system authority']
    }
  ];

  const currentRole = roles[activeRoleIndex];

  return (
    <section id="roles" style={{
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
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 50px auto' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#4A7FA7',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            ROLE-BASED ACCESS CONTROL (RBAC)
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#0A1931',
            marginBottom: '16px'
          }}>
            Designed around role responsibility.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4A7FA7',
            lineHeight: '1.6'
          }}>
            PeoplePay360 enforces 5 strict role boundaries. Every API route andSocket.IO channel is authorized by the backend engine.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '36px'
        }}>
          {roles.map((r, idx) => {
            const isSelected = activeRoleIndex === idx;
            return (
              <button
                key={r.id}
                onClick={() => setActiveRoleIndex(idx)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#0A1931' : '#4A7FA7',
                  backgroundColor: isSelected ? '#B3CFE5' : '#FFFFFF',
                  border: `1px solid ${isSelected ? '#B3CFE5' : 'rgba(26, 61, 99, 0.15)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                {r.name}
              </button>
            );
          })}
        </div>

        {/* Selected Role Operational Card */}
        <div className="card shadow-lg" style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid rgba(26, 61, 99, 0.15)',
          padding: '32px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={22} color={currentRole.badgeColor} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0A1931', margin: 0 }}>{currentRole.name}</h3>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: `${currentRole.badgeColor}18`,
              color: currentRole.badgeColor,
              border: `1px solid ${currentRole.badgeColor}40`
            }}>
              {currentRole.tag}
            </span>
          </div>

          <p style={{ fontSize: '14px', color: '#4A7FA7', lineHeight: '1.6', marginBottom: '24px' }}>
            {currentRole.desc}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Authorized Capabilities */}
            <div style={{ backgroundColor: '#F6FAFD', padding: '18px', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.08)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#10B981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Authorized Operations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#0A1931' }}>
                {currentRole.permissions.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: '#10B981', fontWeight: '700' }}>✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restricted Boundaries */}
            <div style={{ backgroundColor: '#F6FAFD', padding: '18px', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.08)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#E11D48', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} /> Security Restrictions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#0A1931' }}>
                {currentRole.restrictions.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: '#E11D48', fontWeight: '700' }}>✕</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
