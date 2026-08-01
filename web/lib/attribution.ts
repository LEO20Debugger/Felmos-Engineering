/**
 * Where an enquiry came from.
 *
 * Captured on landing rather than at submit, and that timing is the whole
 * point: someone arrives at /?utm_source=google, reads two pages, and only
 * then opens /contact. By the time the form is submitted the query string is
 * long gone and `location.pathname` is "/contact" — which is the page they
 * enquired on, not the page that brought them. Both are worth knowing; only
 * the first is hard to recover.
 *
 * sessionStorage rather than a cookie: this is first-party analytics for a form
 * the visitor is choosing to submit, it never leaves the tab until they do
 * submit, and it disappears when the tab closes. No banner required, nothing to
 * consent to.
 */

const KEY = "felmos:attribution";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type Attribution = {
  landingPath: string;
  utm: Record<string, string>;
};

/**
 * Record the first page of this session, once.
 *
 * Idempotent by design — it runs on every client-side navigation, and the
 * second call must not overwrite the landing page with wherever the visitor
 * has since wandered.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    if (window.sessionStorage.getItem(KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utm[key] = value.slice(0, 120);
    }

    const value: Attribution = {
      landingPath: `${window.location.pathname}${window.location.search}`.slice(0, 300),
      utm,
    };

    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Private browsing modes can throw on write. Attribution is a nice-to-have
       on top of the enquiry itself — never let it break the page. */
  }
}

/** Read it back at submit time. Returns nulls rather than throwing when there
    is nothing stored, so the caller can spread it into the payload blindly. */
export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Attribution>;
    if (typeof parsed?.landingPath !== "string") return null;

    return {
      landingPath: parsed.landingPath,
      utm: parsed.utm && typeof parsed.utm === "object" ? parsed.utm : {},
    };
  } catch {
    return null;
  }
}
