"use client";

import { useEffect, useRef, useState } from "react";
import { stats } from "@/lib/content";

/** Counts 0 → value once, when the row first scrolls into view. */
function useCountUp(target: number, run: boolean) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-quint, matched to the CSS token used everywhere else
      const eased = 1 - Math.pow(1 - t, 5);
      setN(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);

  return n;
}

function Stat({ value, suffix, label, run }: { value: number; suffix: string; label: string; run: boolean }) {
  const n = useCountUp(value, run);
  return (
    <div className="flex flex-col gap-1">
      <span className="font-heading text-[clamp(34px,7vw,48px)] font-semibold leading-none text-accent-700 tabular-nums">
        {n}
        {suffix}
      </span>
      <span className="text-[13px] uppercase tracking-[0.06em] opacity-65">{label}</span>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="wrap py-10 md:py-14" aria-label="Felmos by the numbers">
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-divider py-9 md:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.label} value={s.value} suffix={s.suffix} label={s.label} run={run} />
        ))}
      </div>
    </section>
  );
}
