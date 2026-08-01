/**
 * The shell every outgoing email renders into.
 *
 * Nested tables and inline styles rather than a modern layout, because that is
 * what mail clients actually support: Outlook's renderer is Word's, Gmail
 * strips <style> blocks in some contexts, and flexbox is not available in any
 * of them. This is the boring, portable subset, and it is deliberate.
 *
 * Every email built here has a plain-text twin. Some clients show the text
 * version, and a notification that is empty in one of them is a lost lead.
 */

import type { Brand } from "./brand";

/* The site's own palette, hardcoded because an email cannot read a CSS
   variable — it is delivered to somebody else's client, not rendered by ours. */
const INK = "#171e24";
const MUTED = "#59626a";
const ACCENT = "#1b6f97";
const ACCENT_DARK = "#134c68";
const PAGE = "#eef1f3";
const LINE = "#dde3e7";

/**
 * HTML-escape.
 *
 * Escapes the apostrophe too — every interpolation below sits in a
 * double-quoted attribute or in text, but the cost is nothing and the next
 * person to add a single-quoted attribute should not have to notice.
 */
export const escape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type LayoutInput = {
  brand: Brand;
  /** Sits under the header, one line, sets the reader's expectation. */
  preheader: string;
  heading: string;
  /** Already-escaped HTML for the body of the card. */
  body: string;
};

/** A label/value table — the shape both emails use for their detail block. */
export function detailTable(rows: [string, string][]): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-size:15px;line-height:1.5">
    ${rows
      .map(
        ([label, value], index) => `
    <tr class="em-row">
      <td style="padding:10px 14px 10px 0;color:${MUTED};white-space:nowrap;vertical-align:top;${
        index === 0 ? "" : `border-top:1px solid ${LINE};`
      }">${escape(label)}</td>
      <td style="padding:10px 0;color:${INK};word-break:break-word;${
        index === 0 ? "" : `border-top:1px solid ${LINE};`
      }"><strong>${escape(value)}</strong></td>
    </tr>`
      )
      .join("")}
  </table>`;
}

/** A tap target that survives clients with no CSS support — it is a bordered
    table cell wrapping a link, not a styled <button>. */
export function button(href: string, label: string, secondary = false): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="em-btn" style="border-collapse:separate;display:inline-block;margin:0 8px 8px 0">
    <tr>
      <td style="border-radius:4px;background:${secondary ? "#ffffff" : ACCENT};border:1px solid ${
        secondary ? LINE : ACCENT
      }">
        <a href="${escape(href)}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:600;color:${
          secondary ? INK : "#ffffff"
        };text-decoration:none">${escape(label)}</a>
      </td>
    </tr>
  </table>`;
}

/** A quoted block — the visitor's message, or the note back to them. */
export function quote(text: string): string {
  return `<div style="margin:20px 0;padding:14px 16px;background:#f4f6f7;border:1px solid ${LINE};border-radius:4px;font-size:15px;line-height:1.6;color:${INK};white-space:pre-wrap">${escape(
    text
  )}</div>`;
}

export function layout({ brand, preheader, heading, body }: LayoutInput): string {
  const footerBits = [
    brand.address,
    brand.phone,
    brand.email,
    brand.hours,
  ].filter(Boolean) as string[];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(heading)}</title>
<style>
  /* Every layout rule that matters is inline — Gmail strips <style> in some
     contexts and Outlook's Word renderer ignores media queries entirely, so
     this block may never run. It only ever *tightens* an already-working
     600px-max layout for narrow screens; nothing here is load-bearing.

     The label column is nowrap so "Preferred date" cannot break in half. On a
     360px screen that would squeeze the values, so below 600px the rows stack
     into label-above-value instead. */
  @media only screen and (max-width: 600px) {
    .em-pad { padding: 20px 18px !important; }
    .em-pad-b { padding: 14px 18px 20px !important; }
    .em-head { padding: 16px 18px !important; }
    .em-h1 { font-size: 18px !important; }
    .em-row td { display: block !important; width: 100% !important; border-top: 0 !important; }
    .em-row td:first-child { padding: 10px 0 0 !important; }
    .em-row td:last-child { padding: 0 0 10px !important; border-bottom: 1px solid ${LINE} !important; }
    .em-btn a { display: block !important; text-align: center !important; }
    .em-btn { display: block !important; width: 100% !important; }
  }
  /* Dark mode in clients that honour it — keep the card readable rather than
     letting the client invert our light greys into mud. */
  @media (prefers-color-scheme: dark) {
    .em-body { background: #11171c !important; }
  }
</style>
</head>
<body class="em-body" style="margin:0;padding:0;background:${PAGE};-webkit-font-smoothing:antialiased">

<!-- The preview line in the inbox list. Hidden in the body itself, which is
     why it is followed by padding characters — without them some clients pull
     the next visible text in after it. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(
    preheader
  )}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAGE};padding:24px 12px">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

        <tr>
          <td class="em-head" style="background:${ACCENT_DARK};padding:18px 28px;border-radius:6px 6px 0 0">
            <!-- Logo and wordmark in one row. A nested table rather than an
                 inline-block, because Outlook ignores inline-block; and the
                 name stays as live text beside the image so the header still
                 reads correctly in the many clients that block images by
                 default. -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${
                  brand.logoUrl
                    ? `<td style="padding-right:12px;vertical-align:middle">
                  <img src="${escape(brand.logoUrl)}" width="34" height="34" alt=""
                       style="display:block;width:34px;height:34px;border:0;border-radius:5px">
                </td>`
                    : ""
                }
                <td style="vertical-align:middle">
                  <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:0.02em">${escape(
                    brand.name
                  )}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="em-pad" style="background:#ffffff;padding:28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE}">
            <h1 class="em-h1" style="margin:0 0 6px;font-size:20px;line-height:1.3;color:${INK};font-weight:700">${escape(
              heading
            )}</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:${MUTED}">${escape(
              preheader
            )}</p>
            ${body}
          </td>
        </tr>

        <tr>
          <td class="em-pad-b" style="background:#ffffff;padding:18px 28px 24px;border:1px solid ${LINE};border-top:0;border-radius:0 0 6px 6px">
            <p style="margin:0;font-size:12.5px;line-height:1.6;color:${MUTED}">
              ${footerBits.map((bit) => escape(bit)).join("<br>")}
              ${
                brand.url
                  ? `<br><a href="${escape(brand.url)}" style="color:${ACCENT}">${escape(
                      brand.url.replace(/^https?:\/\//, "")
                    )}</a>`
                  : ""
              }
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** The footer lines, for the plain-text twin. */
export function textFooter(brand: Brand): string[] {
  return [
    "—",
    brand.name,
    ...([brand.address, brand.phone, brand.email, brand.url].filter(
      Boolean
    ) as string[]),
  ];
}
