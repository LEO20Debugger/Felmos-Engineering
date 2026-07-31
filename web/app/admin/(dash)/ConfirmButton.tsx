"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A destructive button that asks before it acts.
 *
 * Two-step in place rather than window.confirm(): the native dialog is
 * unstyleable, reads as a browser warning rather than part of the app, and on
 * mobile appears at the top of the screen far from the button that triggered
 * it. This keeps the decision where the finger already is.
 *
 * It reverts on its own after a few seconds, so a half-pressed delete never
 * sits there armed waiting for a stray click.
 */
export function ConfirmButton({
  children,
  confirmLabel = "Tap again to confirm",
  className = "adm-btn adm-btn-danger",
}: {
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!armed) return;
    timer.current = setTimeout(() => setArmed(false), 5000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed]);

  if (pending) {
    return (
      <button className={className} disabled>
        Working…
      </button>
    );
  }

  /* Until armed this is type="button", so the first press cannot submit even
     if the click lands oddly or a keyboard Enter reaches it. Only the armed
     state is a real submit button. */
  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {children}
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
      <button type="submit" className={className} autoFocus>
        {confirmLabel}
      </button>
      <button
        type="button"
        className="adm-btn adm-btn-ghost"
        onClick={() => setArmed(false)}
      >
        Cancel
      </button>
    </span>
  );
}
