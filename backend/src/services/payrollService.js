const { sql } = require('../db');
const { findApplicableContract } = require('./contractService');

/**
 * Custom math evaluator for formula expressions (no eval)
 */
function safeMathEval(exprStr, originalExpr) {
  const tokens = exprStr.trim().split(/\s+/).filter(Boolean);
  const outputQueue = [];
  const operatorStack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const token of tokens) {
    if (!isNaN(token)) {
      outputQueue.push(parseFloat(token));
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] in precedence &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop());
      }
      if (operatorStack.length === 0) {
        throw new Error(`Mismatched parentheses in formula '${originalExpr}'`);
      }
      operatorStack.pop();
    } else {
      throw new Error(`Invalid token '${token}' in formula '${originalExpr}'`);
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op === '(' || op === ')') {
      throw new Error(`Mismatched parentheses in formula '${originalExpr}'`);
    }
    outputQueue.push(op);
  }

  const stack = [];
  for (const token of outputQueue) {
    if (typeof token === 'number') {
      stack.push(token);
    } else {
      if (stack.length < 2) {
        throw new Error(`Invalid arithmetic expression in formula '${originalExpr}'`);
      }
      const b = stack.pop();
      const a = stack.pop();
      let res = 0;
      if (token === '+') res = a + b;
      else if (token === '-') res = a - b;
      else if (token === '*') res = a * b;
      else if (token === '/') {
        res = b === 0 ? 0 : a / b;
      }
      stack.push(res);
    }
  }

  if (stack.length !== 1) {
    throw new Error(`Invalid formula expression '${originalExpr}'`);
  }
  return stack[0];
}

/**
 * Safely evaluates a rule formula expression using resolved variables map
 */
function evaluateRuleExpression(expr, variables) {
  if (!expr || typeof expr !== 'string' || !expr.trim()) return 0;
  const rawTokens = expr.toUpperCase().match(/([A-Z_][A-Z0-9_]*|\d+(?:\.\d+)?|[+\-*/()])/g);
  if (!rawTokens || rawTokens.length === 0) {
    throw new Error(`Empty or invalid formula expression '${expr}'`);
  }

  let exprStr = '';
  for (const token of rawTokens) {
    if (/^[A-Z_][A-Z0-9_]*$/.test(token)) {
      if (token in variables) {
        exprStr += ` ${variables[token]} `;
      } else {
        throw new Error(`Unknown variable '${token}' referenced in formula '${expr}'`);
      }
    } else {
      exprStr += ` ${token} `;
    }
  }

  return safeMathEval(exprStr, expr);
}

/**
 * Topologically sorts salary rules according to dependencies & detects circular dependencies
 */
function sortRulesTopologically(rules) {
  const ruleMap = new Map();
  const baseVars = new Set(['WAGE', 'WORKED_DAYS', 'WORKED_HOURS']);

  for (const rule of rules) {
    ruleMap.set(rule.code.toUpperCase(), rule);
  }

  const deps = new Map();
  for (const rule of rules) {
    const code = rule.code.toUpperCase();
    const ruleDeps = new Set();

    if (rule.computation_type === 'percentage') {
      const baseKey = (rule.percentage_based_on || 'WAGE').trim().toUpperCase();
      if (!baseVars.has(baseKey)) {
        if (!ruleMap.has(baseKey)) {
          throw new Error(`Rule '${code}' depends on unknown variable/rule '${baseKey}'`);
        }
        ruleDeps.add(baseKey);
      }
    } else if (rule.computation_type === 'formula') {
      const expr = (rule.formula_expression || rule.percentage_based_on || '').trim();
      const tokens = expr.toUpperCase().match(/[A-Z_][A-Z0-9_]*/g) || [];
      for (const tok of tokens) {
        if (!baseVars.has(tok)) {
          if (!ruleMap.has(tok)) {
            throw new Error(`Formula rule '${code}' depends on unknown variable/rule '${tok}'`);
          }
          ruleDeps.add(tok);
        }
      }
    }

    deps.set(code, ruleDeps);
  }

  const sorted = [];
  const visited = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited

  function visit(code, chain = []) {
    const state = visited.get(code) || 0;
    if (state === 1) {
      const cyclePath = [...chain, code].join(' -> ');
      throw new Error(`Circular dependency detected in salary rules: ${cyclePath}`);
    }
    if (state === 0) {
      visited.set(code, 1);
      const ruleDeps = deps.get(code) || new Set();
      for (const depCode of ruleDeps) {
        visit(depCode, [...chain, code]);
      }
      visited.set(code, 2);
      sorted.push(ruleMap.get(code));
    }
  }

  for (const rule of rules) {
    const code = rule.code.toUpperCase();
    if ((visited.get(code) || 0) === 0) {
      visit(code);
    }
  }

  return sorted;
}

async function getEligibleEmployees(salaryStructureId, periodStart, periodEnd) {
  const cleanStructId = salaryStructureId && !isNaN(salaryStructureId) ? parseInt(salaryStructureId, 10) : null;
  const employees = await sql`
    SELECT DISTINCT ON (e.id)
      e.id, e.emp_id, e.first_name, e.last_name, e.email, e.job_position, e.bank_name, e.account_number,
      d.name as department_name,
      c.id as contract_id, c.wage, c.contract_number
    FROM employees e
    LEFT JOIN contracts c ON c.employee_id = e.id
      AND c.start_date <= ${periodEnd}
      AND (c.end_date IS NULL OR c.end_date >= ${periodStart})
      AND (${cleanStructId}::int IS NULL OR c.salary_structure_id = ${cleanStructId})
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.status = 'Active'
    ORDER BY e.id ASC, c.start_date DESC
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

  // 2. Fetch all valid contracts for selected employees in a single batch query for that period
  const cleanEmpIds = employee_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  const contracts = await sql`
    SELECT DISTINCT ON (employee_id) id, employee_id
    FROM contracts
    WHERE employee_id = ANY(${cleanEmpIds})
      AND salary_structure_id = ${salary_structure_id}
      AND start_date <= ${period_end}
      AND (end_date IS NULL OR end_date >= ${period_start})
    ORDER BY employee_id, start_date DESC
  `;

  const contractMap = new Map();
  for (const c of contracts) {
    if (!contractMap.has(c.employee_id)) {
      contractMap.set(c.employee_id, c.id);
    }
  }

  // 3. Batch insert draft payslips with conflict handling to prevent duplicates
  const chunkSize = 50;
  for (let i = 0; i < cleanEmpIds.length; i += chunkSize) {
    const chunk = cleanEmpIds.slice(i, i + chunkSize);
    await Promise.all(chunk.map(empId => {
      const contractId = contractMap.get(empId) || null;
      return sql`
        INSERT INTO payslips (payrun_id, employee_id, contract_id, period_start, period_end, status)
        VALUES (${payrun.id}, ${empId}, ${contractId}, ${period_start}, ${period_end}, 'Draft')
        ON CONFLICT (payrun_id, employee_id) DO UPDATE SET
          contract_id = EXCLUDED.contract_id,
          period_start = EXCLUDED.period_start,
          period_end = EXCLUDED.period_end,
          status = 'Draft'
      `;
    }));
  }

  return payrun;
}

async function computePayrun(payrunId) {
  // Reset failure reason & set status to Computing
  await sql`UPDATE payruns SET status = 'Computing', failure_reason = NULL WHERE id = ${payrunId}`;

  try {
    const payruns = await sql`SELECT * FROM payruns WHERE id = ${payrunId}`;
    if (payruns.length === 0) throw new Error('Payrun not found');
    const payrun = payruns[0];

    const rawRules = await sql`
      SELECT * FROM salary_rules
      WHERE salary_structure_id = ${payrun.salary_structure_id} AND is_active = true
      ORDER BY sequence ASC
    `;

    if (rawRules.length === 0) {
      throw new Error('Selected Salary Structure has no active salary rules.');
    }

    // Topologically sort rules & detect circular dependencies / syntax issues
    const sortedRules = sortRulesTopologically(rawRules);

    const rawPayslips = await sql`
      SELECT p.id, p.employee_id, p.worked_days
      FROM payslips p
      WHERE p.payrun_id = ${payrunId}
    `;

    if (rawPayslips.length === 0) {
      throw new Error('Payrun has no associated employee payslips to compute.');
    }

    // Parallelize contract resolution across all employees
    const payslips = await Promise.all(rawPayslips.map(async (slip) => {
      const contract = await findApplicableContract(slip.employee_id, payrun.period_start, payrun.period_end);
      if (!contract) {
        throw new Error(`Cannot compute payroll for employee (ID #${slip.employee_id}): No active contract found for period ${payrun.period_start} to ${payrun.period_end}.`);
      }
      const wage = parseFloat(contract.wage || 0);
      if (isNaN(wage) || wage <= 0) {
        throw new Error(`Cannot compute payroll for employee (ID #${slip.employee_id}): Contract wage is zero or invalid (₹${contract.wage}).`);
      }
      return {
        ...slip,
        wage,
        contract_id: contract.id
      };
    }));

    // Clear existing lines for clean re-computation
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
      const workedDays = slip.worked_days ? parseFloat(slip.worked_days) : 30;
      const ruleValues = { WAGE: wage, WORKED_DAYS: workedDays };
      let gross = 0;
      let deduction = 0;

      for (const rule of sortedRules) {
        let val = 0;

        if (rule.computation_type === 'fixed') {
          val = parseFloat(rule.amount) || 0;
        } else if (rule.computation_type === 'percentage') {
          const baseKey = (rule.percentage_based_on || 'WAGE').trim().toUpperCase();
          if (!(baseKey in ruleValues) || ruleValues[baseKey] === undefined || ruleValues[baseKey] === null) {
            throw new Error(`Cannot calculate ${rule.name} (${rule.code}): required base variable '${baseKey}' is unavailable or missing.`);
          }
          const baseVal = ruleValues[baseKey];
          val = baseVal * (parseFloat(rule.percentage) / 100);
        } else if (rule.computation_type === 'formula') {
          const expr = (rule.formula_expression || rule.percentage_based_on || '').trim();
          val = evaluateRuleExpression(expr, ruleValues);
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

      // If gross wasn't explicitly computed by a 'gross' category rule, calculate gross from basic + allowances
      if (gross === 0) {
        for (const r of sortedRules) {
          if (r.category === 'basic' || r.category === 'allowance') {
            gross += (ruleValues[r.code.toUpperCase()] || 0);
          }
        }
        gross = parseFloat(gross.toFixed(2));
      }

      // Edge Case #4 Guard: Gross salary must be > 0 and a valid number
      if (isNaN(gross) || !isFinite(gross) || gross <= 0) {
        throw new Error(`Payslip calculation failed for employee ID ${slip.employee_id}: Gross salary is zero or invalid (₹${gross}). Payslip cannot be finalized.`);
      }

      const net = Math.max(0, parseFloat((gross - deduction).toFixed(2)));
      batchGross += gross;
      batchNet += net;

      payslipUpdates.push({
        id: slip.id,
        contract_id: slip.contract_id,
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
          contract_id = ${item.contract_id},
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
        failure_reason = NULL,
        total_gross = ${parseFloat(batchGross.toFixed(2))},
        total_net = ${parseFloat(batchNet.toFixed(2))}
      WHERE id = ${payrunId}
      RETURNING *
    `;

    return updatedPayrun;

  } catch (err) {
    console.error(`[Payrun Computation Error] Payrun #${payrunId}:`, err.message);

    // Rollback: clear partial lines
    await sql`
      DELETE FROM payslip_lines 
      WHERE payslip_id IN (SELECT id FROM payslips WHERE payrun_id = ${payrunId})
    `;

    // Persist failure status and failure reason
    const failureMsg = err.message || 'Payrun computation failed.';
    await sql`
      UPDATE payruns SET
        status = 'Failed',
        failure_reason = ${failureMsg}
      WHERE id = ${payrunId}
    `;

    const customErr = new Error(`Payrun Computation Failed: ${failureMsg}`);
    customErr.status = 400;
    throw customErr;
  }
}

async function validatePayrun(payrunId) {
  const warnings = [];
  const payslips = await sql`
    SELECT p.*, e.first_name, e.last_name, e.bank_name, e.account_number, e.emp_id
    FROM payslips p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.payrun_id = ${payrunId}
  `;

  if (payslips.length === 0) {
    warnings.push({
      type: 'ZERO_EMPLOYEES',
      employee_id: null,
      message: 'Payrun contains zero employee payslips.'
    });
    return warnings;
  }

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

    try {
      const contract = await findApplicableContract(p.employee_id, periodStart, periodEnd);
      if (!contract) {
        warnings.push({
          type: 'MISSING_CONTRACT',
          employee_id: p.employee_id,
          message: `${p.first_name} ${p.last_name} (${p.emp_id}) has no active contract for this period.`
        });
      }
    } catch (err) {
      warnings.push({
        type: 'AMBIGUOUS_CONTRACT',
        employee_id: p.employee_id,
        message: `${p.first_name} ${p.last_name} (${p.emp_id}): ${err.message}`
      });
    }

    if (p.gross_amount === null || p.gross_amount === undefined || isNaN(parseFloat(p.gross_amount)) || parseFloat(p.gross_amount) <= 0) {
      warnings.push({
        type: 'ZERO_GROSS_SALARY',
        employee_id: p.employee_id,
        message: `${p.first_name} ${p.last_name} (${p.emp_id}) has a zero or invalid gross salary (₹${p.gross_amount || 0}). Payslip cannot be finalized.`
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
  const payruns = await sql`SELECT * FROM payruns WHERE id = ${payrunId}`;
  if (payruns.length === 0) throw new Error('Payrun not found');
  const currentPayrun = payruns[0];

  if (status === 'Validated') {
    if (currentPayrun.status === 'Draft' || currentPayrun.status === 'Failed') {
      const err = new Error('Cannot validate a Draft or Failed payrun. Please compute payroll first.');
      err.status = 400;
      throw err;
    }
    const warnings = await validatePayrun(payrunId);
    const criticalErrors = warnings.filter(w => w.type === 'MISSING_CONTRACT' || w.type === 'AMBIGUOUS_CONTRACT' || w.type === 'ZERO_GROSS_SALARY' || w.type === 'ZERO_EMPLOYEES');
    if (criticalErrors.length > 0) {
      const err = new Error(`Validation failed: ${criticalErrors[0].message}`);
      err.status = 400;
      throw err;
    }
  }

  if (status === 'Paid') {
    if (currentPayrun.status === 'Draft' || currentPayrun.status === 'Failed') {
      const err = new Error('Cannot mark a Draft or Failed payrun as Paid. Please compute and validate payroll first.');
      err.status = 400;
      throw err;
    }
    const warnings = await validatePayrun(payrunId);
    const criticalErrors = warnings.filter(w => w.type === 'MISSING_CONTRACT' || w.type === 'AMBIGUOUS_CONTRACT' || w.type === 'ZERO_GROSS_SALARY' || w.type === 'ZERO_EMPLOYEES');
    if (criticalErrors.length > 0) {
      const err = new Error(`Cannot mark as Paid: ${criticalErrors[0].message}`);
      err.status = 400;
      throw err;
    }
  }

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
          message: `Your net salary of ₹${parseFloat(slip.net_amount || 0).toLocaleString('en-IN')} for payrun "${updated.name}" is processed!`,
          type: 'payroll',
          link_tab: 'payroll'
        })));
      }

      await notificationService.notifyRoles(['admin', 'hr_manager', 'hr_payroll_manager'], {
        title: 'Payrun Finalized & Paid',
        message: `Payrun "${updated.name}" was finalized. Total Net Paid: ₹${parseFloat(updated.total_net || 0).toLocaleString('en-IN')}.`,
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

module.exports = {
  getEligibleEmployees,
  getPayruns,
  getPayrunById,
  createPayrun,
  computePayrun,
  validatePayrun,
  updatePayrunStatus,
  deletePayrun,
  sortRulesTopologically,
  evaluateRuleExpression
};
