import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { createRateLimiter } = await import("./rateLimit");

function limiterAt(start = 0) {
  let time = start;
  const limiter = createRateLimiter({
    limit: 3,
    windowMs: 1000,
    now: () => time,
  });
  return {
    limiter,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

describe("createRateLimiter", () => {
  it("allows up to the limit within the window", () => {
    const { limiter } = limiterAt();
    expect([1, 2, 3, 4].map(() => limiter.allow("a"))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it("counts keys separately", () => {
    const { limiter } = limiterAt();
    for (let i = 0; i < 3; i++) limiter.allow("a");
    expect(limiter.allow("a")).toBe(false);
    expect(limiter.allow("b")).toBe(true);
  });

  it("lets attempts through again as old ones leave the window", () => {
    const { limiter, advance } = limiterAt();
    limiter.allow("a");
    advance(500);
    limiter.allow("a");
    limiter.allow("a");
    expect(limiter.allow("a")).toBe(false);
    advance(501);
    // Only the first attempt has left the window.
    expect(limiter.allow("a")).toBe(true);
    expect(limiter.allow("a")).toBe(false);
  });

  it("does not count refused attempts", () => {
    const { limiter, advance } = limiterAt();
    for (let i = 0; i < 3; i++) limiter.allow("a");
    advance(900);
    // Hammering while limited must not extend the block past the window of the allowed ones.
    for (let i = 0; i < 10; i++) limiter.allow("a");
    advance(101);
    expect(limiter.allow("a")).toBe(true);
  });

  it("forgets idle keys", () => {
    const { limiter, advance } = limiterAt();
    limiter.allow("a");
    limiter.allow("b");
    advance(1500);
    limiter.allow("c");
    expect(limiter.size).toBe(1);
  });
});
