"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/* The theme is written to <html data-theme> by the blocking script in
   app/layout.tsx, which runs before first paint. This component only ever
   *changes* it — it never establishes it, so there is no second source of
   truth and no flash to recover from. Keep the two in step: the storage key
   and the attribute name are shared, and the script is the one that must keep
   working if this bundle never arrives. */
const KEY = "theme";

type Choice = "light" | "dark";

const systemTheme = (): Choice =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  /* Not read during render: the server has no idea which theme the visitor
     resolved to, so committing to one here would guarantee a hydration
     mismatch. The button renders inert until mounted. */
  const [theme, setTheme] = useState<Choice | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    setTheme(stored === "light" || stored === "dark" ? stored : systemTheme());
  }, []);

  /* Until the visitor states a preference, the site keeps following the OS —
     so a machine that flips to dark at sunset takes the site with it. Once
     they've chosen, the stored value wins and this becomes a no-op. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (localStorage.getItem(KEY)) return;
      setTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
    /* The static <meta name="theme-color"> pair in layout.tsx keys off the OS
       preference, which is wrong the moment someone overrides it here — the
       phone's browser chrome would stay light behind a dark page. */
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      /* These two are --color-bg from globals.css, in both themes. Literals
         because a meta tag cannot resolve a var(); change them together. */
      .forEach((m) => m.setAttribute("content", theme === "dark" ? "#14181b" : "#f1f3f4"));
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      /* Nothing to toggle to until we know where we are. */
      disabled={!theme}
      onClick={() => {
        localStorage.setItem(KEY, next);
        setTheme(next);
      }}
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      title={theme ? `Switch to ${next} theme` : undefined}
      className={`btn btn-secondary btn-icon ${className}`}
    >
      {/* Both icons are always in the tree, stacked, and cross-faded — swapping
          one for the other pops the button's layout on every press. Before
          mount neither is shown, so the server and client markup agree. */}
      <span className="relative grid h-4 w-4 place-items-center" aria-hidden>
        <Sun
          size={16}
          strokeWidth={1.5}
          className={`col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-[var(--ease-out-quint)] ${
            theme === "light" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          }`}
        />
        <Moon
          size={16}
          strokeWidth={1.5}
          className={`col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-[var(--ease-out-quint)] ${
            theme === "dark" ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
