const { sql } = require('../db');

// Get all salary structures
async function getSalaryStructures() {
  return await sql`
    SELECT 
      ss.*,
      (SELECT COUNT(*)::int FROM salary_rules sr WHERE sr.salary_structure_id = ss.id) as rule_count,
      (SELECT COUNT(*)::int FROM contracts c WHERE c.salary_structure_id = ss.id AND c.status = 'Active') as active_employee_count
    FROM salary_structures ss
    ORDER BY ss.id ASC
  `;
}

// Get salary structure by ID with ordered rules
async function getSalaryStructureById(id) {
  const structs = await sql`SELECT * FROM salary_structures WHERE id = ${id}`;
  if (structs.length === 0) throw new Error('Salary structure not found');

  const rules = await sql`
    SELECT * FROM salary_rules
    WHERE salary_structure_id = ${id}
    ORDER BY sequence ASC
  `;

  return {
    ...structs[0],
    rules
  };
}

// Create salary structure
async function createSalaryStructure(data) {
  const { name, description } = data;
  const [struct] = await sql`
    INSERT INTO salary_structures (name, description, is_active)
    VALUES (${name}, ${description || ''}, true)
    RETURNING *
  `;
  return struct;
}

// Update salary structure
async function updateSalaryStructure(id, data) {
  const { name, description, is_active } = data;
  const [updated] = await sql`
    UPDATE salary_structures SET
      name = ${name},
      description = ${description || ''},
      is_active = ${is_active !== false}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete salary structure
async function deleteSalaryStructure(id) {
  await sql`DELETE FROM salary_rules WHERE salary_structure_id = ${id}`;
  const [deleted] = await sql`DELETE FROM salary_structures WHERE id = ${id} RETURNING *`;
  return deleted;
}

// Get salary rules
async function getSalaryRules(structureId) {
  return await sql`
    SELECT * FROM salary_rules
    WHERE (${structureId ? parseInt(structureId, 10) : null}::int IS NULL OR salary_structure_id = ${structureId ? parseInt(structureId, 10) : null})
    ORDER BY sequence ASC
  `;
}

// Create salary rule
async function createSalaryRule(data) {
  const { salary_structure_id, name, code, category, sequence, computation_type, amount, percentage, percentage_based_on, formula_expression } = data;

  const [rule] = await sql`
    INSERT INTO salary_rules (
      salary_structure_id, name, code, category, sequence, computation_type, amount, percentage, percentage_based_on, formula_expression, is_active
    ) VALUES (
      ${salary_structure_id}, ${name}, ${code.toUpperCase()}, ${category}, ${sequence || 10}, ${computation_type || 'fixed'}, ${amount || 0}, ${percentage || 0}, ${percentage_based_on || ''}, ${formula_expression || ''}, true
    )
    RETURNING *
  `;
  return rule;
}

// Update salary rule
async function updateSalaryRule(id, data) {
  const { name, code, category, sequence, computation_type, amount, percentage, percentage_based_on, formula_expression, is_active } = data;

  const [updated] = await sql`
    UPDATE salary_rules SET
      name = ${name},
      code = ${code.toUpperCase()},
      category = ${category},
      sequence = ${sequence || 10},
      computation_type = ${computation_type || 'fixed'},
      amount = ${amount || 0},
      percentage = ${percentage || 0},
      percentage_based_on = ${percentage_based_on || ''},
      formula_expression = ${formula_expression || ''},
      is_active = ${is_active !== false}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated;
}

// Delete salary rule
async function deleteSalaryRule(id) {
  const [deleted] = await sql`DELETE FROM salary_rules WHERE id = ${id} RETURNING *`;
  return deleted;
}

// Reorder salary rules sequence
async function reorderSalaryRules(rules) {
  if (!Array.isArray(rules)) return [];
  for (const item of rules) {
    if (item.id && item.sequence !== undefined) {
      await sql`UPDATE salary_rules SET sequence = ${item.sequence} WHERE id = ${item.id}`;
    }
  }
  return { success: true };
}

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
  getSalaryRules,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  reorderSalaryRules
};
