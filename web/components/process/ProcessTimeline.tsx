"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { processSteps } from "@/lib/content";
import Photo from "@/components/ui/Photo";

/**
 * Desktop view of the six-stage process: a drawn rail that fills as the section
 * enters view, with a large panel showing the selected stage. Auto-advances
 * until the visitor engages, then hands over completely.
 */
export default function ProcessTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);

  /* Draw the rail once, the first time the section is seen. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!drawn || engaged) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only advance at the width where this view is the visible one.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((c) => (c + 1) % processSteps.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [drawn, engaged]);

  const step = processSteps[active];
  const Icon = step.icon;
  const progress = (active / (processSteps.length - 1)) * 100;

  /* Clamped rather than wrapping. The auto-advance loops, but it has already
     stood down by the time these are usable — driving them marks the visitor as
     engaged. Six numbered stages read as a sequence, not a carousel, so landing
     back on "Submit request" after "Recommendations" would feel like a fault
     rather than a loop. The ends simply disable, which .btn:disabled styles. */
  const atStart = active === 0;
  const atEnd = active === processSteps.length - 1;

  const go = (delta: number) => {
    setEngaged(true);
    const target = Math.min(processSteps.length - 1, Math.max(0, active + delta));
    setActive(target);

    /* Stepping onto the last stage disables the button that got you there, and
       a disabled element cannot hold focus — the browser drops it to <body>, so
       a keyboard user loses their place mid-sequence. Hand focus to the button
       that is still live. Guarded on the press having come from the keyboard or
       the button itself, so a mouse user never gets an unexpected focus ring. */
    const landingOnEnd = target === 0 || target === processSteps.length - 1;
    if (!landingOnEnd) return;
    const leaving = delta > 0 ? nextRef.current : prevRef.current;
    if (document.activeElement !== leaving) return;
    (delta > 0 ? prevRef.current : nextRef.current)?.focus();
  };

  return (
    <div
      ref={sectionRef}
      className="hidden lg:block"
      onMouseEnter={() => setEngaged(true)}
      onFocusCapture={() => setEngaged(true)}
    >
      {/* ── the rail ── */}
      <div
        className="relative pb-2 pt-10"
        role="tablist"
        aria-label="Process stages"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setActive((c) => Math.min(processSteps.length - 1, c + 1));
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            setActive((c) => Math.max(0, c - 1));
          }
        }}
      >
        {/* base line, drawn left-to-right on first view */}
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[52px] h-px origin-left bg-divider transition-transform duration-[1100ms] ease-[var(--ease-out-quint)]"
          style={{ transform: `scaleX(${drawn ? 1 : 0})` }}
        />
        {/* accent fill up to the active node */}
        <span
          aria-hidden
          className="absolute left-0 top-[52px] h-px bg-accent transition-[width] duration-700 ease-[var(--ease-out-quint)]"
          style={{ width: drawn ? `${progress}%` : "0%" }}
        />

        <ol className="m-0 grid list-none grid-cols-6 gap-3 p-0">
          {processSteps.map((s, i) => {
            const state = i === active ? "active" : i < active ? "done" : "todo";
            return (
              <li key={s.num} className="min-w-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-controls="process-panel"
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                  style={{ transitionDelay: drawn ? `${i * 110}ms` : "0ms" }}
                  className={`group flex w-full flex-col items-start gap-3 text-left transition-opacity duration-500 ${
                    drawn ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span
                    className={`grid h-[26px] w-[26px] flex-none place-items-center border font-mono text-[11px] transition-all duration-300 ${
                      state === "active"
                        ? "scale-110 border-accent bg-accent text-on-dark"
                        : state === "done"
                          ? "border-accent bg-bg text-link"
                          : "border-divider bg-bg text-ink/50 group-hover:border-accent-400"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span
                    className={`font-heading text-[15.5px] uppercase leading-tight transition-colors duration-300 ${
                      i === active ? "text-link" : "text-ink group-hover:text-link"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── the panel ── */}
      <div
        id="process-panel"
        role="tabpanel"
        aria-live="polite"
        className="mt-10 grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-center gap-14"
      >
        <figure key={`img-${active}`} className="relative animate-[fx-fade_0.55s_var(--ease-out-quint)_both]">
          <Photo src={step.image} alt={step.title} ratio="3/2" sizes="52vw" />
        </figure>

        <div>
          {/* Keyed so each stage re-runs the entrance animation. Everything
              inside is therefore REMOUNTED on every change — which is why the
              controls below sit outside it. Inside, the button would be
              destroyed by its own click and focus would fall back to <body>,
              breaking a second press and every keyboard user. */}
          <div key={`txt-${active}`} className="animate-[fx-rise_0.55s_var(--ease-out-quint)_both]">
            <div className="mb-4 flex items-center gap-3">
              <Icon size={30} strokeWidth={1.5} className="text-link" />
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-link">
                Stage {step.num} · {step.meta}
              </span>
            </div>
            <h3 className="m-0 text-[clamp(26px,2.4vw,34px)] uppercase">{step.title}</h3>
            <p className="mt-4 max-w-[42ch] text-[16px] leading-[1.6] opacity-80">{step.line}</p>
            <Link href="/contact" className="btn btn-primary mt-6 no-underline">
              Start at stage 01
              <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
          </div>

          {/* Deliberately not role="tab" and outside the tablist above: these
              move the selection, they aren't part of it. A tablist may only
              contain tabs, and announcing eight tabs for six stages would be a
              lie to a screen reader. */}
          <div className="mt-8 flex items-center justify-end gap-2">
            <button
              ref={prevRef}
              type="button"
              onClick={() => go(-1)}
              disabled={atStart}
              aria-controls="process-panel"
              aria-label="Previous stage"
              className="btn btn-secondary btn-icon"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              ref={nextRef}
              type="button"
              onClick={() => go(1)}
              disabled={atEnd}
              aria-controls="process-panel"
              aria-label="Next stage"
              className="btn btn-secondary btn-icon"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
