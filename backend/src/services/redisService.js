const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const DEFAULT_TTL_SECONDS = 300;

// In-memory fallback when Redis is unavailable
const memoryFallback = new Map();

let redisClient = null;
let isRedisConnected = false;
let hasLoggedRedisStatus = false;

try {
  redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    showFriendlyErrorStack: false,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 1000, 3000);
    }
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    if (!hasLoggedRedisStatus) {
      console.log(`[Redis] Connected to Redis cache at ${REDIS_URL.replace(/:\/\/.*@/, '://***@')}`);
      hasLoggedRedisStatus = true;
    }
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    if (!hasLoggedRedisStatus) {
      console.warn(`[Redis] Redis unavailable (${err.message}). Using seamless PostgreSQL / in-memory fallback.`);
      hasLoggedRedisStatus = true;
    }
  });

  redisClient.connect().catch((err) => {
    isRedisConnected = false;
    if (!hasLoggedRedisStatus) {
      console.warn(`[Redis] Redis connection not established (${err.message}). Falling back to primary DB.`);
      hasLoggedRedisStatus = true;
    }
  });
} catch (err) {
  isRedisConnected = false;
  console.warn(`[Redis] Failed to initialize Redis client:`, err.message);
}

// Get item from cache with in-memory fallback
async function get(key) {
  if (!key) return null;

  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) return JSON.parse(data);
      return null;
    } catch {
      // Redis query fallback
    }
  }

  const memItem = memoryFallback.get(key);
  if (memItem) {
    if (Date.now() > memItem.expiresAt) {
      memoryFallback.delete(key);
      return null;
    }
    return JSON.parse(memItem.data);
  }

  return null;
}

// Set item in cache after stripping sensitive credentials
async function set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!key || value === undefined || value === null) return;

  const sanitized = sanitizeSensitiveData(value);
  const serialized = JSON.stringify(sanitized);

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
    } catch {
      // Redis set fallback
    }
  }

  memoryFallback.set(key, {
    data: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

// Delete single key
async function del(key) {
  if (!key) return;

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch {
      // Redis del fallback
    }
  }

  memoryFallback.delete(key);
}

// Delete keys matching pattern
async function delByPattern(pattern) {
  if (!pattern) return;

  if (isRedisConnected && redisClient) {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Redis pattern scan fallback
    }
  }

  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of memoryFallback.keys()) {
    if (regexPattern.test(key)) {
      memoryFallback.delete(key);
    }
  }
}

// Domain-specific invalidation helpers
async function invalidateEmployees(empId = null) {
  await delByPattern('pp360:employees:*');
  await delByPattern('pp360:dashboard:*');
  await delByPattern('pp360:payruns:eligible:*');
  if (empId) {
    await del(`pp360:employees:detail:${empId}`);
  }
}

async function invalidateContracts(empId = null) {
  await delByPattern('pp360:contracts:*');
  await delByPattern('pp360:employees:*');
  await delByPattern('pp360:dashboard:*');
  await delByPattern('pp360:payruns:*');
}

async function invalidateAttendance(empId = null) {
  await delByPattern('pp360:attendance:*');
  await delByPattern('pp360:dashboard:*');
  await delByPattern('pp360:employees:*');
}

async function invalidateTimeOff(empId = null) {
  await delByPattern('pp360:timeoff:*');
  await delByPattern('pp360:dashboard:*');
  await delByPattern('pp360:employees:*');
}

async function invalidateSalaryStructures(structId = null) {
  await delByPattern('pp360:salary:*');
  await delByPattern('pp360:payruns:*');
  await delByPattern('pp360:dashboard:*');
}

async function invalidatePayruns(payrunId = null) {
  await delByPattern('pp360:payruns:*');
  await delByPattern('pp360:dashboard:*');
  await delByPattern('pp360:employees:*');
}

async function invalidateSchedules() {
  await delByPattern('pp360:schedules:*');
  await delByPattern('pp360:attendance:*');
  await delByPattern('pp360:employees:*');
}

async function invalidateAll() {
  await delByPattern('pp360:*');
  memoryFallback.clear();
}

// Remove passwords, hashes, JWTs and secrets while preserving Dates
function sanitizeSensitiveData(data) {
  if (!data) return data;
  if (data instanceof Date) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSensitiveData(item));
  }
  if (typeof data === 'object') {
    const copy = { ...data };
    delete copy.password;
    delete copy.password_hash;
    delete copy.token;
    delete copy.jwt;
    delete copy.secret;
    for (const k in copy) {
      if (typeof copy[k] === 'object' && copy[k] !== null && !(copy[k] instanceof Date)) {
        copy[k] = sanitizeSensitiveData(copy[k]);
      }
    }
    return copy;
  }
  return data;
}

module.exports = {
  get,
  set,
  del,
  delByPattern,
  invalidateEmployees,
  invalidateContracts,
  invalidateAttendance,
  invalidateTimeOff,
  invalidateSalaryStructures,
  invalidatePayruns,
  invalidateSchedules,
  invalidateAll,
  isRedisConnected: () => isRedisConnected
};
