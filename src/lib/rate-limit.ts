// Simple in-memory rate limiter for auth routes
// For production, use Upstash Redis for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage (resets on server restart)
const loginAttempts = new Map<string, RateLimitEntry>();
const signupAttempts = new Map<string, RateLimitEntry>();

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60 * 1000; // 1 minute
const SIGNUP_MAX_ATTEMPTS = 3;
const SIGNUP_WINDOW_MS = 60 * 1000; // 1 minute

export function checkLoginRateLimit(email: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts || now > attempts.resetTime) {
    // First attempt or window expired
    loginAttempts.set(email, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
    return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - 1, retryAfter: 0 };
  }

  if (attempts.count >= LOGIN_MAX_ATTEMPTS) {
    // Rate limited
    const retryAfter = Math.ceil((attempts.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Increment count
  attempts.count++;
  return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - attempts.count, retryAfter: 0 };
}

export function checkSignupRateLimit(email: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const attempts = signupAttempts.get(email);

  if (!attempts || now > attempts.resetTime) {
    signupAttempts.set(email, { count: 1, resetTime: now + SIGNUP_WINDOW_MS });
    return { allowed: true, remaining: SIGNUP_MAX_ATTEMPTS - 1, retryAfter: 0 };
  }

  if (attempts.count >= SIGNUP_MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((attempts.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  attempts.count++;
  return { allowed: true, remaining: SIGNUP_MAX_ATTEMPTS - attempts.count, retryAfter: 0 };
}

// Cleanup old entries periodically
export function cleanupRateLimitMaps() {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.resetTime) {
      loginAttempts.delete(key);
    }
  }
  for (const [key, value] of signupAttempts.entries()) {
    if (now > value.resetTime) {
      signupAttempts.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitMaps, 5 * 60 * 1000);
}
