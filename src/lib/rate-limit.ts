import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: For production with multiple instances, use Redis/Upstash
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  response?: NextResponse;
}

/**
 * Simple rate limiter for API routes.
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining requests
 *
 * @example
 * ```typescript
 * const result = rateLimit(ip, { limit: 5, windowSeconds: 60 });
 * if (!result.allowed) return result.response;
 * ```
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `ratelimit:${identifier}`;

  let entry = rateLimitStore.get(key);

  // If no entry or window has passed, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Check if over limit
  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      response: NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetTime / 1000)),
          },
        }
      ),
    };
  }

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers.
 * Works with Vercel, Cloudflare, and direct connections.
 */
export function getClientIP(request: Request): string {
  // Check various headers for client IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelIP = request.headers.get("x-vercel-forwarded-for");
  if (vercelIP) {
    return vercelIP.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  /** Auth endpoints: 5 attempts per minute */
  auth: { limit: 5, windowSeconds: 60 },
  /** Password reset: 3 attempts per 15 minutes */
  passwordReset: { limit: 3, windowSeconds: 900 },
  /** General API: 100 requests per minute */
  api: { limit: 100, windowSeconds: 60 },
  /** File uploads: 10 per minute */
  upload: { limit: 10, windowSeconds: 60 },
} as const;
