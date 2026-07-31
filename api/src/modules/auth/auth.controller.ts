import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { z } from "zod";

import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import {
  ACCESS_COOKIE,
  JwtAccessGuard,
  REFRESH_COOKIE,
} from "./auth.guards";
import { AuthService, type IssuedSession } from "./auth.service";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Rate limited hard, and per IP rather than per account.
   *
   * Limiting by account would let anyone lock a known user out by burning
   * their attempts deliberately — the denial-of-service is easier than the
   * password guess it prevents.
   */
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post("login")
  async login(
    @ZodBody(loginSchema) body: z.infer<typeof loginSchema>,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ user: IssuedSession["user"] }> {
    const session = await this.auth.login(body.email, body.password, {
      ip: request.ip ?? "0.0.0.0",
      userAgent: request.get("user-agent") ?? "",
    });

    this.setCookies(response, session);
    return { user: session.user };
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("refresh")
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ user: IssuedSession["user"] }> {
    const presented = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!presented) throw new UnauthorizedException("Not signed in.");

    const session = await this.auth.refresh(presented, {
      ip: request.ip ?? "0.0.0.0",
      userAgent: request.get("user-agent") ?? "",
    });

    this.setCookies(response, session);
    return { user: session.user };
  }

  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ ok: true }> {
    await this.auth.logout(request.cookies?.[REFRESH_COOKIE] as string);
    this.clearCookies(response);
    return { ok: true };
  }

  @UseGuards(JwtAccessGuard)
  @Get("me")
  async me(@Tenant() tenant: TenantContext) {
    const user = await this.auth.me(tenant.actorUserId ?? 0);
    if (!user) throw new UnauthorizedException("Not signed in.");
    return { user };
  }

  /* ──────────────────────────── cookies ──────────────────────────── */

  /**
   * Both cookies are httpOnly, so no script can read them — including anything
   * injected into the page.
   *
   * `sameSite: "strict"` is possible because the dashboard is served from the
   * same origin as the site (felmosengineering.com/admin) and reaches this API
   * through a proxy route rather than directly. That is the whole reason the
   * dashboard lives inside the web app: cross-origin would force
   * `sameSite: "none"` and a CSRF token alongside it.
   *
   * The refresh cookie is path-scoped to the refresh endpoint, so it is not
   * sent on ordinary API calls — narrowing the number of requests that carry
   * the long-lived credential at all.
   */
  private setCookies(response: Response, session: IssuedSession): void {
    const secure = process.env.NODE_ENV === "production";

    response.cookie(ACCESS_COOKIE, session.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    response.cookie(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearCookies(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, { path: "/" });
    response.clearCookie(REFRESH_COOKIE, { path: "/" });
  }
}
