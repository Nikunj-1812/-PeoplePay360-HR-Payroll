const path = require('node:path');
const dotenv = require('dotenv');
const { neon, neonConfig } = require('@neondatabase/serverless');

// Load environment variables cleanly from root and backend .env files
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rawDbUrl = (process.env.DATABASE_URL || '').trim();

if (!rawDbUrl) {
  console.error('[DB Critical Error]: DATABASE_URL environment variable is missing.');
}

// Normalize DATABASE_URL for max compatibility with Neon serverless endpoint
let normalizedUrl = rawDbUrl;
if (normalizedUrl) {
  normalizedUrl = normalizedUrl
    .replace('-pooler.', '.')
    .replace(/([&?])channel_binding=[^&]*&?/, '$1')
    .replace(/[?&]$/, '');
}

// Use native fetch with default endpoint binding
const neonSql = rawDbUrl ? neon(normalizedUrl) : null;

// Safe execution helper with exponential backoff & timeout to prevent hanging requests
async function executeWithRetry(fn, retries = 3, timeoutMs = 12000) {
  for (let i = 0; i < retries; i++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          const err = new Error('Database query execution timed out.');
          err.code = 'ETIMEDOUT';
          reject(err);
        }, timeoutMs);
        if (timer.unref) timer.unref();
      });

      return await Promise.race([fn(), timeoutPromise]);
    } catch (err) {
      console.warn(`[DB Query Retry ${i + 1}/${retries}]:`, err.message || err);
      if (i === retries - 1) {
        // Normalize error message for client safety
        const sanitizedErr = new Error('Database temporarily unavailable. Please try again.');
        sanitizedErr.status = 503;
        sanitizedErr.originalCode = err.code || err.errno;
        throw sanitizedErr;
      }
      await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, i)));
    }
  }
}

// Export sql template function
const sql = (strings, ...values) => {
  if (!neonSql) {
    const err = new Error('Database connection not configured.');
    err.status = 503;
    throw err;
  }
  return executeWithRetry(() => neonSql(strings, ...values));
};

sql.unsafe = async (queryStr) => {
  if (!neonSql) {
    const err = new Error('Database connection not configured.');
    err.status = 503;
    throw err;
  }
  return executeWithRetry(() => neonSql.transaction([neonSql(queryStr)]).then(res => res[0]));
};

module.exports = { sql, normalizedUrl };
