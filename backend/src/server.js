const express = require('express');
const cors = require('cors');
const { sql } = require('./db');
const { initializeDatabase } = require('./schema');
const apiRouter = require('./routes/api');

const app = express();
const port = Number(process.env.PORT) || 5000;

// Configured allowed frontend origins (local + deployed)
const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.DEPLOYED_FRONTEND_URL,
  process.env.LOCAL_FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000'
].filter(Boolean);

// CORS configuration supporting both local and deployed frontend origins with credentials
app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests (e.g., Postman, mobile, curl)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = configuredOrigins.includes(origin);
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isDeployedDomain = process.env.DEPLOYED_DOMAIN 
      ? origin.includes(process.env.DEPLOYED_DOMAIN) 
      : false;

    if (isExplicitlyAllowed || isLocalhost || isDeployedDomain) {
      return callback(null, true);
    }

    // Allow in non-production environments or if origin matches vercel/render/netlify subdomains
    if (process.env.NODE_ENV !== 'production' || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin policy blocked request from ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

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
  setInterval(() => {}, 60000);
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start backend:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
