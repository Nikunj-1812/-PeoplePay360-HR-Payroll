const { sql } = require('./db');
const { initializeDatabase } = require('./schema');

async function testDatabase() {
  const [connection] = await sql`SELECT 1 AS connected`;
  const testUser = await initializeDatabase();

  if (connection.connected !== 1 || !testUser) {
    throw new Error('Neon connection or test-user verification failed.');
  }

  console.log('Neon connection: OK');
  console.log('Users table: OK');
  console.log(`Test user: ${testUser.name} <${testUser.email}> (id: ${testUser.id})`);
}

testDatabase().catch((error) => {
  console.error('Database test failed:', error.message);
  process.exitCode = 1;
});
