"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send, Star } from "lucide-react";

import Toast, { type ToastMessage } from "@/components/ui/Toast";

type Errors = Record<string, string>;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Mirrors app/api/reviews/route.ts so the visitor sees problems before the
    round trip. The route's copy is the one that actually guards the API. */
function validate(data: Record<string, string>): Errors {
  const e: Errors = {};
  const rating = Number(data.rating);

  if (data.author.trim().length < 2) e.author = "Please enter your name.";
  if (!isEmail(data.submitterEmail.trim())) {
    e.submitterEmail = "Please enter a valid email address.";
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    e.rating = "Please choose a rating.";
  }
  if (data.quote.trim().length < 1) e.quote = "Please write a few words.";
  if (data.quote.trim().length > 2000) {
    e.quote = "Please keep the review under 2000 characters.";
  }

  return e;
}

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && (
        <p className="m-0 mt-1.5 text-[12.5px] opacity-60">{hint}</p>
      )}
      {error && (
        <p
          id={`${name}-error`}
          className="m-0 mt-1.5 flex items-center gap-1.5 text-[12.5px] text-danger"
        >
          <AlertCircle size={14} strokeWidth={1.5} className="flex-none" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The rating input.
 *
 * Five real radios, visually replaced by stars — not a row of buttons holding
 * state. It arrives in the FormData like every other field, it is reachable
 * with the arrow keys because that is what a radio group does, and it works
 * before hydration.
 *
 * `hover` is tracked so the stars fill as the pointer crosses them, which is
 * the affordance that tells people this is a control at all. Falls back to the
 * selected value whenever the pointer is elsewhere.
 */
function RatingInput({
  value,
  onChange,
  invalid,
}: {
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset
      className="m-0 border-0 p-0"
      onMouseLeave={() => setHover(0)}
      aria-describedby={invalid ? "rating-error" : undefined}
    >
      <legend className="sr-only">Rating, from 1 to 5 stars</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer p-0.5"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <Star
              size={28}
              strokeWidth={1.5}
              aria-hidden
              className={n <= shown ? "text-link" : "text-divider"}
              fill={n <= shown ? "currentColor" : "none"}
            />
            <span className="sr-only">
              {n} star{n === 1 ? "" : "s"}
            </span>
          </label>
        ))}
        {value > 0 && (
          <span className="ml-2 text-[13px] opacity-60">{value} of 5</span>
        )}
      </div>
    </fieldset>
  );
}

export default function ReviewForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle"
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = (text: string, ok: boolean) =>
    setToast({ text, ok, key: Date.now() });

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

    const found = validate({ ...data, rating: String(rating) });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      notify("Please check the highlighted fields.", false);
      return;
    }

    setStatus("sending");
    setFailure(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, rating }),
      });
      const json = await res.json();

      if (!res.ok) {
        setErrors(json.errors ?? {});
        setStatus("failed");
        /* The route distinguishes a validation problem from an outage, and the
           two need different words — "check the highlighted fields" is useless
           advice when nothing is highlighted. */
        setFailure(json.errors ? null : json.error ?? null);
        notify(
          json.errors
            ? "Please check the highlighted fields."
            : json.error ?? "Couldn't save your review.",
          false
        );
        return;
      }

      setStatus("sent");
      notify("Thank you — your review has been received.", true);
      formRef.current?.reset();
      setRating(0);
    } catch {
      setStatus("failed");
      setFailure("Couldn't save your review just now. Please try again later.");
      notify("Couldn't save your review just now.", false);
    }
  }

  if (status === "sent") {
    return (
      <div className="relative flex flex-col items-start gap-4 p-8">
        <CheckCircle2 size={34} strokeWidth={1.5} className="text-link" />
        <h2 className="m-0 font-heading text-[22px] uppercase">Review received</h2>
        {/* Says plainly that it is not live yet. Without this people check the
            page, see nothing, and submit the same review again. */}
        <p className="m-0 max-w-[46ch] text-[15px] leading-[1.6] opacity-80">
          Thank you. We read every review before it goes on the site, so it will
          appear here shortly rather than straight away.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn btn-secondary mt-1"
        >
          Leave another review
        </button>
        <Toast message={toast} />
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
      {/* Honeypot — off-screen, not display:none, so bots still fill it. Named
          `website` because `company` is a real field on this form. */}
      <div
        aria-hidden
        className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field label="Your Rating" name="rating" error={errors.rating}>
        <RatingInput
          value={rating}
          onChange={setRating}
          invalid={Boolean(errors.rating)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Your Name" name="author" error={errors.author}>
          <input
            {...fieldProps("author")}
            type="text"
            autoComplete="name"
            placeholder="Jane Okafor"
            required
          />
        </Field>
        <Field
          label="Email Address"
          name="submitterEmail"
          error={errors.submitterEmail}
          hint="Not published — we only use it to verify the review."
        >
          <input
            {...fieldProps("submitterEmail")}
            type="email"
            autoComplete="email"
            placeholder="jane@company.com"
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Role (optional)" name="role" error={errors.role}>
          <input {...fieldProps("role")} type="text" placeholder="Property Developer" />
        </Field>
        <Field label="Company (optional)" name="company" error={errors.company}>
          <input {...fieldProps("company")} type="text" placeholder="Okafor Estates" />
        </Field>
      </div>

      <Field label="Your Review" name="quote" error={errors.quote}>
        <textarea
          {...fieldProps("quote")}
          rows={5}
          maxLength={2000}
          placeholder="What did we do, and how did it go?"
          required
        />
      </Field>

      {status === "failed" && (
        <p
          role="alert"
          className="m-0 flex items-center gap-2 border border-danger p-3 text-[13.5px] text-danger"
        >
          <AlertCircle size={16} strokeWidth={1.5} className="flex-none" />
          {failure ?? "Please check the highlighted fields and try again."}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary btn-block mt-1"
      >
        {status === "sending" ? (
          <>
            <Loader2 size={18} strokeWidth={1.5} className="spin" />
            Sending…
          </>
        ) : (
          <>
            <Send size={18} strokeWidth={1.5} />
            Submit Review
          </>
        )}
      </button>

      <p className="m-0 text-center text-[12.5px] opacity-60">
        Reviews are checked before they appear on the site.
      </p>

      <Toast message={toast} />
    </form>
  );
}
