/**
 * Client-side Cache & Invalidation Manager for PeoplePay360
 */

const cacheStore = new Map();
const listeners = new Set();

export function getCacheKey(url, params = {}) {
  const paramStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `${url}?${paramStr}`;
}

export function getCached(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  // Optional cache duration check (5 minutes)
  if (Date.now() - item.timestamp > 5 * 60 * 1000) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
}

export function setCached(key, data, tags = []) {
  cacheStore.set(key, {
    data,
    tags,
    timestamp: Date.now()
  });
}

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

export function subscribeCache(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(tags) {
  listeners.forEach(cb => cb(tags));
}
