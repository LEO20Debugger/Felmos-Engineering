"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Floating confirmation for the public site.
 *
 * The booking form already swaps itself for a success panel, which is the
 * stronger confirmation and stays put. This is for the moment before that
 * registers — and, more importantly, for failures, where the inline banner sits
 * above a submit button the visitor is already looking away from.
 *
 * Hand-rolled for the same reason as the dashboard's version: one message at a
 * time, driven by local state, about forty lines. A toast library would add a
 * provider, a portal and a dependency to a site whose entire runtime is React
 * plus lucide.
 */

export type ToastMessage = {
  text: string;
  ok: boolean;
  /** Bumped on every fire so two identical messages in a row both show. */
  key: number;
};

export default function Toast({ message }: { message: ToastMessage | null }) {
  const [visible, setVisible] = useState(false);
  /* Portals need a DOM, so this stays false through the server render and the
     hydration pass, and flips on the client. */
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!message) return;

    setVisible(true);

    /* Errors linger: a failure usually needs reading and acting on, whereas a
       success only needs acknowledging. */
    const timer = setTimeout(() => setVisible(false), message.ok ? 4000 : 7000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message || !mounted) return null;

  /**
   * Rendered into <body>, not where it is written.
   *
   * `position: fixed` is relative to the nearest ancestor with a transform,
   * filter or backdrop-filter — not to the viewport. The contact form sits
   * inside a wrapper carrying a scroll animation, so left in place this pinned
   * itself to the bottom of the form panel and rendered off-screen at a third
   * of its width. A portal is the only reliable fix; it is also why every
   * toast library ships one.
   */
  return createPortal(
    <div
      className={`site-toast ${visible ? "is-visible" : ""} ${
        message.ok ? "is-ok" : "is-bad"
      }`}
      /* polite, not assertive: this should not interrupt a screen reader
         mid-sentence, and the form's own success panel carries the same news
         in the document itself. */
      role="status"
      aria-live="polite"
    >
      {message.ok ? (
        <CheckCircle2 size={19} strokeWidth={1.8} aria-hidden />
      ) : (
        <XCircle size={19} strokeWidth={1.8} aria-hidden />
      )}
      <span>{message.text}</span>
    </div>,
    document.body
  );
}
