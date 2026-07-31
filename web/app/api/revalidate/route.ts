import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

/**
 * Called by the API when content changes, so an edit appears on the live site
 * within seconds instead of waiting out the hour-long cache or needing a
 * redeploy.
 *
 * ⚠️ revalidateTag only affects the deployment that executes it. The API must
 * call the production URL — pointing it at a preview alias makes edits appear
 * to do nothing, with no error anywhere to explain why.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Revalidation is not configured." },
      { status: 503 }
    );
  }

  const presented = request.headers.get("x-revalidate-secret") ?? "";

  /* Constant-time, and length-checked first because timingSafeEqual throws on
     a mismatch. A plain === would leak the secret's prefix through response
     timing, one byte at a time. */
  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { tags?: string[]; paths?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad body." }, { status: 400 });
  }

  const tags = body.tags ?? [];
  const paths = body.paths ?? [];

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, tags, paths });
}
