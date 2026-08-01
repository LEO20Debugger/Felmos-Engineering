"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { captureAttribution } from "@/lib/attribution";

/**
 * Records the session's landing page and campaign parameters.
 *
 * Renders nothing — it exists because the capture has to happen in the browser
 * on the *first* page of a visit, and the site layout is a server component.
 *
 * Deliberately does not use `useSearchParams`: reading it here would opt every
 * page under (site) out of static rendering, which is a real cost across a
 * marketing site for a value the effect can read straight off `window`.
 * `usePathname` is enough to re-run on navigation, and `captureAttribution` is
 * idempotent so a later run never overwrites the landing page.
 */
export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
  }, [pathname]);

  return null;
}
