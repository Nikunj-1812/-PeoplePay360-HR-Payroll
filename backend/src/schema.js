const { sql } = require('./db');

async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const [testUser] = await sql`
    INSERT INTO users (name, email, role)
    VALUES ('Oodo Test User', 'test.user@oodo.local', 'tester')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
    RETURNING id, name, email, role, created_at
  `;

  return testUser;
}

module.exports = { initializeDatabase };
