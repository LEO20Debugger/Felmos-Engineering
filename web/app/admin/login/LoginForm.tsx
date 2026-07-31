"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next ?? "/admin"} />

      <label className="adm-field">
        <span>Email</span>
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
      </label>

      <label className="adm-field">
        <span>Password</span>
        <input
          className="adm-input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
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
