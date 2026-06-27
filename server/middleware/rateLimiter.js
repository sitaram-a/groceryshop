// middleware/rateLimiter.js
// In-memory sliding-window rate limiter — no extra npm package needed.
// For multi-instance production deployments, swap the store for a Redis store.

const store = new Map(); // ip+route -> { count, resetAt }

/**
 * Creates a rate-limit middleware.
 * @param {object} options
 * @param {number} options.windowMs   – Time window in ms (default 15 min)
 * @param {number} options.max        – Max requests per window (default 100)
 * @param {string} [options.message]  – Custom error message
 * @param {string} [options.keyPrefix]– Prefix to namespace different limiters
 */
function createLimiter({ windowMs = 15 * 60 * 1000, max = 100, message, keyPrefix = 'rl' } = {}) {
  return (req, res, next) => {
    const ip  = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);

    // Reset window if expired
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count += 1;
    store.set(key, entry);

    // Set standard rate-limit headers
    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit',     max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset',     Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message: message || `Too many requests. Please try again after ${retryAfterSec} seconds.`,
      });
    }

    next();
  };
}

// ── Pre-built limiters ────────────────────────────────────────────────────────

/** Auth routes: 10 attempts per 15 min (login brute-force protection) */
const authLimiter = createLimiter({
  windowMs:  15 * 60 * 1000,
  max:       10,
  keyPrefix: 'auth',
  message:   'Too many login attempts. Please wait 15 minutes before trying again.',
});

/** General API: 200 requests per 15 min */
const apiLimiter = createLimiter({
  windowMs:  15 * 60 * 1000,
  max:       200,
  keyPrefix: 'api',
});

/** Order placement: 5 orders per 10 min (prevent spam orders) */
const orderLimiter = createLimiter({
  windowMs:  10 * 60 * 1000,
  max:       5,
  keyPrefix: 'order',
  message:   'Too many order requests. Please wait a few minutes.',
});

/** Review submission: 10 reviews per hour */
const reviewLimiter = createLimiter({
  windowMs:  60 * 60 * 1000,
  max:       10,
  keyPrefix: 'review',
  message:   'Too many review submissions. Please try again later.',
});

// Cleanup old entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

module.exports = { createLimiter, authLimiter, apiLimiter, orderLimiter, reviewLimiter };