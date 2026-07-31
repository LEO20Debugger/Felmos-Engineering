"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { uploadMedia, type FormState } from "../../actions";
import { Toast } from "../Toast";

function Submit({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" disabled={pending || !ready}>
      {pending ? "Uploading…" : "Upload"}
    </button>
  );
}

export function UploadForm() {
  const [state, action] = useActionState<FormState, FormData>(uploadMedia, {
    ok: false,
  });

  const [fileName, setFileName] = useState("");
  const [alt, setAlt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={action}
      className="adm-card"
      style={{ padding: "1rem", marginBottom: "1.25rem" }}
    >
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div>
          <input
            ref={inputRef}
            type="file"
            name="file"
            /* Restricts the picker to formats the server accepts. The server
               re-checks the actual bytes regardless — this is a convenience,
               not a control. */
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="adm-btn adm-btn-ghost"
            onClick={() => inputRef.current?.click()}
          >
            {fileName || "Choose an image…"}
          </button>
        </div>

        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Describe the image</span>
          <input
            className="adm-input"
            name="alt"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="e.g. Engineer taking a reading on a bridge deck"
            maxLength={300}
          />
          <span className="adm-muted" style={{ fontSize: "0.75rem" }}>
            Read aloud by screen readers and used by search engines. Required —
            it never gets added later.
          </span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Submit ready={Boolean(fileName) && alt.trim().length > 0} />
          {!state.ok && state.message ? (
            <span className="adm-error" style={{ margin: 0 }}>
              {state.message}
            </span>
          ) : null}
        </div>

        <Toast state={state} />
      </div>
    </form>
  );
}
