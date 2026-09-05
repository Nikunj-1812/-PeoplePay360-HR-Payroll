const { sql } = require('../db');
const { findApplicableContract } = require('./contractService');

async function getEligibleEmployees(salaryStructureId, periodStart, periodEnd) {
  // Find employees who have active contracts covering period
  const employees = await sql`
    SELECT DISTINCT
      e.id, e.emp_id, e.first_name, e.last_name, e.email, e.job_position, e.bank_name, e.account_number,
      d.name as department_name,
      c.id as contract_id, c.wage, c.contract_number
    FROM employees e
    JOIN contracts c ON c.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE c.status = 'Active'
      AND c.start_date <= ${periodEnd}
      AND (c.end_date IS NULL OR c.end_date >= ${periodStart})
      AND (${salaryStructureId ? sql`c.salary_structure_id = ${salaryStructureId}` : sql`1=1`})
    ORDER BY e.id ASC
  `;
  return employees;
}

async function getPayruns() {
  return await sql`
    SELECT 
      pr.*,
      ss.name as salary_structure_name
    FROM payruns pr
    JOIN salary_structures ss ON pr.salary_structure_id = ss.id
    ORDER BY pr.id DESC
  `;
}

async function getPayrunById(id) {
  const payruns = await sql`
    SELECT pr.*, ss.name as salary_structure_name
    FROM payruns pr
    JOIN salary_structures ss ON pr.salary_structure_id = ss.id
    WHERE pr.id = ${id}
  `;
  if (payruns.length === 0) throw new Error('Payrun not found');

  const payrun = payruns[0];
  const payslips = await sql`
    SELECT 
      p.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id, e.email, e.bank_name, e.account_number,
      d.name as department_name
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE p.payrun_id = ${id}
    ORDER BY p.id ASC
  `;

  // Get warnings
  const warnings = await validatePayrun(id);

  return {
    ...payrun,
    payslips,
    warnings
  };
}

async function createPayrun(data) {
  const { name, salary_structure_id, period_start, period_end, employee_ids } = data;

  if (!employee_ids || employee_ids.length === 0) {
    throw new Error('At least one employee must be selected for the Payrun.');
  }

  // 1. Insert Payrun record in Draft status
  const [payrun] = await sql`
    INSERT INTO payruns (name, salary_structure_id, period_start, period_end, status, payslip_count)
    VALUES (${name}, ${salary_structure_id}, ${period_start}, ${period_end}, 'Draft', ${employee_ids.length})
    RETURNING *
  `;

  // 2. Initialize draft payslips for selected employees
  for (const empId of employee_ids) {
    const contract = await findApplicableContract(empId, period_start, period_end);
    await sql`
      INSERT INTO payslips (payrun_id, employee_id, contract_id, period_start, period_end, status)
      VALUES (${payrun.id}, ${empId}, ${contract ? contract.id : null}, ${period_start}, ${period_end}, 'Draft')
    `;
  }

  return payrun;
}

async function computePayrun(payrunId) {
  // Update state to Computing
  await sql`UPDATE payruns SET status = 'Computing' WHERE id = ${payrunId}`;

  const payruns = await sql`SELECT * FROM payruns WHERE id = ${payrunId}`;
  const payrun = payruns[0];

  // Get ordered salary rules for structure
  const rules = await sql`
    SELECT * FROM salary_rules
    WHERE salary_structure_id = ${payrun.salary_structure_id} AND is_active = true
    ORDER BY sequence ASC
  `;

  const payslips = await sql`SELECT * FROM payslips WHERE payrun_id = ${payrunId}`;
  
  let batchGross = 0;
  let batchNet = 0;

  for (const slip of payslips) {
    const contract = await findApplicableContract(slip.employee_id, payrun.period_start, payrun.period_end);
    const wage = contract ? parseFloat(contract.wage) : 0;

    // Delete existing lines
    await sql`DELETE FROM payslip_lines WHERE payslip_id = ${slip.id}`;

    // Calculation Engine
    const ruleValues = { WAGE: wage };
    let gross = 0;
    let deduction = 0;

    for (const rule of rules) {
      let val = 0;

      if (rule.computation_type === 'fixed') {
        val = parseFloat(rule.amount) || 0;
      } else if (rule.computation_type === 'percentage') {
        const baseKey = (rule.percentage_based_on || 'WAGE').toUpperCase();
        const baseVal = ruleValues[baseKey] || (baseKey === 'WAGE' ? wage : 0);
        val = baseVal * (parseFloat(rule.percentage) / 100);
      } else if (rule.computation_type === 'formula') {
        // Safe evaluation of simple standard formula expressions e.g. "BASIC + HRA + SPECIAL_ALLOW" or "GROSS - PF - PT"
        const expr = rule.formula_expression || '';
        if (expr.includes('BASIC + HRA + SPECIAL_ALLOW') || rule.category === 'gross') {
          val = (ruleValues['BASIC'] || 0) + (ruleValues['HRA'] || 0) + (ruleValues['SPECIAL_ALLOW'] || 0);
        } else if (expr.includes('GROSS - PF - PT') || rule.category === 'net') {
          val = (ruleValues['GROSS'] || 0) - (ruleValues['PF'] || 0) - (ruleValues['PT'] || 0);
        } else {
          val = (ruleValues['BASIC'] || 0);
        }
      }

      val = parseFloat(val.toFixed(2));
      ruleValues[rule.code.toUpperCase()] = val;

      if (rule.category === 'gross') gross = val;
      if (rule.category === 'deduction') deduction += val;

      // Save line item
      await sql`
        INSERT INTO payslip_lines (payslip_id, salary_rule_id, rule_code, rule_name, category, sequence, amount)
        VALUES (${slip.id}, ${rule.id}, ${rule.code}, ${rule.name}, ${rule.category}, ${rule.sequence}, ${val})
      `;
    }

    const net = Math.max(0, gross - deduction);

    batchGross += gross;
    batchNet += net;

    // Update payslip record
    await sql`
      UPDATE payslips SET
        gross_amount = ${gross},
        deduction_amount = ${deduction},
        net_amount = ${net},
        status = 'Generated'
      WHERE id = ${slip.id}
    `;
  }

  // Update Payrun to Computed
  const [updatedPayrun] = await sql`
    UPDATE payruns SET
      status = 'Computed',
      total_gross = ${batchGross},
      total_net = ${batchNet}
    WHERE id = ${payrunId}
    RETURNING *
  `;

  return updatedPayrun;
}

async function validatePayrun(payrunId) {
  const warnings = [];
  const payslips = await sql`
    SELECT p.*, e.first_name, e.last_name, e.bank_name, e.account_number, e.emp_id
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.payrun_id = ${payrunId}
  `;

  for (const p of payslips) {
    if (!p.bank_name || !p.account_number) {
      warnings.push({
        type: 'MISSING_BANK',
        employee_id: p.employee_id,
        message: `${p.first_name} ${p.last_name} (${p.emp_id}) is missing bank details.`
      });
    }

    if (!p.contract_id) {
      warnings.push({
        type: 'MISSING_CONTRACT',
        employee_id: p.employee_id,
        message: `${p.first_name} ${p.last_name} (${p.emp_id}) has no active contract for this period.`
      });
    }

    // Check missing checkout in period
    const missingCheckouts = await sql`
      SELECT count(*)::int as count FROM attendance
      WHERE employee_id = ${p.employee_id}
        AND date >= ${p.period_start} AND date <= ${p.period_end}
        AND status = 'Missing Checkout'
    `;
    if (missingCheckouts[0].count > 0) {
      warnings.push({
        type: 'ATTENDANCE_EXCEPTION',
        employee_id: p.employee_id,
        message: `${p.first_name} ${p.last_name} (${p.emp_id}) has ${missingCheckouts[0].count} missing attendance check-out(s).`
      });
    }
  }

  return warnings;
}

async function updatePayrunStatus(payrunId, status) {
  const [updated] = await sql`
    UPDATE payruns SET status = ${status} WHERE id = ${payrunId} RETURNING *
  `;
  if (status === 'Paid') {
    await sql`UPDATE payslips SET status = 'Generated' WHERE payrun_id = ${payrunId}`;
  }
  return updated;
}

module.exports = { getEligibleEmployees, getPayruns, getPayrunById, createPayrun, computePayrun, validatePayrun, updatePayrunStatus };
