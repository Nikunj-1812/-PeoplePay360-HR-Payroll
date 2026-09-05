const express = require('express');
const cors = require('cors');
const { sql } = require('./db');
const { initializeDatabase } = require('./schema');
const apiRouter = require('./routes/api');

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', async (_req, res) => {
  try {
    const [database] = await sql`SELECT NOW() AS connected_at`;
    res.json({ status: 'ok', database: 'connected', connectedAt: database.connected_at });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// Mount Main API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`PeoplePay360 Backend running on http://localhost:${port}`);
    console.log(`Neon Database Connected.`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start backend:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
