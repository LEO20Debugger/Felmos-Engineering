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
    setActive((c) => Math.min(processSteps.length - 1, Math.max(0, c + delta)));
  };

  return (
    <div
      ref={sectionRef}
      className="hidden lg:block"
      onMouseEnter={() => setEngaged(true)}
      onFocusCapture={() => setEngaged(true)}
    >
      {/* ── back / forward ──
          Deliberately OUTSIDE the tablist below: a role="tablist" may only
          contain role="tab" children, so putting these inside it would make the
          six stages unreadable to a screen reader. They drive the same state the
          tabs and the ArrowLeft/ArrowRight handler do.

          No bottom spacing of its own — the rail's pt-10 already separates them,
          and the rail's hairline is absolutely positioned against that padding
          (top-[52px] lines up with the 26px nodes), so it must not change. */}
      <div className="flex items-center justify-end gap-2">
        <span
          aria-hidden
          className="mr-1 font-mono text-[12px] tabular-nums tracking-[0.14em] text-ink/55"
        >
          {step.num} / {processSteps[processSteps.length - 1].num}
        </span>
        <button
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
      </div>
    </div>
  );
}
