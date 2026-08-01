/**
 * The auto-reply the person who booked receives.
 *
 * Its job is to close the loop. Someone has just handed over a phone number and
 * an address and watched a form clear itself; until something lands in their
 * inbox they have no evidence it went anywhere. So this echoes back exactly
 * what was received — if they mistyped the site address, they find out now
 * rather than when nobody turns up.
 *
 * Deliberately not a sales email. No attachments, no tracking, no offers: those
 * are what get an auto-reply filtered, and this one needs to arrive.
 */

import type { Brand } from "@/modules/mail/brand";
import {
  button,
  detailTable,
  escape,
  layout,
  quote,
  textFooter,
} from "@/modules/mail/email.layout";

export type ConfirmationInput = {
  name: string;
  phone: string;
  location: string;
  serviceText: string;
  preferredDate: string | null;
  message: string | null;
};

/** The first name, for the greeting. Falls back to the whole string, which is
    right for a single-word name and harmless for anything unexpected. */
const firstName = (full: string): string => full.trim().split(/\s+/)[0] || full;

export function buildConfirmationEmail(lead: ConfirmationInput, brand: Brand) {
  const subject = `We've received your inspection request — ${brand.name}`;

  const rows: [string, string][] = [
    ["Service", lead.serviceText],
    ["Location", lead.location],
    ["Preferred date", lead.preferredDate ?? "No preference given"],
    ["Phone we'll call", lead.phone],
  ];

  const contactLines = [
    brand.phone ? `Call us: ${brand.phone}` : null,
    brand.email ? `Email us: ${brand.email}` : null,
  ].filter(Boolean) as string[];

  const text = [
    `Hi ${firstName(lead.name)},`,
    "",
    `Thank you for your inspection request. It has reached our team and one of our engineers will be in touch within one business day to confirm scope and scheduling.`,
    "",
    "Here is what we received:",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    ...(lead.message ? [`Your message:`, lead.message, ""] : []),
    "If any of that is wrong, just reply to this email and we'll correct it.",
    ...(contactLines.length > 0 ? ["", ...contactLines] : []),
    "",
    ...textFooter(brand),
  ].join("\n");

  /* WhatsApp needs a bare international number. Built from phoneHref where the
     dashboard has one, since that is the field already stored in dial format. */
  const waNumber = (brand.phoneHref ?? brand.phone ?? "").replace(/\D/g, "");

  const html = layout({
    brand,
    heading: `Thank you, ${firstName(lead.name)} — we've got your request`,
    preheader:
      "One of our engineers will confirm scope and scheduling within one business day.",
    body: `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#171e24">
      Your inspection request has reached our team. One of our engineers will be
      in touch <strong>within one business day</strong> to confirm scope and
      scheduling. There is nothing you need to do in the meantime.
    </p>

    <p style="margin:0 0 10px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#59626a">
      What we received
    </p>
    ${detailTable(rows)}

    ${lead.message ? quote(lead.message) : ""}

    <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#171e24">
      If any of that looks wrong, reply to this email and we'll correct it.
    </p>

    ${
      brand.phone || waNumber
        ? `<div style="margin-top:18px">
      ${brand.phone ? button(`tel:${(brand.phoneHref ?? brand.phone).replace(/\s/g, "")}`, `Call ${brand.phone}`) : ""}
      ${waNumber ? button(`https://wa.me/${waNumber}`, "Message on WhatsApp", true) : ""}
    </div>`
        : ""
    }

    <p style="margin:22px 0 0;font-size:12.5px;line-height:1.6;color:#767f86">
      You're receiving this because an inspection request was submitted at
      ${brand.url ? `<a href="${escape(brand.url)}" style="color:#1b6f97">${escape(brand.url.replace(/^https?:\/\//, ""))}</a>` : escape(brand.name)}
      using this email address. If that wasn't you, you can ignore this message.
    </p>`,
  });

  /* Replies come back to the business, not to the enquirer's own address. */
  return { subject, text, html, replyTo: brand.email ?? undefined };
}
