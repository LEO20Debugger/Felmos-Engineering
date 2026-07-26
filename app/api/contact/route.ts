import { NextResponse } from "next/server";
import { services } from "@/lib/content";

export const runtime = "nodejs";

const SERVICE_TITLES = new Set<string>([
  ...services.map((s) => s.title),
  "Not sure — advise me",
]);

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

function validate(body: Partial<Payload>) {
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
  if (!SERVICE_TITLES.has(service)) errors.service = "Please choose a service.";
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

  const { errors, clean } = validate(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  /*
   * Delivery is deliberately not wired up yet — drop your provider in here.
   *
   *   Resend:   await resend.emails.send({ to: site.email, subject: …, text: … })
   *   SendGrid / Postmark / a CRM webhook all slot in the same way.
   *
   * Until then the request is logged server-side and the visitor gets a real
   * success state, so the form is never silently broken in development.
   */
  console.info("[contact] inspection request", {
    ...clean,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
