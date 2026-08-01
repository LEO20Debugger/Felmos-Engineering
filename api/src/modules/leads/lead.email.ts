/**
 * The notification an inspection request produces, sent to staff.
 *
 * Written as plain text first and HTML second, because these are read on a
 * phone by someone who needs the number and the location. The HTML is branded
 * now — this lands beside client correspondence and should not look like a
 * cron job — but the ordering is unchanged: the facts you act on are above the
 * fold, and the message is below them.
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

export type LeadEmailInput = {
  name: string;
  phone: string;
  email: string;
  location: string;
  serviceText: string;
  preferredDate: string | null;
  message: string | null;
  referrerHost: string | null;
  landingPath: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  leadId: number;
};

export function buildLeadEmail(lead: LeadEmailInput, brand: Brand) {
  /* The subject carries the service and the location because that is what
     makes a notification triageable from a lock screen without opening it. */
  const subject = `Inspection request — ${lead.serviceText} — ${lead.location}`;

  const rows: [string, string][] = [
    ["Name", lead.name],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["Location", lead.location],
    ["Service", lead.serviceText],
    ["Preferred date", lead.preferredDate ?? "Not specified"],
  ];

  if (lead.referrerHost) rows.push(["Came from", lead.referrerHost]);
  if (lead.landingPath) rows.push(["Landed on", lead.landingPath]);
  if (lead.utmSource) rows.push(["Campaign source", lead.utmSource]);
  if (lead.utmCampaign) rows.push(["Campaign", lead.utmCampaign]);

  const dashboardLink = `${brand.adminUrl}/admin/leads?lead=${lead.leadId}`;
  const telHref = `tel:${lead.phone.replace(/\s/g, "")}`;

  const text = [
    `New inspection request from ${lead.name}.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    lead.message ? `Message:\n${lead.message}` : "No message.",
    "",
    `Reply to this email to answer ${lead.name} directly.`,
    `Call: ${lead.phone}`,
    `Open in the dashboard: ${dashboardLink}`,
    "",
    ...textFooter(brand),
  ].join("\n");

  const html = layout({
    brand,
    heading: "New inspection request",
    preheader: `From ${lead.name} · ${lead.serviceText} · ${lead.location}`,
    body: `
    ${detailTable(rows)}

    ${
      lead.message
        ? quote(lead.message)
        : `<p style="margin:20px 0;color:#767f86;font-size:14px">No message left.</p>`
    }

    <div style="margin-top:8px">
      ${button(telHref, `Call ${lead.phone}`)}
      ${button(dashboardLink, "Open in dashboard", true)}
    </div>

    <p style="margin:14px 0 0;font-size:13px;line-height:1.5;color:#59626a">
      Replying to this email answers ${escape(lead.name)} directly.
    </p>`,
  });

  return { subject, text, html, replyTo: lead.email };
}
