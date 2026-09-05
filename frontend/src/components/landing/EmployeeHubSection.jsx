import React, { useState } from 'react';
import { User, FileText, Clock, WalletCards, Receipt, Award, CheckCircle2, ChevronRight } from 'lucide-react';

export default function EmployeeHubSection() {
  const [hoveredNode, setHoveredNode] = useState(null);

  const nodes = [
    {
      id: 'contracts',
      name: 'Contracts',
      icon: FileText,
      value: '1 Active Permanent Contract',
      desc: 'Wage: ₹ 95,000 / mo | CNT-2026-001',
      color: '#3B82F6'
    },
    {
      id: 'attendance',
      name: 'Attendance',
      icon: Clock,
      value: '98.2% Attendance Health',
      desc: 'Check In 09:02 AM | 8.0 Worked Hours',
      color: '#10B981'
    },
    {
      id: 'time-off',
      name: 'Time Off',
      icon: WalletCards,
      value: '13.0 Days Remaining',
      desc: '2.0 Days Approved Paid Leave',
      color: '#F59E0B'
    },
    {
      id: 'payslips',
      name: 'Payslips',
      icon: Receipt,
      value: '₹ 70,100 Monthly Net',
      desc: 'PDF Payslip #PS-2026-09 Generated',
      color: '#8B5CF6'
    }
  ];

  return (
    <section style={{
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
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 60px auto' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#4A7FA7',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            THE OPERATIONAL HUB
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#0A1931',
            marginBottom: '16px'
          }}>
            One employee. Every operational connection.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4A7FA7',
            lineHeight: '1.6'
          }}>
            In PeoplePay360, an employee record is not a isolated profile card. It serves as the central operational anchor connecting employment terms, attendance, leave balances, and salary computations.
          </p>
        </div>

        {/* Central Hub Visualization Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Central Employee Card */}
          <div className="card" style={{
            backgroundColor: '#0A1931',
            color: '#F6FAFD',
            borderRadius: '12px',
            padding: '28px',
            border: '2px solid #B3CFE5',
            boxShadow: '0 15px 35px rgba(10, 25, 49, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(179, 207, 229, 0.2)',
                border: '1px solid #B3CFE5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B3CFE5',
                fontWeight: '700',
                fontSize: '16px'
              }}>
                AS
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>Aarav Sharma</h3>
                <div style={{ fontSize: '12px', color: '#B3CFE5', marginTop: '2px' }}>EMP-001 • Senior Software Engineer</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', backgroundColor: '#102744', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Department:</strong> Engineering</div>
              <div><strong>Type:</strong> Full Time Permanent</div>
              <div><strong>Schedule:</strong> Standard 40h Pattern</div>
              <div><strong>Status:</strong> <span style={{ color: '#10B981', fontWeight: '700' }}>Active</span></div>
            </div>

            <div style={{ fontSize: '11px', color: '#4A7FA7', fontStyle: 'italic', textAlign: 'center', paddingTop: '4px' }}>
              Hover surrounding modules below to inspect active linkages
            </div>
          </div>

          {/* Surrounding Connected Nodes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {nodes.map(n => {
              const Icon = n.icon;
              const isHovered = hoveredNode === n.id;
              return (
                <div
                  key={n.id}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="card card-interactive"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${isHovered ? n.color : 'rgba(26, 61, 99, 0.15)'}`,
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 180ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#0A1931' }}>
                      <Icon size={16} color={n.color} />
                      <span>{n.name}</span>
                    </div>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: n.color }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1931' }}>{n.value}</div>
                  <div style={{ fontSize: '11px', color: '#4A7FA7' }}>{n.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
