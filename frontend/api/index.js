const { app } = require('../../backend/src/server');
const { initializeDatabase } = require('../../backend/src/schema');

let initPromise = null;

module.exports = async (req, res) => {
  if (!initPromise) {
    initPromise = initializeDatabase().catch((err) => {
      console.error('[Vercel Serverless] DB init error:', err);
    });
  }
  await initPromise;
  return app(req, res);
};
