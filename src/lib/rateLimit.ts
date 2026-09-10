import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Create a new Redis connection
// We use a try/catch approach so the app doesn't crash if the env variables are missing during build time
const getRedis = () => {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  } catch (error) {
    console.warn("Redis configuration error:", error);
  }
  return null;
};

const redis = getRedis();

// Create a new ratelimiter that allows 5 requests per 15 minutes
const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
}) : null;

export async function checkRateLimit(key: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ratelimit) {
      // Fallback if Redis is not configured (allow request)
      return { success: true };
    }

    const { success, reset } = await ratelimit.limit(key);
    
    if (!success) {
      const waitMinutes = Math.ceil((reset - Date.now()) / 60000);
      return { success: false, error: `Too many login attempts. Please try again in ${waitMinutes} minutes.` };
    }
    
    return { success: true };
  } catch (error) {
    // Fallback to allow login if Redis is temporarily down
    console.error("Rate limit check failed:", error);
    return { success: true }; 
  }
}
