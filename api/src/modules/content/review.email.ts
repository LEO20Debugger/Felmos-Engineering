/**
 * The notification a new review produces, sent to staff.
 *
 * Same construction as lead.email.ts — plain text first, HTML second — but a
 * different job. A lead is read on a phone by someone who needs to call back;
 * this is read by someone deciding whether to publish, so the quote and the
 * rating are the content and the dashboard link is the only action.
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

export type ReviewEmailInput = {
  author: string;
  role: string | null;
  company: string | null;
  rating: number;
  quote: string;
  submitterEmail: string;
  reviewId: number;
};

/** "★★★★☆" — five glyphs, so a four and a five are distinguishable at a
    glance rather than by reading a number. */
const stars = (rating: number): string =>
  "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));

export function buildReviewEmail(review: ReviewEmailInput, brand: Brand) {
  /* The rating is in the subject because it decides how the notification is
     triaged: a five-star review can wait until the afternoon, a one-star one
     cannot. */
  const subject = `New review — ${stars(review.rating)} from ${review.author}`;

  const rows: [string, string][] = [
    ["Rating", `${stars(review.rating)}  (${review.rating} out of 5)`],
    ["Name", review.author],
  ];

  if (review.role) rows.push(["Role", review.role]);
  if (review.company) rows.push(["Company", review.company]);
  rows.push(["Email", review.submitterEmail]);

  const dashboardLink = `${brand.adminUrl}/admin/reviews/${review.reviewId}`;

  const text = [
    `${review.author} left a ${review.rating}-star review.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Review:\n${review.quote}`,
    "",
    "It is not published yet — approve it in the dashboard to put it on the site.",
    `Open it: ${dashboardLink}`,
    "",
    ...textFooter(brand),
  ].join("\n");

  const html = layout({
    brand,
    heading: "New review awaiting approval",
    preheader: `${stars(review.rating)} from ${review.author}${
      review.company ? ` · ${review.company}` : ""
    }`,
    body: `
    ${detailTable(rows)}

    ${quote(review.quote)}

    <div style="margin-top:8px">
      ${button(dashboardLink, "Review and approve")}
    </div>

    <p style="margin:14px 0 0;font-size:13px;line-height:1.5;color:#59626a">
      This is not on the site yet. Nothing appears publicly until you approve it.
      Replying to this email answers ${escape(review.author)} directly.
    </p>`,
  });

  return { subject, text, html, replyTo: review.submitterEmail };
}
