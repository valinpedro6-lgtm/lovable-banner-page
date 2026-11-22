import { describe, expect, it } from "vitest";
import { devPasswordMatches } from "@/lib/dev-password";

describe("developer password", () => {
  it("accepts the exact developer password", () => {
    expect(devPasswordMatches("28208778", "28208778")).toBe(true);
  });

  it("rejects a different or prefixed password", () => {
    expect(devPasswordMatches("28208779", "28208778")).toBe(false);
    expect(devPasswordMatches("M28208778", "28208778")).toBe(false);
  });

  it("rejects everything when no password is configured", () => {
    expect(devPasswordMatches("", "")).toBe(false);
  });
});
