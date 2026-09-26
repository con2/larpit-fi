import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureEndsAt,
  isSignupOpen,
  isSignupOpeningSoon,
  isSignupOver,
  larpStartsAt,
} from "./Larp.client";

// Larp dates are Helsinki calendar days; the rules below pin down the instants they stand for.
function at(helsinkiTime: string) {
  vi.setSystemTime(new Date(helsinkiTime));
}

describe("larp date rules", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts in the morning and ends in the evening of the same day when there is no end date", () => {
    const larp = { startsAt: "2026-07-04", endsAt: null };
    expect(larpStartsAt(larp)?.toISOString()).toBe("2026-07-04T05:00:00.000Z");
    expect(ensureEndsAt(larp)?.toISOString()).toBe("2026-07-04T17:00:00.000Z");
  });

  it("is still upcoming on the evening of its last day", () => {
    at("2026-07-05T16:00:00+03:00");
    const endsAt = ensureEndsAt({
      startsAt: "2026-07-04",
      endsAt: "2026-07-05",
    });
    expect(endsAt && endsAt >= new Date()).toBe(true);
  });

  it("sign-up opens in the evening of its start day", () => {
    const larp = {
      startsAt: "2026-08-01",
      endsAt: null,
      signupStartsAt: "2026-06-01",
      signupEndsAt: "2026-06-30",
    };
    at("2026-06-01T12:00:00+03:00");
    expect(isSignupOpen(larp)).toBe(false);
    expect(isSignupOpeningSoon(larp)).toBe(true);
    at("2026-06-01T20:30:00+03:00");
    expect(isSignupOpen(larp)).toBe(true);
  });

  it("sign-up stays open until the very end of its last day", () => {
    const larp = {
      startsAt: "2026-08-01",
      endsAt: null,
      signupStartsAt: "2026-06-01",
      signupEndsAt: "2026-06-30",
    };
    at("2026-06-30T23:30:00+03:00");
    expect(isSignupOpen(larp)).toBe(true);
    expect(isSignupOver(larp)).toBe(false);
    at("2026-07-01T00:30:00+03:00");
    expect(isSignupOpen(larp)).toBe(false);
    expect(isSignupOver(larp)).toBe(true);
  });

  it("an unbounded sign-up closes when the larp starts", () => {
    const larp = {
      startsAt: "2026-08-01",
      endsAt: null,
      signupStartsAt: "2026-06-01",
      signupEndsAt: null,
    };
    at("2026-07-31T23:00:00+03:00");
    expect(isSignupOpen(larp)).toBe(true);
    at("2026-08-01T09:00:00+03:00");
    expect(isSignupOpen(larp)).toBe(false);
    expect(isSignupOver(larp)).toBe(false);
  });
});
