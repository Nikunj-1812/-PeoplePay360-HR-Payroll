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
    LIMIT 1
  `;
  return contracts.length > 0 ? contracts[0] : null;
}

async function createContract(data) {
  const { contract_number, employee_id, start_date, end_date, wage, salary_structure_id, department_id, position, employment_terms, status = 'Active' } = data;

  // Auto-expire existing active contracts for the same employee to prevent concurrent active contracts
  if (status === 'Active') {
    const prevContracts = await sql`
      SELECT id, start_date FROM contracts 
      WHERE employee_id = ${employee_id} AND status = 'Active'
    `;
    
    for (const prev of prevContracts) {
      // Calculate end date as one day prior to new contract start date if possible
      const newStart = new Date(start_date);
      const prevEnd = new Date(newStart.getTime() - 86400000).toISOString().split('T')[0];
      await sql`
        UPDATE contracts 
        SET status = 'Expired', end_date = COALESCE(end_date, ${prevEnd})
        WHERE id = ${prev.id}
      `;
    }
  }

  const [contract] = await sql`
    INSERT INTO contracts
      (contract_number, employee_id, start_date, end_date, wage, salary_structure_id, department_id, position, status, employment_terms)
    VALUES
      (${contract_number}, ${employee_id}, ${start_date}, ${end_date || null}, ${wage}, ${salary_structure_id || null}, ${department_id || null}, ${position}, ${status}, ${employment_terms || ''})
    RETURNING *
  `;

  try {
    await notificationService.notifyEmployeeUser(employee_id, {
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
  const { start_date, end_date, wage, salary_structure_id, department_id, position, status, employment_terms } = data;
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
    WHERE id = ${id}
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

module.exports = { getContracts, findApplicableContract, createContract, updateContract, deleteContract };
