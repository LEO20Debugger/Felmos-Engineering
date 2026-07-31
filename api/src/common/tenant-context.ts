/**
 * Which company the current request belongs to.
 *
 * The single rule: this is derived from the caller's credentials, never from
 * anything the caller can type. A `companyId` in a request body, a query
 * string or a path parameter is ignored — accepting one would turn every
 * endpoint into "read any tenant's data by changing a number".
 *
 * Three ways a request arrives at a tenant:
 *
 *   admin      — a claim inside the signed JWT, set at login.
 *   public read— the `x-internal-key` header resolved against `api_keys`.
 *   beacon     — the public company key, plus an Origin check against
 *                `companies.allowedOrigins`.
 */

export type TenantActor =
  | { kind: "user"; userId: number; role: "owner" | "editor" }
  | { kind: "apiKey"; apiKeyId: number; scope: "internal" | "public" }
  | { kind: "system" };

export class TenantContext {
  constructor(
    readonly companyId: number,
    readonly actor: TenantActor
  ) {}

  /** The user id to stamp into createdBy/updatedBy/deletedBy, if a person did
      it. Scripts and machine callers leave these null rather than borrowing
      someone's identity. */
  get actorUserId(): number | null {
    return this.actor.kind === "user" ? this.actor.userId : null;
  }

  get isOwner(): boolean {
    return this.actor.kind === "user" && this.actor.role === "owner";
  }

  /** For seeds, migrations and cron jobs, which have no request to derive a
      tenant from but still must not write unscoped rows. */
  static system(companyId: number): TenantContext {
    return new TenantContext(companyId, { kind: "system" });
  }
}
