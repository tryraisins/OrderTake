interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export interface RateLimitConfig {
  interval: number; // ms
  maxRequests: number;
}

export const RATE_LIMITS = {
  upload: { interval: 60 * 1000, maxRequests: 10 }, // 10 per minute
  api: { interval: 60 * 1000, maxRequests: 60 }, // 60 per minute
  general: { interval: 60 * 1000, maxRequests: 100 }, // 100 per minute
} as const;

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.interval });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.interval,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}
