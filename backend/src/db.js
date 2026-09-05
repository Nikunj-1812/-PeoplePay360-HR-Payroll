const path = require('node:path');
const dns = require('node:dns');
const dotenv = require('dotenv');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { neon } = require('@neondatabase/serverless');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let sql;

if (process.env.DATABASE_URL) {
  const neonSql = neon(process.env.DATABASE_URL);
  
  const executeWithRetry = async (fn, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 300 * (i + 1)));
      }
    }
  };

  sql = (strings, ...values) => executeWithRetry(() => neonSql(strings, ...values));
  sql.unsafe = async (queryStr) => executeWithRetry(() => neonSql.transaction([neonSql(queryStr)]).then(res => res[0]));
} else {
  console.log('[DB] DATABASE_URL not detected. Using high-performance in-memory database engine for local demo/testing.');

  // In-memory tables data structure
  const tables = {};
  const autoIncrements = {};

  const executeMockQuery = async (queryText, params = []) => {
    const cleanText = queryText.trim().replace(/\s+/g, ' ');
    const lower = cleanText.toLowerCase();

    // 1. Health check SELECT NOW()
    if (lower.startsWith('select now()') || lower.includes('select 1 as connected')) {
      return [{ connected_at: new Date().toISOString(), connected: 1 }];
    }

    // 2. CREATE TABLE
    if (lower.startsWith('create table')) {
      const match = cleanText.match(/create table (?:if not exists )?([a-z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (!tables[tableName]) {
          tables[tableName] = [];
          autoIncrements[tableName] = 1;
        }
      }
      return [];
    }

    // 3. ALTER TABLE
    if (lower.startsWith('alter table')) {
      return [];
    }

    // 4. COUNT(*)
    if (lower.startsWith('select count(*)')) {
      const match = cleanText.match(/from ([a-z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const rows = tables[tableName] || [];
        return [{ count: rows.length }];
      }
      return [{ count: 0 }];
    }

    // 5. INSERT INTO
    if (lower.startsWith('insert into')) {
      const match = cleanText.match(/insert into ([a-z0-9_]+) \(([^)]+)\)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const columns = match[2].split(',').map(c => c.trim().toLowerCase());
        if (!tables[tableName]) {
          tables[tableName] = [];
          autoIncrements[tableName] = 1;
        }

        const insertedRows = [];

        // Parse values clause if string literals are present
        const valuesIndex = lower.indexOf('values');
        const returningIndex = lower.indexOf('returning');
        const valuesPart = valuesIndex !== -1 
          ? cleanText.substring(valuesIndex + 6, returningIndex !== -1 ? returningIndex : undefined)
          : '';

        // Extract value tuples like ('Engineering', 'ENG'), ('Human Resources', 'HR')
        const tupleMatches = [...valuesPart.matchAll(/\(([^)]+)\)/g)];

        if (tupleMatches.length > 0) {
          let paramIdx = 0;
          for (const tuple of tupleMatches) {
            const rawVals = tuple[1].split(',').map(v => v.trim());
            const newRow = { id: autoIncrements[tableName]++ };
            columns.forEach((col, idx) => {
              const valStr = rawVals[idx];
              if (valStr && valStr.startsWith('$')) {
                newRow[col] = params[paramIdx++] !== undefined ? params[paramIdx - 1] : null;
              } else if (valStr && (valStr.startsWith("'") || valStr.startsWith('"'))) {
                newRow[col] = valStr.slice(1, -1);
              } else if (valStr && !isNaN(valStr)) {
                newRow[col] = Number(valStr);
              } else if (valStr === 'true') {
                newRow[col] = true;
              } else if (valStr === 'false') {
                newRow[col] = false;
              } else {
                newRow[col] = params[paramIdx++] !== undefined ? params[paramIdx - 1] : null;
              }
            });
            if (!newRow.created_at) newRow.created_at = new Date().toISOString();
            tables[tableName].push(newRow);
            insertedRows.push(newRow);
          }
        } else {
          // Single row with params
          const newRow = { id: autoIncrements[tableName]++ };
          columns.forEach((col, idx) => {
            newRow[col] = params[idx] !== undefined ? params[idx] : null;
          });
          if (!newRow.created_at) newRow.created_at = new Date().toISOString();
          tables[tableName].push(newRow);
          insertedRows.push(newRow);
        }

        return insertedRows;
      }
      return [];
    }

    // 6. DELETE FROM
    if (lower.startsWith('delete from')) {
      const match = cleanText.match(/delete from ([a-z0-9_]+)(?: where (.*))?/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (tables[tableName]) {
          if (params.length > 0) {
            tables[tableName] = tables[tableName].filter(row => {
              if (params[0] && typeof params[0] === 'string' && row.email) {
                return row.email !== params[0];
              }
              return true;
            });
          } else {
            tables[tableName] = [];
          }
        }
      }
      return [];
    }

    // 7. UPDATE
    if (lower.startsWith('update')) {
      const match = cleanText.match(/update ([a-z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const rows = tables[tableName] || [];
        if (rows.length > 0 && params.length > 0) {
          // General state updates
          rows.forEach(r => {
            if (params[0] !== undefined) r.status = params[0];
          });
          return rows;
        }
      }
      return [];
    }

    // 8. General SELECT
    if (lower.startsWith('select')) {
      const match = cleanText.match(/from ([a-z0-9_]+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        let rows = tables[tableName] ? [...tables[tableName]] : [];

        // Simple filtering by ID/email if params passed
        if (params.length > 0) {
          if (typeof params[0] === 'number') {
            rows = rows.filter(r => r.id === params[0]);
          } else if (typeof params[0] === 'string') {
            rows = rows.filter(r => r.email === params[0] || r.emp_id === params[0] || r.code === params[0]);
          }
        }

        if (lower.includes('limit 1') && rows.length > 0) {
          return [rows[0]];
        }
        return rows;
      }
      return [];
    }

    return [];
  };

  sql = async (strings, ...values) => {
    let queryText = '';
    if (typeof strings === 'string') {
      queryText = strings;
    } else if (Array.isArray(strings)) {
      queryText = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
    }
    return await executeMockQuery(queryText, values);
  };

  sql.unsafe = async (queryText) => {
    return await executeMockQuery(queryText, []);
  };
}

module.exports = { sql };
