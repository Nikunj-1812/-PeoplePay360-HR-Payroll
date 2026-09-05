const { sql } = require('../db');
const { findApplicableContract } = require('./contractService');

async function getEligibleEmployees(salaryStructureId, periodStart, periodEnd) {
  const cleanStructId = salaryStructureId && !isNaN(salaryStructureId) ? parseInt(salaryStructureId, 10) : null;
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
      AND (${cleanStructId}::int IS NULL OR c.salary_structure_id = ${cleanStructId})
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

  // 2. Fetch all active contracts for selected employees in a single batch query
  const cleanEmpIds = employee_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  const contracts = await sql`
    SELECT id, employee_id
    FROM contracts
    WHERE employee_id = ANY(${cleanEmpIds})
      AND status = 'Active'
      AND start_date <= ${period_end}
      AND (end_date IS NULL OR end_date >= ${period_start})
  `;

  const contractMap = new Map();
  for (const c of contracts) {
    if (!contractMap.has(c.employee_id)) {
      contractMap.set(c.employee_id, c.id);
    }
  }

  // 3. Batch insert draft payslips in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < cleanEmpIds.length; i += chunkSize) {
    const chunk = cleanEmpIds.slice(i, i + chunkSize);
    await Promise.all(chunk.map(empId => {
      const contractId = contractMap.get(empId) || null;
      return sql`
        INSERT INTO payslips (payrun_id, employee_id, contract_id, period_start, period_end, status)
        VALUES (${payrun.id}, ${empId}, ${contractId}, ${period_start}, ${period_end}, 'Draft')
      `;
    }));
  }

  return payrun;
}

async function computePayrun(payrunId) {
  // Update state to Computing
  await sql`UPDATE payruns SET status = 'Computing' WHERE id = ${payrunId}`;

  const payruns = await sql`SELECT * FROM payruns WHERE id = ${payrunId}`;
  if (payruns.length === 0) throw new Error('Payrun not found');
  const payrun = payruns[0];

  // Get ordered salary rules for structure
  const rules = await sql`
    SELECT * FROM salary_rules
    WHERE salary_structure_id = ${payrun.salary_structure_id} AND is_active = true
    ORDER BY sequence ASC
  `;

  const payslips = await sql`
    SELECT p.id, p.employee_id, c.wage
    FROM payslips p
    LEFT JOIN contracts c ON (
      c.employee_id = p.employee_id 
      AND c.status = 'Active' 
      AND c.start_date <= ${payrun.period_end} 
      AND (c.end_date IS NULL OR c.end_date >= ${payrun.period_start})
    )
    WHERE p.payrun_id = ${payrunId}
  `;

  // Clear existing lines in one batch query
  await sql`
    DELETE FROM payslip_lines 
    WHERE payslip_id IN (SELECT id FROM payslips WHERE payrun_id = ${payrunId})
  `;

  let batchGross = 0;
  let batchNet = 0;
  const lineInserts = [];
  const payslipUpdates = [];

  for (const slip of payslips) {
    const wage = slip.wage ? parseFloat(slip.wage) : 0;
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

      lineInserts.push({
        payslip_id: slip.id,
        salary_rule_id: rule.id,
        rule_code: rule.code,
        rule_name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        amount: val
      });
    }

    const net = Math.max(0, gross - deduction);
    batchGross += gross;
    batchNet += net;

    payslipUpdates.push({
      id: slip.id,
      gross,
      deduction,
      net
    });
  }

  // Insert lines in parallel chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < lineInserts.length; i += chunkSize) {
    const chunk = lineInserts.slice(i, i + chunkSize);
    await Promise.all(chunk.map(item => sql`
      INSERT INTO payslip_lines (payslip_id, salary_rule_id, rule_code, rule_name, category, sequence, amount)
      VALUES (${item.payslip_id}, ${item.salary_rule_id}, ${item.rule_code}, ${item.rule_name}, ${item.category}, ${item.sequence}, ${item.amount})
    `));
  }

  // Update payslips in parallel chunks of 50
  for (let i = 0; i < payslipUpdates.length; i += chunkSize) {
    const chunk = payslipUpdates.slice(i, i + chunkSize);
    await Promise.all(chunk.map(item => sql`
      UPDATE payslips SET
        gross_amount = ${item.gross},
        deduction_amount = ${item.deduction},
        net_amount = ${item.net},
        status = 'Generated'
      WHERE id = ${item.id}
    `));
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

  if (payslips.length === 0) return warnings;

  const periodStart = payslips[0].period_start;
  const periodEnd = payslips[0].period_end;

  const attendanceExceptions = await sql`
    SELECT employee_id, count(*)::int as count
    FROM attendance
    WHERE date >= ${periodStart} AND date <= ${periodEnd}
      AND status = 'Missing Checkout'
    GROUP BY employee_id
  `;
  const exceptionMap = new Map();
  for (const a of attendanceExceptions) {
    exceptionMap.set(a.employee_id, a.count);
  }

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

    const excCount = exceptionMap.get(p.employee_id) || 0;
    if (excCount > 0) {
      warnings.push({
        type: 'ATTENDANCE_EXCEPTION',
        employee_id: p.employee_id,
        message: `${p.first_name} ${p.last_name} (${p.emp_id}) has ${excCount} missing attendance check-out(s).`
      });
    }
  }

  return warnings;
}

const notificationService = require('./notificationService');

async function updatePayrunStatus(payrunId, status) {
  const [updated] = await sql`
    UPDATE payruns SET status = ${status} WHERE id = ${payrunId} RETURNING *
  `;
  if (status === 'Paid') {
    await sql`UPDATE payslips SET status = 'Generated' WHERE payrun_id = ${payrunId}`;

    try {
      const slips = await sql`SELECT employee_id, net_amount FROM payslips WHERE payrun_id = ${payrunId}`;
      const chunkSize = 50;
      for (let i = 0; i < slips.length; i += chunkSize) {
        const chunk = slips.slice(i, i + chunkSize);
        await Promise.all(chunk.map(slip => notificationService.notifyEmployeeUser(slip.employee_id, {
          title: 'Payslip Dispatched & Paid',
          message: `Your net salary of ₹${parseFloat(slip.net_amount || 0).toLocaleString()} for payrun "${updated.name}" is processed!`,
          type: 'payroll',
          link_tab: 'payroll'
        })));
      }

      await notificationService.notifyRoles(['admin', 'hr_manager', 'hr_payroll_manager'], {
        title: 'Payrun Finalized & Paid',
        message: `Payrun "${updated.name}" was finalized. Total Net Paid: ₹${parseFloat(updated.total_net || 0).toLocaleString()}.`,
        type: 'payroll',
        link_tab: 'payroll'
      });
    } catch (err) {
      console.error('Payroll notification error:', err);
    }
  }
  return updated;
}

async function deletePayrun(id) {
  const cleanId = parseInt(id, 10);
  await sql`DELETE FROM payslip_lines WHERE payslip_id IN (SELECT id FROM payslips WHERE payrun_id = ${cleanId})`;
  await sql`DELETE FROM payslips WHERE payrun_id = ${cleanId}`;
  const [deleted] = await sql`DELETE FROM payruns WHERE id = ${cleanId} RETURNING *`;
  return deleted;
}

module.exports = { getEligibleEmployees, getPayruns, getPayrunById, createPayrun, computePayrun, validatePayrun, updatePayrunStatus, deletePayrun };
