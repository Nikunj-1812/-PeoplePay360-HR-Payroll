const { sql } = require('../db');

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

async function createSalaryStructure(data) {
  const { name, description } = data;
  const [struct] = await sql`
    INSERT INTO salary_structures (name, description, is_active)
    VALUES (${name}, ${description || ''}, true)
    RETURNING *
  `;
  return struct;
}

async function getSalaryRules(structureId) {
  return await sql`
    SELECT * FROM salary_rules
    WHERE salary_structure_id = ${structureId}
    ORDER BY sequence ASC
  `;
}

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

module.exports = { getSalaryStructures, getSalaryStructureById, createSalaryStructure, getSalaryRules, createSalaryRule };
