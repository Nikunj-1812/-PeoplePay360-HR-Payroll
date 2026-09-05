// Client cache and invalidation manager
const cacheStore = new Map();
const listeners = new Set();

// Generate user-scoped cache key
export function getCacheKey(url, params = {}, userScope = '') {
  const paramStr = Object.keys(params || {}).sort().map(k => `${k}=${params[k]}`).join('&');
  const prefix = userScope ? `user_${userScope}::` : '';
  return `${prefix}${url}?${paramStr}`;
}

// Get item from cache with TTL check
export function getCached(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > 5 * 60 * 1000) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
}

// Store item in cache with tag associations
export function setCached(key, data, tags = []) {
  cacheStore.set(key, {
    data,
    tags,
    timestamp: Date.now()
  });
}

// Invalidate matching tags
export function invalidateCache(tags = []) {
  if (!tags || tags.length === 0) {
    cacheStore.clear();
  } else {
    for (const [key, item] of cacheStore.entries()) {
      const match = item.tags.some(tag => tags.includes(tag)) || tags.some(tag => key.includes(tag));
      if (match) {
        cacheStore.delete(key);
      }
    }
  }
  notifyListeners(tags);
}

// Clear all client cached data
export function clearAllCache() {
  cacheStore.clear();
  notifyListeners([]);
}

// Subscribe to cache invalidation events
export function subscribeCache(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(tags) {
  listeners.forEach(cb => {
    try {
      cb(tags);
    } catch (err) {
      console.error('Cache listener error:', err);
    }
  });
}
