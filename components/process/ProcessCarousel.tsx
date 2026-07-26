"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { processSteps } from "@/lib/content";
import Photo from "@/components/ui/Photo";

/**
 * Mobile / tablet view of the six-stage process.
 *
 * A native CSS scroll-snap track — the swipe is the browser's, not ours, so it
 * keeps momentum, rubber-banding and accessibility for free and ships no drag
 * maths. We only observe which slide is centred in order to drive the rail,
 * dots and arrow states.
 */
export default function ProcessCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false); // user took over — stop autoplay

  /* Which slide is centred? Observed against the track, not the viewport. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            setActive(Number((e.target as HTMLElement).dataset.slide));
          }
        }
      },
      { root: track, threshold: [0.6, 0.9] }
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(processSteps.length - 1, i));
    const slide = track.querySelector<HTMLElement>(`[data-slide="${clamped}"]`);
    // block:"nearest" keeps the page from scrolling vertically as we move across.
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  /* Gentle autoplay until the visitor touches it, then never again.
     Both process views stay mounted at every width, so this is gated on the
     breakpoint that actually shows the carousel — otherwise it would keep
     scrolling a display:none track on desktop. */
  useEffect(() => {
    if (engaged) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActive((cur) => {
        const next = (cur + 1) % processSteps.length;
        goTo(next);
        return next;
      });
    }, 5200);
    return () => window.clearInterval(id);
  }, [engaged, goTo]);

  const stop = () => setEngaged(true);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stop();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stop();
      goTo(active - 1);
    }
  };

  return (
    <div
      className="lg:hidden"
      onPointerDown={stop}
      onWheel={stop}
      role="group"
      aria-roledescription="carousel"
      aria-label="Our process, step by step"
    >
      {/* Track — bleeds to the screen edges so the next card peeks in. */}
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Process steps. Use the left and right arrow keys to move between steps."
        className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[var(--gutter)] py-2 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {processSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <article
              key={step.num}
              data-slide={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`Step ${i + 1} of ${processSteps.length}: ${step.title}`}
              className="relative w-[84%] shrink-0 snap-center bg-bg sm:w-[62%]"
            >

              <div className="relative">
                <Photo
                  src={step.image}
                  alt=""
                  ratio="3/2"
                  sizes="(max-width: 640px) 84vw, 62vw"
                  zoom={false}
                />
                <span className="absolute left-0 top-0 bg-accent px-3 py-1.5 font-heading text-[13px] font-semibold tracking-[0.14em] text-bg">
                  {step.num}
                </span>
              </div>

              <div className="flex flex-col gap-2 p-5">
                <Icon size={26} strokeWidth={1.5} className="text-accent-700" />
                <h3 className="m-0 font-heading text-[21px] uppercase">{step.title}</h3>
                <p className="m-0 text-[14.5px] leading-[1.55] opacity-75">{step.line}</p>
                <span className="mt-1 border-t border-divider pt-3 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent-700">
                  {step.meta}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Controls: numbered rail + arrows */}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Choose a process step">
          {processSteps.map((step, i) => (
            <button
              key={step.num}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Step ${step.num}: ${step.title}`}
              onClick={() => {
                stop();
                goTo(i);
              }}
              /* The visible rail is a 3px bar; the padding grows the tap target
                 to 44px without changing how it looks. */
              className="group flex min-h-[44px] flex-1 items-center"
            >
              <span
                className={`block h-[3px] w-full transition-colors duration-300 ${
                  i === active ? "bg-accent" : "bg-divider group-hover:bg-accent-400"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              stop();
              goTo(active - 1);
            }}
            disabled={active === 0}
            aria-label="Previous step"
            className="btn btn-secondary btn-icon"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              stop();
              goTo(active + 1);
            }}
            disabled={active === processSteps.length - 1}
            aria-label="Next step"
            className="btn btn-secondary btn-icon"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Step {active + 1} of {processSteps.length}: {processSteps[active].title}
      </p>
    </div>
  );
}
