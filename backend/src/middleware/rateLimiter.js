const rateMap = new Map();

/**
 * In-memory rate limiting middleware for sensitive endpoints
 * @param {Object} options - { windowMs: 30000, max: 5, message: 'Too many requests' }
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 30000; // default 30 seconds
  const maxRequests = options.max || 5; // default 5 attempts per window
  const customMessage = options.message || 'Too many requests. Please wait before trying again.';

  return (req, res, next) => {
    const key = req.user?.id ? `user_${req.user.id}` : `ip_${req.ip || req.socket.remoteAddress}`;
    const now = Date.now();

    let record = rateMap.get(key);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      rateMap.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      console.warn(`[RateLimit Warning] Exceeded limit for key '${key}' on endpoint ${req.originalUrl}`);
      return res.status(429).json({
        success: false,
        message: customMessage,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    next();
  };
}

// Clean up stale rate records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateMap.entries()) {
    if (now - record.startTime > 300000) {
      rateMap.delete(key);
    }
  }
}, 300000);

module.exports = { createRateLimiter };
