const { sql } = require('../db');
const notificationService = require('./notificationService');

async function getContracts(employeeId = null) {
  const cleanEmpId = employeeId && !isNaN(employeeId) ? parseInt(employeeId, 10) : null;
  return await sql`
    SELECT 
      c.*,
      e.first_name || ' ' || e.last_name as employee_name,
      e.emp_id,
      d.name as department_name,
      ss.name as salary_structure_name
    FROM contracts c
    JOIN employees e ON c.employee_id = e.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
    WHERE (${cleanEmpId}::int IS NULL OR c.employee_id = ${cleanEmpId})
    ORDER BY c.id DESC
  `;
}

async function findApplicableContract(employeeId, periodStart, periodEnd) {
  const contracts = await sql`
    SELECT c.*, ss.name as salary_structure_name
    FROM contracts c
    LEFT JOIN salary_structures ss ON c.salary_structure_id = ss.id
    WHERE c.employee_id = ${employeeId}
      AND c.start_date <= ${periodEnd}
      AND (c.end_date IS NULL OR c.end_date >= ${periodStart})
    ORDER BY c.start_date DESC
  `;

  if (contracts.length === 0) return null;
  if (contracts.length === 1) return contracts[0];

  // Check if multiple contracts overlap with each other in the given period
  for (let i = 0; i < contracts.length; i++) {
    for (let j = i + 1; j < contracts.length; j++) {
      const c1 = contracts[i];
      const c2 = contracts[j];
      const start1 = new Date(c1.start_date).getTime();
      const end1 = c1.end_date ? new Date(c1.end_date).getTime() : Infinity;
      const start2 = new Date(c2.start_date).getTime();
      const end2 = c2.end_date ? new Date(c2.end_date).getTime() : Infinity;

      // Overlap condition
      if (start1 <= end2 && start2 <= end1) {
        const err = new Error(
          `Ambiguous contract error: Multiple overlapping contracts detected for employee ID ${employeeId} during payroll period ${periodStart} to ${periodEnd} (Contract #${c1.contract_number} and Contract #${c2.contract_number}).`
        );
        err.status = 400;
        err.code = 'AMBIGUOUS_CONTRACT';
        throw err;
      }
    }
  }

  // Non-overlapping consecutive contracts in period: return contract active at the end of the period
  return contracts[0];
}

/**
 * Validates date ranges and checks for contract overlaps
 */
async function validateContractDates(employeeId, startDate, endDate, status, currentContractId = null) {
  if (!startDate) {
    const err = new Error('Contract start date is required.');
    err.status = 400;
    throw err;
  }

  if (endDate && new Date(endDate) < new Date(startDate)) {
    const err = new Error(`Contract start date (${startDate}) cannot be after end date (${endDate}).`);
    err.status = 400;
    throw err;
  }

  if (status === 'Active') {
    const cleanId = currentContractId ? parseInt(currentContractId, 10) : null;
    const existingActive = await sql`
      SELECT id, contract_number, start_date, end_date
      FROM contracts
      WHERE employee_id = ${employeeId}
        AND status = 'Active'
        AND (${cleanId}::int IS NULL OR id != ${cleanId})
        AND start_date <= COALESCE(${endDate || null}::date, '9999-12-31'::date)
        AND (end_date IS NULL OR end_date >= ${startDate}::date)
    `;

    if (existingActive.length > 0) {
      const conflict = existingActive[0];
      const conflictStart = conflict.start_date ? new Date(conflict.start_date).toISOString().split('T')[0] : conflict.start_date;
      const conflictEnd = conflict.end_date ? new Date(conflict.end_date).toISOString().split('T')[0] : 'Present';
      const err = new Error(`Overlapping active contract detected. Contract #${conflict.contract_number} (${conflictStart} to ${conflictEnd}) overlaps with the specified period.`);
      err.status = 400;
      throw err;
    }
  }
}

async function createContract(data) {
  const { contract_number, employee_id, start_date, end_date, wage, salary_structure_id, department_id, position, employment_terms, status = 'Active' } = data;

  const cleanEmpId = parseInt(employee_id, 10);
  if (!cleanEmpId || isNaN(cleanEmpId)) {
    const err = new Error('Valid employee ID required for contract.');
    err.status = 400;
    throw err;
  }

  // Validate start/end dates and check for overlapping active contracts
  await validateContractDates(cleanEmpId, start_date, end_date, status);

  const [contract] = await sql`
    INSERT INTO contracts
      (contract_number, employee_id, start_date, end_date, wage, salary_structure_id, department_id, position, status, employment_terms)
    VALUES
      (${contract_number}, ${cleanEmpId}, ${start_date}, ${end_date || null}, ${wage}, ${salary_structure_id || null}, ${department_id || null}, ${position}, ${status}, ${employment_terms || ''})
    RETURNING *
  `;

  try {
    await notificationService.notifyEmployeeUser(cleanEmpId, {
      title: 'New Contract Assigned',
      message: `Contract #${contract_number} (${position}) has been created for you with wage ₹${parseFloat(wage || 0).toLocaleString()}/mo.`,
      type: 'contract',
      link_tab: 'contracts'
    });
  } catch (err) {
    console.error('Contract notification error:', err);
  }

  return contract;
}

async function updateContract(id, data) {
  const cleanId = parseInt(id, 10);
  const existingContracts = await sql`SELECT * FROM contracts WHERE id = ${cleanId}`;
  if (existingContracts.length === 0) throw new Error('Contract not found');
  const existing = existingContracts[0];

  const {
    start_date = existing.start_date,
    end_date = existing.end_date,
    wage = existing.wage,
    salary_structure_id = existing.salary_structure_id,
    department_id = existing.department_id,
    position = existing.position,
    status = existing.status,
    employment_terms = existing.employment_terms
  } = data;

  // Validate start/end dates and check for overlapping active contracts
  await validateContractDates(existing.employee_id, start_date, end_date, status, cleanId);

  const [updated] = await sql`
    UPDATE contracts SET
      start_date = ${start_date},
      end_date = ${end_date || null},
      wage = ${wage},
      salary_structure_id = ${salary_structure_id || null},
      department_id = ${department_id || null},
      position = ${position},
      status = ${status},
      employment_terms = ${employment_terms}
    WHERE id = ${cleanId}
    RETURNING *
  `;

  try {
    if (updated) {
      await notificationService.notifyEmployeeUser(updated.employee_id, {
        title: 'Contract Terms Updated',
        message: `Your contract #${updated.contract_number} terms have been updated by HR.`,
        type: 'contract',
        link_tab: 'contracts'
      });
    }
  } catch (err) {
    console.error('Contract notification error:', err);
  }

  return updated;
}

async function deleteContract(id) {
  const cleanId = parseInt(id, 10);
  const [deleted] = await sql`DELETE FROM contracts WHERE id = ${cleanId} RETURNING *`;
  return deleted;
}

module.exports = { getContracts, findApplicableContract, createContract, updateContract, deleteContract, validateContractDates };
