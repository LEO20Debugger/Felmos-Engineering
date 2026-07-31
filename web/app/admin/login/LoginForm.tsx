"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { login, type FormState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" style={{ width: "100%" }} disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {
    ok: false,
  });

  const [visible, setVisible] = useState(false);

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next ?? "/admin"} />

      <label className="adm-field">
        <span>Email</span>
        <span className="adm-inputwrap">
          <Mail size={18} strokeWidth={1.6} aria-hidden />
          <input
            className="adm-input"
            name="email"
            type="email"
            /* inputMode + autoComplete matter more than they look: they decide
               which keyboard a phone shows and whether the password manager
               offers to fill. Getting them wrong makes mobile sign-in tedious. */
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </span>
      </label>

      <label className="adm-field">
        <span>Password</span>
        <span className="adm-inputwrap">
          <Lock size={18} strokeWidth={1.6} aria-hidden />
          <input
            className="adm-input has-trailing"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          {/* type="button" is load-bearing — a button inside a form defaults to
              submit, so without it revealing the password would try to sign in.
              aria-pressed rather than a label swap alone, so a screen reader
              announces the state rather than just the action. */}
          <button
            type="button"
            className="adm-reveal"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            title={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOff size={18} strokeWidth={1.6} aria-hidden />
            ) : (
              <Eye size={18} strokeWidth={1.6} aria-hidden />
            )}
          </button>
        </span>
      </label>

      {state.message ? (
        <p className="adm-error" role="alert" style={{ marginBottom: "0.75rem" }}>
          {state.message}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
