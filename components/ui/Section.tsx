import type { ReactNode } from "react";
import Reveal from "./Reveal";

/**
 * The standard section opener: numbered kicker, condensed heading, hairline rule.
 * Keeps the vertical rhythm identical across all four pages.
 */
export default function SectionHead({
  kicker,
  title,
  lead,
  id,
  align = "start",
}: {
  kicker?: string;
  title: string;
  lead?: string;
  id?: string;
  align?: "start" | "center";
}) {
  return (
    <header
      id={id}
      className={`mb-8 md:mb-10 ${align === "center" ? "text-center" : ""}`}
    >
      {kicker && (
        <Reveal as="span" className="kicker mb-2.5 block">
          {kicker}
        </Reveal>
      )}
      <Reveal as="h2" delay={1} className="text-[clamp(26px,6vw,38px)] uppercase leading-[1.05] m-0">
        {title}
      </Reveal>
      {lead && (
        <Reveal
          as="p"
          delay={2}
          className={`mt-3 mb-0 text-[15.5px] leading-[1.6] opacity-75 max-w-[58ch] ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {lead}
        </Reveal>
      )}
      <Reveal variant="line" delay={2} className="rule mt-6" />
    </header>
  );
}
