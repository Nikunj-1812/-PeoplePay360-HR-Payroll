const express = require('express');
const cors = require('cors');
const { sql } = require('./db');
const { initializeDatabase } = require('./schema');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
    const [database] = await sql`SELECT NOW() AS connected_at`;
    response.json({ status: 'ok', database: 'connected', connectedAt: database.connected_at });
  } catch (error) {
    response.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/api/users', async (_request, response) => {
  try {
    const users = await sql`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY id
    `;
    response.json(users);
  } catch (error) {
    response.status(500).json({ error: 'Unable to load users.' });
  }
});

async function startServer() {
  const testUser = await initializeDatabase();
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
    console.log(`Neon connected. Test user: ${testUser.email}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start backend:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
