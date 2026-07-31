/**
 * Sessions: login, rotation, and theft detection.
 *
 * The design in one line: a short-lived access token the API can verify without
 * touching the database, plus a long-lived refresh token that is single-use and
 * tracked, so a stolen one is both limited in value and detectable.
 */

import {
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { companies, refreshTokens, users } from "@/db/schema";
import {
  generateToken,
  hashIp,
  hashToken,
  verifyPassword,
} from "@/common/hashing";
import type { AccessClaims } from "./auth.guards";

/** 15 minutes. Short enough that a leaked access token expires before it is
    much use; long enough that refreshes aren't constant. */
const ACCESS_TTL = "15m";
/** 30 days, rotated on every use. */
const REFRESH_TTL_DAYS = 30;

export type SessionUser = {
  id: number;
  companyId: number;
  email: string;
  name: string;
  role: "owner" | "editor";
};

export type IssuedSession = {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly jwt: JwtService
  ) {}

  /* ─────────────────────────────── login ─────────────────────────────── */

  async login(
    email: string,
    password: string,
    meta: { ip: string; userAgent: string }
  ): Promise<IssuedSession> {
    const normalised = email.trim().toLowerCase();

    const [row] = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .innerJoin(companies, eq(companies.id, users.companyId))
      .where(
        and(
          eq(users.email, normalised),
          eq(users.isDeleted, 0),
          eq(companies.status, "active"),
          eq(companies.isDeleted, 0)
        )
      )
      .limit(1);

    /* One message and one timing profile for every failure mode — unknown
       email, disabled account, wrong password. Distinguishing them turns the
       login form into an oracle for which addresses have accounts.

       The dummy verify keeps the timing honest: without it, an unknown email
       returns in ~1ms while a real one costs argon2's ~50ms, which is a
       trivially measurable difference. */
    const invalid = new UnauthorizedException("Email or password is incorrect.");

    if (!row?.passwordHash || row.status !== "active") {
      await verifyPassword(
        "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0$0000000000000000000000000000000000000000000",
        password
      );
      throw invalid;
    }

    if (!(await verifyPassword(row.passwordHash, password))) throw invalid;

    await this.db
      .update(users)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(users.id, row.id));

    const user: SessionUser = {
      id: row.id,
      companyId: row.companyId,
      email: row.email,
      name: row.name,
      role: row.role,
    };

    /* A new login starts a new family, so signing in elsewhere never
       invalidates this session. */
    return this.issue(user, randomUUID(), meta);
  }

  /* ────────────────────────────── refresh ────────────────────────────── */

  /**
   * Exchange a refresh token for a new pair.
   *
   * Rotation means the presented token is revoked as part of the exchange, so
   * every token is single-use. That turns replay into a signal: if a token that
   * has already been rotated away is presented again, either it was stolen and
   * the thief is using it, or it was stolen and the legitimate user is — and
   * there is no way to tell which. The only safe response is to revoke the
   * whole family and make everyone sign in again.
   */
  async refresh(
    presented: string,
    meta: { ip: string; userAgent: string }
  ): Promise<IssuedSession> {
    const expired = new UnauthorizedException("Session expired.");
    const [token] = await this.db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        familyId: refreshTokens.familyId,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(presented)))
      .limit(1);

    if (!token) throw expired;

    if (token.revokedAt) {
      /* Reuse of an already-rotated token. Burn the family. */
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date().toISOString() })
        .where(
          and(
            eq(refreshTokens.familyId, token.familyId),
            isNull(refreshTokens.revokedAt)
          )
        );

      console.warn(
        `[auth] refresh token reuse detected for user ${token.userId}; ` +
          `revoked family ${token.familyId}`
      );
      throw new UnauthorizedException(
        "This session was ended for security reasons. Please sign in again."
      );
    }

    if (new Date(token.expiresAt).getTime() < Date.now()) throw expired;

    const [row] = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .innerJoin(companies, eq(companies.id, users.companyId))
      .where(
        and(
          eq(users.id, token.userId),
          eq(users.isDeleted, 0),
          eq(companies.status, "active")
        )
      )
      .limit(1);

    /* Disabling an account takes effect within the access token's lifetime
       rather than in 30 days, because refresh re-reads status every time. */
    if (!row || row.status !== "active") throw expired;

    const issued = await this.issue(
      {
        id: row.id,
        companyId: row.companyId,
        email: row.email,
        name: row.name,
        role: row.role,
      },
      token.familyId,
      meta
    );

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(refreshTokens.id, token.id));

    return issued;
  }

  /** Sign out — revokes the whole family, so every device in this lineage. */
  async logout(presented: string | undefined): Promise<void> {
    if (!presented) return;

    const [token] = await this.db
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(presented)))
      .limit(1);

    if (!token) return;

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(
        and(
          eq(refreshTokens.familyId, token.familyId),
          isNull(refreshTokens.revokedAt)
        )
      );
  }

  async me(userId: number): Promise<SessionUser | null> {
    const [row] = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isDeleted, 0)))
      .limit(1);

    return row ?? null;
  }

  /* ────────────────────────────── issuing ────────────────────────────── */

  private async issue(
    user: SessionUser,
    familyId: string,
    meta: { ip: string; userAgent: string }
  ): Promise<IssuedSession> {
    const claims: AccessClaims = {
      sub: user.id,
      cid: user.companyId,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(claims, {
      secret: process.env.JWT_SECRET,
      expiresIn: ACCESS_TTL,
    });

    /* The refresh token is opaque random bytes, not a JWT. It is looked up in
       the database on every use anyway — which is what makes revocation
       possible — so signing it would add size and verification cost while
       buying nothing. */
    const refreshToken = generateToken();
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    await this.db.insert(refreshTokens).values({
      companyId: user.companyId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: expiresAt.toISOString(),
      userAgent: meta.userAgent.slice(0, 400),
      ipHash: hashIp(meta.ip),
    });

    return { user, accessToken, refreshToken };
  }
}
