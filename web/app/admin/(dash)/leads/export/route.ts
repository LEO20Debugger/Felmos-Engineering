import { cookies } from "next/headers";

/**
 * Downloads the leads inbox as a CSV.
 *
 * A route handler rather than a server action, because a download needs a real
 * response with its own content-type and content-disposition — a server action
 * can only return serialisable data to a component.
 *
 * It cannot go through lib/admin/api.ts either: `request()` parses every
 * response as JSON, which would turn the CSV into a syntax error. So this
 * repeats the cookie-forwarding by hand — the only place in the dashboard that
 * does — and passes the body straight through untouched.
 *
 * `/admin/leads/export` does not collide with the `/admin/leads` page: that
 * lives at (dash)/leads/page.tsx, and this is a child segment of it.
 */

export const runtime = "nodejs";

const API_URL = process.env.API_URL ?? "http://localhost:4000/v1";

/** Only the filters the API understands, so nothing else rides along. */
const PASSTHROUGH = ["status", "q", "deleted"] as const;

export async function GET(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;

  const query = new URLSearchParams();
  for (const key of PASSTHROUGH) {
    const value = incoming.get(key);
    if (value) query.set(key, value);
  }

  const jar = await cookies();
  const response = await fetch(
    `${API_URL}/admin/leads/export.csv${query.size > 0 ? `?${query}` : ""}`,
    { headers: { cookie: jar.toString() }, cache: "no-store" }
  );

  if (!response.ok) {
    /* Plain text rather than a broken .csv: whatever went wrong, the useful
       thing is that the person sees it rather than opening an empty file. */
    return new Response(
      response.status === 401
        ? "Your session has expired. Sign in again and retry the export."
        : `The export could not be produced (${response.status}).`,
      { status: response.status, headers: { "content-type": "text/plain" } }
    );
  }

  /* Dated so successive exports don't overwrite each other in Downloads. */
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(await response.text(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="inspection-requests-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
