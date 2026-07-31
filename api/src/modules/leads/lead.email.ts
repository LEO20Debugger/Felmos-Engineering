/**
 * The notification an inspection request produces.
 *
 * Written as plain text first and HTML second, because these are read on a
 * phone by someone who needs the number and the location, not a designed
 * newsletter. Both parts carry the same content — some clients show the text
 * version, and a notification that is empty in one of them is a lost lead.
 */

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
  adminUrl: string;
  leadId: number;
};

const escape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildLeadEmail(lead: LeadEmailInput) {
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
  if (lead.landingPath) rows.push(["Page", lead.landingPath]);

  const text = [
    `New inspection request from ${lead.name}.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    lead.message ? `Message:\n${lead.message}` : "No message.",
    "",
    `Reply to this email to answer ${lead.name} directly.`,
    `Open in the dashboard: ${lead.adminUrl}/admin/leads/${lead.leadId}`,
  ].join("\n");

  const html = `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;color:#171e24">
  <h2 style="margin:0 0 4px;font-size:18px">New inspection request</h2>
  <p style="margin:0 0 16px;color:#59626a;font-size:14px">
    From ${escape(lead.name)} · reply to this email to answer them directly.
  </p>

  <table style="border-collapse:collapse;width:100%;font-size:14px">
    ${rows
      .map(
        ([label, value]) => `
      <tr>
        <td style="padding:6px 12px 6px 0;color:#59626a;white-space:nowrap;vertical-align:top">${escape(label)}</td>
        <td style="padding:6px 0"><strong>${escape(value)}</strong></td>
      </tr>`
      )
      .join("")}
  </table>

  ${
    lead.message
      ? `<div style="margin:16px 0;padding:12px;background:#f4f6f7;border-left:3px solid #1b6f97;font-size:14px;white-space:pre-wrap">${escape(
          lead.message
        )}</div>`
      : `<p style="margin:16px 0;color:#767f86;font-size:14px">No message left.</p>`
  }

  <p style="margin:20px 0 0;font-size:13px">
    <a href="${escape(lead.adminUrl)}/admin/leads/${lead.leadId}" style="color:#1b5f85">
      Open in the dashboard
    </a>
  </p>
</div>`.trim();

  return { subject, text, html, replyTo: lead.email };
}
