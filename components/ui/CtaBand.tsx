import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { images } from "@/lib/images";
import Reveal from "./Reveal";

/**
 * The full-bleed steel field that closes every page. The design system allows
 * exactly one such field (accent-900 ground, type reversed to paper).
 */
export default function CtaBand({
  title,
  lead,
  cta = "Book Your Inspection",
  href = "/contact",
}: {
  title: string;
  lead: string;
  cta?: string;
  href?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-accent-900 text-bg">
      <Image
        src={images["cta-texture"]}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover opacity-[0.18] mix-blend-luminosity"
      />
      <div className="wrap relative py-16 text-center md:py-24">
        <Reveal as="h2" className="m-0 text-[clamp(26px,6.5vw,42px)] uppercase leading-[1.05]">
          {title}
        </Reveal>
        <Reveal
          as="p"
          delay={1}
          className="mx-auto mb-8 mt-4 max-w-[50ch] text-[15.5px] leading-[1.6] opacity-80"
        >
          {lead}
        </Reveal>
        <Reveal delay={2}>
          <Link href={href} className="btn btn-invert w-full sm:w-auto">
            {cta}
            <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
