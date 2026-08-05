import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = {
  author: string;
  submitterEmail: string;
  rating: number;
  quote: string;
  role?: string;
  company?: string;
  /** Honeypot — real people never fill this in. Named `website` rather than
      `company`, which this form uses as a real field. */
  website?: string;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/**
 * Mirrors the API's zod schema.
 *
 * Both run: this copy gives instant field-level feedback, the API's is the
 * actual guarantee — this route is only one of the ways a request can arrive.
 */
function validate(body: Partial<Payload>) {
  const errors: Record<string, string> = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const author = str(body.author);
  const submitterEmail = str(body.submitterEmail);
  const quote = str(body.quote);
  const role = str(body.role);
  const company = str(body.company);
  const rating = Number(body.rating);

  if (author.length < 2) errors.author = "Please enter your name.";
  if (!isEmail(submitterEmail)) {
    errors.submitterEmail = "Please enter a valid email address.";
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Please choose a rating.";
  }
  if (quote.length < 1) errors.quote = "Please write a few words.";
  if (quote.length > 2000) {
    errors.quote = "Please keep the review under 2000 characters.";
  }
  if (role.length > 160) errors.role = "That role is too long.";
  if (company.length > 160) errors.company = "That company name is too long.";

  return {
    errors,
    clean: {
      author,
      submitterEmail,
      rating,
      quote,
      role: role || null,
      company: company || null,
    },
  };
}

export async function POST(request: Request) {
  let body: Partial<Payload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed request body." },
      { status: 400 }
    );
  }

  // Silently accept bot submissions so they don't retry, but do nothing with them.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const { errors, clean } = validate(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  /*
   * Proxied server-to-server for the same three reasons the contact form is:
   * no cross-origin request from the browser, the API's endpoint stays behind
   * an internal key rather than being an open spam target, and
   * INTERNAL_API_KEY never reaches client-side code.
   *
   * Where this differs from /api/contact: a failure here is reported to the
   * visitor. A lost enquiry still has a phone number on the page as a fallback
   * and telling someone their correct details were wrong would cost the job;
   * a lost review has no fallback at all, and silently returning success would
   * leave someone believing they had left a review that does not exist.
   */
  const apiUrl = process.env.API_URL;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (!apiUrl || !internalKey) {
    console.error(
      "[reviews] API_URL or INTERNAL_API_KEY is not set — review not stored",
      { author: clean.author, receivedAt: new Date().toISOString() }
    );
    return NextResponse.json(
      { ok: false, error: "We couldn't save your review just now. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const forwarded = request.headers.get("x-forwarded-for") ?? "";

    const response = await fetch(`${apiUrl}/public/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": internalKey,
        "x-visitor-ip": forwarded.split(",")[0]?.trim() ?? "",
        "x-visitor-agent": request.headers.get("user-agent") ?? "",
      },
      body: JSON.stringify(clean),
      cache: "no-store",
    });

    if (!response.ok) {
      /* Field errors from the API's own validation are worth relaying — they
         are the same messages this route would have produced, and a mismatch
         between the two copies should be visible rather than generic. */
      if (response.status === 422) {
        const data = (await response.json().catch(() => null)) as {
          errors?: Record<string, string>;
        } | null;

        if (data?.errors) {
          return NextResponse.json(
            { ok: false, errors: data.errors },
            { status: 422 }
          );
        }
      }

      /* The API throttles submissions per minute. Say so, rather than showing
         the same "something went wrong" as a real outage. */
      if (response.status === 429) {
        return NextResponse.json(
          { ok: false, error: "That's a few reviews in quick succession. Please try again in a minute." },
          { status: 429 }
        );
      }

      console.error(
        `[reviews] API rejected the review (${response.status})`,
        await response.text().catch(() => "")
      );

      return NextResponse.json(
        { ok: false, error: "We couldn't save your review just now. Please try again later." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[reviews] could not reach the API", error);
    return NextResponse.json(
      { ok: false, error: "We couldn't save your review just now. Please try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
