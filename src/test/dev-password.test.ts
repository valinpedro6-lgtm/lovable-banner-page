import { describe, expect, it } from "vitest";
import { devPasswordMatches } from "@/lib/dev-password";

describe("developer password", () => {
  const testSecret = "synthetic-test-passphrase";

  it("accepts the exact configured password", () => {
    expect(devPasswordMatches(testSecret, testSecret)).toBe(true);
  });

  it("rejects a different or prefixed password", () => {
    expect(devPasswordMatches("different-test-passphrase", testSecret)).toBe(false);
    expect(devPasswordMatches(`x${testSecret}`, testSecret)).toBe(false);
  });

  it("rejects everything when no password is configured", () => {
    expect(devPasswordMatches("anything", "")).toBe(false);
  });
});
