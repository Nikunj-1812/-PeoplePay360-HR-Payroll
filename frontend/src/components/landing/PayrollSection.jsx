import React from 'react';
import { Sliders, Receipt, FileCheck, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PayrollSection() {
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
            THE COMPUTATION ENGINE
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: '800',
            lineHeight: '1.2',
            letterSpacing: '-0.5px',
            color: '#0A1931',
            marginBottom: '16px'
          }}>
            Payroll without the black box.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#4A7FA7',
            lineHeight: '1.6'
          }}>
            Every component of a payslip in PeoplePay360 is computed by ordered salary rules, applicable period contracts, and verified attendance context.
          </p>
        </div>

        {/* Pipeline & Payslip Card Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'center'
        }}>
          {/* Pipeline Diagram Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#4A7FA7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Execution Order (Sequence 10 → 100)
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.12)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>10. Basic Salary</strong> (50% of Wage)</span>
              <span style={{ color: '#10B981', fontWeight: '700' }}>₹ 47,500</span>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.12)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>20. House Rent Allowance (HRA)</strong> (40% of Basic)</span>
              <span style={{ color: '#10B981', fontWeight: '700' }}>₹ 19,000</span>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.12)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>30. Special Allowance</strong> (10% of Wage)</span>
              <span style={{ color: '#10B981', fontWeight: '700' }}>₹ 9,500</span>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#0A1931', color: '#F6FAFD', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>40. Gross Salary</strong> (Basic + HRA + Special)</span>
              <span style={{ color: '#B3CFE5', fontWeight: '700' }}>₹ 76,000</span>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.12)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>50. Provident Fund (PF)</strong> (12% of Basic)</span>
              <span style={{ color: '#E11D48', fontWeight: '700' }}>- ₹ 5,700</span>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(26, 61, 99, 0.12)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>60. Professional Tax (PT)</strong> (Fixed)</span>
              <span style={{ color: '#E11D48', fontWeight: '700' }}>- ₹ 200</span>
            </div>
          </div>

          {/* Payslip Card Right */}
          <div className="card shadow-lg" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(26, 61, 99, 0.15)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(26, 61, 99, 0.12)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0A1931', margin: 0 }}>Payslip Summary</h3>
                <div style={{ fontSize: '11px', color: '#4A7FA7' }}>Period: September 2026 • Worked: 22 Days</div>
              </div>
              <span className="badge badge-paid">STATUS: VALIDATED</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', backgroundColor: '#F6FAFD', padding: '14px', borderRadius: '8px' }}>
              <div><strong>Employee:</strong> Aarav Sharma</div>
              <div><strong>Emp ID:</strong> EMP-001</div>
              <div><strong>Contract:</strong> CNT-2026-001</div>
              <div><strong>Structure:</strong> Standard Regular</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '8px' }}>
              <span style={{ color: '#4A7FA7' }}>Total Earnings:</span>
              <span style={{ fontWeight: '700', color: '#0A1931' }}>₹ 76,000</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#4A7FA7' }}>Total Deductions:</span>
              <span style={{ fontWeight: '700', color: '#E11D48' }}>- ₹ 5,900</span>
            </div>

            <div style={{
              marginTop: '10px',
              padding: '16px',
              backgroundColor: '#0A1931',
              color: '#F6FAFD',
              borderRadius: '8px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#B3CFE5', fontWeight: '700', letterSpacing: '0.5px' }}>NET SALARY PAYABLE</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>₹ 70,100</div>
              </div>
              <FileCheck size={28} color="#B3CFE5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
