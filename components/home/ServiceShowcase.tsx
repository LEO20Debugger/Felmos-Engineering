import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { imageAt } from "@/lib/images";
import { services } from "@/lib/content";

/**
 * The five services, in two presentations of the same data.
 *
 * Desktop is a row of expanding panels: collapsed panels carry the service name
 * on a vertical spine, and the one under the cursor grows to reveal the detail.
 * The expansion is pure CSS (`flex-grow` + `:hover` / `:focus-within`), so this
 * stays a server component with no JavaScript at all.
 *
 * Below lg it becomes a grid of image tiles, where the last tile is itself the
 * "see everything" route through to /services.
 */
export default function ServiceShowcase() {
  return (
    <section className="wrap py-14 md:py-20" aria-label="Engineering services">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <SectionHead
            kicker="What We Do"
            title="Engineering Services"
            lead="Five disciplines, one accountable engineer on each."
          />
        </div>
        {/* Desktop "see more" — sits with the heading, where the eye lands first. */}
        <Reveal delay={2} className="mb-8 hidden md:mb-10 lg:block">
          <Link href="/services" className="btn btn-secondary text-ink no-underline">
            All services
            <ArrowRight size={17} strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>

      {/* ───────────── desktop: expanding panels ───────────── */}
      <Reveal className="hidden gap-2.5 lg:flex lg:h-[480px]">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.slug}
              href={`/services#${s.slug}`}
              aria-label={`${s.title} — learn more`}
              className="svc-panel"
            >
              {/* Portrait crop of the same photograph, so a tall narrow panel
                  frames the subject instead of slicing it out. */}
              <Image
                src={imageAt(s.image, 900, 1200)}
                alt=""
                fill
                sizes="(max-width: 1024px) 0px, 40vw"
                className="svc-photo object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-accent-900 via-accent-900/55 to-accent-900/15"
              />

              <span className="absolute left-5 top-5 font-mono text-[12px] tracking-[0.16em] text-bg/75">
                {s.num}
              </span>

              {/* Collapsed: the name runs up the spine of the panel. */}
              <span className="svc-spine absolute bottom-6 left-0 right-0 text-center whitespace-nowrap font-heading text-[17px] uppercase tracking-[0.06em] text-bg">
                {s.label}
              </span>

              {/* Expanded: the detail fades up once the panel has room. */}
              <span className="svc-detail absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-6">
                <Icon size={26} strokeWidth={1.5} className="text-accent-300" />
                <span className="font-heading text-[21px] uppercase leading-tight text-bg">
                  {s.title}
                </span>
                <span className="max-w-[34ch] text-[14.5px] leading-[1.5] text-bg/80">
                  {s.short}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-bg">
                  Learn more
                  <ArrowUpRight size={16} strokeWidth={1.5} />
                </span>
              </span>
            </Link>
          );
        })}
      </Reveal>

      {/* ───────────── mobile / tablet: image tiles ───────────── */}
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:hidden">
        {services.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={i % 2}>
            <Link
              href={`/services#${s.slug}`}
              className="group relative block aspect-square overflow-hidden rounded-[var(--radius-control)] no-underline"
            >
              <Image
                src={imageAt(s.image, 800, 800)}
                alt=""
                fill
                sizes="(max-width: 1024px) 50vw, 0px"
                className="object-cover transition-transform duration-700 group-active:scale-105"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-accent-900 via-accent-900/45 to-accent-900/5"
              />
              <span className="absolute left-3 top-3 font-mono text-[11px] tracking-[0.14em] text-bg/75">
                {s.num}
              </span>
              <span className="absolute inset-x-0 bottom-0 p-3.5">
                <span className="block font-heading text-[15px] uppercase leading-tight text-bg">
                  {s.title}
                </span>
              </span>
            </Link>
          </Reveal>
        ))}

        {/* The sixth tile completes the grid and is the route to the full page. */}
        <Reveal as="li" delay={1}>
          <Link
            href="/services"
            className="group flex aspect-square flex-col justify-between rounded-[var(--radius-control)] bg-accent-900 p-3.5 text-bg no-underline"
          >
            <span className="font-mono text-[11px] tracking-[0.14em] text-bg/70">ALL</span>
            <span>
              <span className="block font-heading text-[15px] uppercase leading-tight">
                See all services
              </span>
              <span className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-bg transition-transform duration-300 group-active:translate-x-1">
                <ArrowRight size={17} strokeWidth={1.5} />
              </span>
            </span>
          </Link>
        </Reveal>
      </ul>
    </section>
  );
}
