"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Reveals its children on first scroll into view.
 *
 * One IntersectionObserver per instance, disconnected the moment it fires — the
 * animation itself lives in CSS (`[data-reveal][data-visible]` in globals.css),
 * so this ships no easing/keyframe logic to the client and inherits the global
 * prefers-reduced-motion opt-out for free.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  variant,
  className,
  ...rest
}: {
  /** Optional — a Reveal is also used bare for decorative elements like rules. */
  children?: ReactNode;
  as?: ElementType;
  /** Stagger index — multiplied by 90ms in CSS. */
  delay?: number;
  /** "fade" cross-fades; "line" draws out from the left (for rules). */
  variant?: "fade" | "line";
  className?: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already in view on mount (or no observer support): show immediately.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={variant ?? ""}
      data-visible={visible ? "true" : "false"}
      style={{ "--i": delay } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
