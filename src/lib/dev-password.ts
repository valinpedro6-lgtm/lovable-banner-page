import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compares a typed developer password with the expected one without leaking
 * length or content through timing. Server-only: never import from components.
 */
export function devPasswordMatches(input: string, expected: string): boolean {
  if (!expected) return false;
  const a = createHash("sha256").update(input.trim(), "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
