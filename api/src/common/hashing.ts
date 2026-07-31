/**
 * Every hash the API produces, in one place, so the choice of algorithm is
 * made once per purpose rather than per call site.
 *
 * Three different jobs, three different algorithms — the distinction matters:
 *
 *   passwords    argon2id. Deliberately slow, salted per hash. The input is
 *                low-entropy and attacker-guessable, so cost is the defence.
 *
 *   tokens/keys  sha256. Verified on potentially every request, and the input
 *                is 256 bits of machine-generated randomness — there is
 *                nothing to brute force, so argon2 would only add latency.
 *
 *   identifiers  sha256 with a server-side salt, for IP addresses and
 *                analytics sessions. The point is that the original cannot be
 *                recovered even by us, while equal inputs still collide so
 *                they can be counted.
 */

import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/* ─────────────────────────────── passwords ─────────────────────────────── */

/** OWASP's argon2id baseline: 19 MiB, 2 iterations, 1 lane. */
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (plain: string): Promise<string> =>
  argonHash(plain, ARGON);

export async function verifyPassword(
  hash: string,
  plain: string
): Promise<boolean> {
  try {
    return await argonVerify(hash, plain);
  } catch {
    /* A malformed or truncated hash in the database must read as "wrong
       password", never as an unhandled error that leaks which accounts have
       broken records. */
    return false;
  }
}

/* ───────────────────────────── tokens & keys ───────────────────────────── */

/** URL-safe, 256 bits. Used for refresh tokens, invite tokens and API keys. */
export const generateToken = (): string => randomBytes(32).toString("base64url");

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/**
 * Constant-time comparison of two hex digests.
 *
 * `===` on a secret leaks its prefix through timing: the comparison exits at
 * the first differing byte, so response time reveals how much of a guess was
 * correct. Used for the internal API key and the revalidation secret, both of
 * which are compared on every request.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  /* timingSafeEqual throws on length mismatch, which is itself a leak — but
     only of the length, which for fixed-width digests is public anyway. */
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ──────────────────────────── identifiers ──────────────────────────── */

function salt(): string {
  const value = process.env.APP_SALT;
  if (!value) {
    throw new Error(
      "APP_SALT is not set. It is required — without it, hashed IPs and " +
        "analytics sessions would be trivially reversible by rainbow table, " +
        "since the input space of an IPv4 address is only 2^32."
    );
  }
  return value;
}

/** One-way, stable across time. Enough to spot a flood from one source. */
export const hashIp = (ip: string): string =>
  createHash("sha256").update(`${ip}${salt()}`).digest("hex");

/**
 * The cookieless analytics session identifier.
 *
 * Salted with the current UTC date as well as APP_SALT, so the same visitor
 * hashes differently tomorrow. That is the privacy property, not a limitation:
 * it makes cross-day tracking structurally impossible rather than merely
 * against policy — which is what lets this run without a consent banner.
 *
 * Truncated to 32 hex characters. Still 128 bits: collisions within a single
 * day's traffic are not a practical concern at this scale.
 */
export function sessionHash(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${salt()}|${day}`)
    .digest("hex")
    .slice(0, 32);
}
