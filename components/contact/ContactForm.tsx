"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { services } from "@/lib/content";

const SERVICE_OPTIONS = [...services.map((s) => s.title), "Not sure — advise me"];

type Errors = Record<string, string>;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Mirrors app/api/contact/route.ts so the visitor sees problems before the round trip. */
function validate(data: Record<string, string>): Errors {
  const e: Errors = {};
  if (data.name.trim().length < 2) e.name = "Please enter your full name.";
  if (data.phone.replace(/\D/g, "").length < 7) e.phone = "Please enter a reachable phone number.";
  if (!isEmail(data.email.trim())) e.email = "Please enter a valid email address.";
  if (data.location.trim().length < 2) e.location = "Please tell us where the project is.";
  if (!SERVICE_OPTIONS.includes(data.service)) e.service = "Please choose a service.";
  return e;
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {error && (
        <p id={`${name}-error`} className="m-0 mt-1.5 flex items-center gap-1.5 text-[12.5px] text-[#b4433a]">
          <AlertCircle size={14} strokeWidth={1.5} className="flex-none" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const fieldProps = (name: string) => ({
    id: name,
    name,
    className: "input",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;

    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move the visitor to the first thing that needs fixing.
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.errors ?? {});
        setStatus("failed");
        return;
      }
      setStatus("sent");
      formRef.current?.reset();
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="relative flex flex-col items-start gap-4 p-8">
        <CheckCircle2 size={34} strokeWidth={1.5} className="text-accent-700" />
        <h2 className="m-0 font-heading text-[22px] uppercase">Request received</h2>
        <p className="m-0 max-w-[42ch] text-[15px] leading-[1.6] opacity-80">
          One of our engineers will confirm scope and scheduling within one business day.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="btn btn-secondary mt-1">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative flex flex-col gap-4 p-5 sm:p-7"
    >

      {/* Honeypot — off-screen, not display:none, so bots still fill it. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" name="name" error={errors.name}>
          <input {...fieldProps("name")} type="text" autoComplete="name" placeholder="Jane Okafor" required />
        </Field>
        <Field label="Phone Number" name="phone" error={errors.phone}>
          <input {...fieldProps("phone")} type="tel" autoComplete="tel" placeholder="+234 801 234 5678" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email Address" name="email" error={errors.email}>
          <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="jane@company.com" required />
        </Field>
        <Field label="Project Location" name="location" error={errors.location}>
          <input {...fieldProps("location")} type="text" placeholder="Site address or city" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Service Required" name="service" error={errors.service}>
          <select {...fieldProps("service")} defaultValue={SERVICE_OPTIONS[0]}>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preferred Date" name="date" error={errors.date}>
          <input {...fieldProps("date")} type="date" />
        </Field>
      </div>

      <Field label="Message (optional)" name="message" error={errors.message}>
        <textarea
          {...fieldProps("message")}
          rows={4}
          placeholder="Anything else we should know about the site or project"
        />
      </Field>

      {status === "failed" && (
        <p role="alert" className="m-0 flex items-center gap-2 border border-[#b4433a] p-3 text-[13.5px] text-[#b4433a]">
          <AlertCircle size={16} strokeWidth={1.5} className="flex-none" />
          {Object.keys(errors).length
            ? "Please check the highlighted fields and try again."
            : "Something went wrong sending your request. Please call us instead."}
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-primary btn-block mt-1">
        {status === "sending" ? (
          <>
            <Loader2 size={18} strokeWidth={1.5} className="spin" />
            Sending…
          </>
        ) : (
          <>
            <Send size={18} strokeWidth={1.5} />
            Submit Inspection Request
          </>
        )}
      </button>

      <p className="m-0 text-center text-[12.5px] opacity-60">
        We reply within one business day. No obligation.
      </p>
    </form>
  );
}
