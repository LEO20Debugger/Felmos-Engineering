import { NextResponse, type NextRequest } from "next/server";

/**
 * Guards /admin, and renews expired sessions.
 *
 * The matcher below is the important line: without it this runs on every
 * marketing page and adds latency to content that is otherwise static. Scoped
 * to /admin, visitors to the public site never execute it.
 *
 * Access tokens last 15 minutes, so a returning editor almost always arrives
 * with an expired access cookie and a valid refresh cookie. Middleware is the
 * right place to exchange them: it runs before rendering and can set cookies on
 * the response, which a Server Component cannot do — a component that tried
 * would have to redirect to a route handler and back on every stale load.
 */

const ACCESS = "fe_at";
const REFRESH = "fe_rt";
const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const access = request.cookies.get(ACCESS)?.value;
  const refresh = request.cookies.get(REFRESH)?.value;

  const isLogin = pathname === "/admin/login";

  /* Already signed in and heading for the login page — send them onward
     instead of asking for credentials they've already given. */
  if (isLogin && access) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (isLogin) return NextResponse.next();

  if (access) return NextResponse.next();

  /* No access token but a refresh token: try to renew silently. */
  if (refresh) {
    try {
      const renewed = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { cookie: `${REFRESH}=${refresh}` },
        cache: "no-store",
      });

      if (renewed.ok) {
        const response = NextResponse.next();
        /* Relay the API's Set-Cookie headers verbatim. getSetCookie() returns
           them unmerged — reading the plain `set-cookie` header would collapse
           two cookies into one malformed string. */
        for (const cookie of renewed.headers.getSetCookie()) {
          response.headers.append("set-cookie", cookie);
        }
        return response;
      }
    } catch {
      /* API unreachable. Fall through to the login redirect rather than
         showing a broken dashboard. */
    }
  }

  const login = new URL("/admin/login", request.url);
  /* Remember where they were heading so the redirect after login lands there
     rather than dumping everyone on the overview. */
  if (pathname !== "/admin") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
};
