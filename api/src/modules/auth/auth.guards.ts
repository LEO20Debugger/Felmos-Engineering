/**
 * The three ways a request proves who it is.
 *
 * All of them end the same way: attaching a TenantContext to the request. No
 * endpoint ever reads a company id from a body, query or path — accepting one
 * would turn every route into "read any tenant's data by changing a number".
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { and, eq } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { apiKeys, companies } from "@/db/schema";
import { hashToken } from "@/common/hashing";
import { TenantContext } from "@/common/tenant-context";
import { TENANT_KEY, type RequestWithTenant } from "@/common/tenant.decorator";

/** Claims carried by the short-lived access token. */
export type AccessClaims = {
  sub: number;
  cid: number;
  role: "owner" | "editor";
};

type Req = RequestWithTenant & {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
};

/** Cookie the access token lives in. httpOnly — never readable from JS. */
export const ACCESS_COOKIE = "fe_at";
export const REFRESH_COOKIE = "fe_rt";

/* ─────────────────────────── dashboard sessions ─────────────────────────── */

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Req>();

    /* Cookie first, Authorization header as a fallback. The cookie is what the
       dashboard uses; the header exists so the API can be exercised with curl
       during development without hand-crafting cookies. */
    const fromCookie = request.cookies?.[ACCESS_COOKIE];
    const header = request.headers["authorization"];
    const fromHeader =
      typeof header === "string" && header.startsWith("Bearer ")
        ? header.slice(7)
        : undefined;

    const token = fromCookie ?? fromHeader;
    if (!token) throw new UnauthorizedException("Not signed in.");

    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      /* Expired or tampered. The dashboard responds to a 401 by attempting a
         refresh and retrying once, so this is a routine event rather than an
         error worth logging. */
      throw new UnauthorizedException("Session expired.");
    }

    request[TENANT_KEY] = new TenantContext(claims.cid, {
      kind: "user",
      userId: claims.sub,
      role: claims.role,
    });

    return true;
  }
}

/** `@Roles("owner")` — settings, users and mail recipients are owner-only. */
export const ROLES_KEY = "roles";
export const Roles = (...roles: ("owner" | "editor")[]) =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      ("owner" | "editor")[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Req>();
    const actor = request[TENANT_KEY]?.actor;

    if (actor?.kind !== "user" || !required.includes(actor.role)) {
      throw new ForbiddenException(
        "Your account doesn't have permission for that."
      );
    }
    return true;
  }
}

/* ───────────────────────── trusted server callers ───────────────────────── */

/**
 * The public site's server-side fetchers, identified by `x-internal-key`.
 *
 * The key maps to a row in `api_keys`, which is what yields the company — the
 * caller never states its own tenant. Keys are stored as sha256 and compared
 * by hash, so a database dump doesn't hand over working credentials.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: Db) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Req>();
    const raw = request.headers["x-internal-key"];
    const key = typeof raw === "string" ? raw : undefined;

    if (!key) throw new UnauthorizedException("Missing internal key.");

    const [row] = await this.db
      .select({ id: apiKeys.id, companyId: apiKeys.companyId })
      .from(apiKeys)
      .innerJoin(companies, eq(companies.id, apiKeys.companyId))
      .where(
        and(
          eq(apiKeys.keyHash, hashToken(key)),
          eq(apiKeys.scope, "internal"),
          eq(apiKeys.isDeleted, 0),
          /* A suspended company's site stops being served rather than
             continuing to read content it may no longer be paying for. */
          eq(companies.status, "active"),
          eq(companies.isDeleted, 0)
        )
      )
      .limit(1);

    if (!row) throw new UnauthorizedException("Invalid internal key.");

    request[TENANT_KEY] = new TenantContext(row.companyId, {
      kind: "apiKey",
      apiKeyId: row.id,
      scope: "internal",
    });

    return true;
  }
}
