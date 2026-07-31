"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import type { FormState } from "../actions";

/**
 * Floating confirmation for a form action.
 *
 * Replaces the inline "Saved." text, which sat below a long form and was
 * routinely missed — leaving people unsure whether a save had worked and
 * pressing the button again.
 *
 * Hand-rolled rather than pulling in a toast library: this needs one message
 * at a time, tied to a server action's returned state, and that is about
 * thirty lines. A library would add a provider, a portal and a dependency for
 * the same result.
 */
export function Toast({ state }: { state: FormState }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(true);

  /* A ref, because two saves in a row can return the identical message and
     the toast still has to reappear — comparing text alone would swallow the
     second one. Server actions return a fresh object each time, so identity
     is the reliable signal. */
  const seen = useRef<FormState | null>(null);

  useEffect(() => {
    if (!state.message || state === seen.current) return;

    seen.current = state;
    setMessage(state.message);
    setOk(state.ok);
    setVisible(true);

    /* Errors linger: a failure usually needs reading and acting on, whereas a
       success only needs acknowledging. */
    const timer = setTimeout(() => setVisible(false), state.ok ? 3000 : 7000);
    return () => clearTimeout(timer);
  }, [state]);

  if (!message) return null;

  return (
    <div
      className={`adm-toast ${visible ? "is-visible" : ""} ${ok ? "is-ok" : "is-bad"}`}
      /* polite, not assertive: a save confirmation should not interrupt a
         screen reader mid-sentence. */
      role="status"
      aria-live="polite"
    >
      {ok ? (
        <CheckCircle2 size={18} strokeWidth={1.8} aria-hidden />
      ) : (
        <XCircle size={18} strokeWidth={1.8} aria-hidden />
      )}
      <span>{message}</span>
    </div>
  );
}
