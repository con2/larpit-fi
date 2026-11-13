import { headers } from "next/headers";

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

/**
 * Sliding window counter per key, kept in this process only. Keys idle for a whole window are
 * dropped as other keys are checked, so memory follows the number of recently active clients.
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions) {
  const hits = new Map<string, number[]>();
  let lastPrune = now();

  function prune(time: number) {
    if (time - lastPrune < windowMs) return;
    lastPrune = time;
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= time - windowMs) hits.delete(key);
    }
  }

  return {
    /** Records an attempt and tells whether it is within the limit. */
    allow(key: string): boolean {
      const time = now();
      prune(time);
      const recent = (hits.get(key) ?? []).filter((t) => t > time - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(time);
      hits.set(key, recent);
      return true;
    },
    get size() {
      return hits.size;
    },
  };
}

const searchLimiter = createRateLimiter({ limit: 30, windowMs: 10_000 });

/** The client address as the ingress proxy reports it, which sets `x-forwarded-for`. */
async function getClientKey(): Promise<string> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor?.split(",")[0].trim() || "unknown";
}

/** Counts a search by the current request's client; false when it should not be run. */
export async function allowSearch(): Promise<boolean> {
  return searchLimiter.allow(await getClientKey());
}
