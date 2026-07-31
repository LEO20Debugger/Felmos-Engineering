import { NextResponse } from "next/server";
import { getServices } from "@/lib/cms";

export const runtime = "nodejs";

/**
 * The service names this form will accept.
 *
 * Read from the same source the dropdown is built from, rather than a static
 * copy: once services are editable, a hardcoded list here would start
 * rejecting the very options the form offers, the moment anyone renamed one.
 * The fetch is cached, so this costs nothing per submission.
 */
async function serviceTitles(): Promise<Set<string>> {
  const services = await getServices();
  return new Set<string>([
    ...services.map((s) => s.title),
    "Not sure — advise me",
  ]);
}

type Payload = {
  name: string;
  phone: string;
  email: string;
  location: string;
  service: string;
  date: string;
  message: string;
  /** Honeypot — real people never fill this in. */
  company?: string;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function validate(body: Partial<Payload>, titles: Set<string>) {
  const errors: Record<string, string> = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(body.name);
  const phone = str(body.phone);
  const email = str(body.email);
  const location = str(body.location);
  const service = str(body.service);
  const date = str(body.date);
  const message = str(body.message);

  if (name.length < 2) errors.name = "Please enter your full name.";
  if (phone.replace(/\D/g, "").length < 7) errors.phone = "Please enter a reachable phone number.";
  if (!isEmail(email)) errors.email = "Please enter a valid email address.";
  if (location.length < 2) errors.location = "Please tell us where the project is.";
  if (!titles.has(service)) errors.service = "Please choose a service.";
  if (date && Number.isNaN(Date.parse(date))) errors.date = "That date doesn't look right.";
  if (message.length > 2000) errors.message = "Please keep the message under 2000 characters.";

  return { errors, clean: { name, phone, email, location, service, date, message } };
}

export async function POST(request: Request) {
  let body: Partial<Payload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request body." }, { status: 400 });
  }

  // Silently accept bot submissions so they don't retry, but do nothing with them.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const { errors, clean } = validate(body, await serviceTitles());
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  /*
   * Forwarded to the API, which stores the enquiry and notifies whoever is on
   * the recipient list.
   *
   * Proxied server-to-server rather than posted straight from the browser, for
   * three reasons: the most important form on the site makes no cross-origin
   * request and needs no CORS; the API's lead endpoint stays behind an internal
   * key instead of being an open spam target; and INTERNAL_API_KEY never
   * reaches client-side code. The cost is one hop on a form submitted a handful
   * of times a day.
   *
   * The visitor's address and user agent are forwarded explicitly — otherwise
   * every enquiry would be attributed to Vercel's egress IP.
   */
  const apiUrl = process.env.API_URL;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (!apiUrl || !internalKey) {
    /* Loud in the log, but still a success to the visitor: they filled the
       form in correctly and there is nothing they can do about our
       configuration. Losing the enquiry is bad; telling them their details
       were wrong is worse. */
    console.error(
      "[contact] API_URL or INTERNAL_API_KEY is not set — enquiry not stored",
      { ...clean, receivedAt: new Date().toISOString() }
    );
    return NextResponse.json({ ok: true });
  }

  try {
    const forwarded = request.headers.get("x-forwarded-for") ?? "";

    const response = await fetch(`${apiUrl}/public/leads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": internalKey,
        "x-visitor-ip": forwarded.split(",")[0]?.trim() ?? "",
        "x-visitor-agent": request.headers.get("user-agent") ?? "",
      },
      body: JSON.stringify({
        ...clean,
        referrer: request.headers.get("referer") ?? undefined,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[contact] API rejected the enquiry (${response.status})`,
        await response.text().catch(() => "")
      );
      /* Same reasoning as above — the submission was valid. */
    }
  } catch (error) {
    console.error("[contact] could not reach the API", error);
  }

  return NextResponse.json({ ok: true });
}
