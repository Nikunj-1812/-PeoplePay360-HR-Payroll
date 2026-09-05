const path = require('node:path');
const dotenv = require('dotenv');
const { neon } = require('@neondatabase/serverless');

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured in the project environment files.');
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
