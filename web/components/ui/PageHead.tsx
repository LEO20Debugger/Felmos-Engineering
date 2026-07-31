import Reveal from "./Reveal";

/** The opening block on every inner page. */
export default function PageHead({
  kicker,
  title,
  lead,
}: {
  kicker: string;
  title: string;
  lead: string;
}) {
  return (
    <section className="wrap pb-8 pt-10 md:pb-12 md:pt-14">
      <Reveal as="span" className="kicker mb-3 block">
        {kicker}
      </Reveal>
      <Reveal as="h1" delay={1} className="m-0 text-[clamp(30px,8vw,48px)] uppercase leading-[1.05]">
        {title}
      </Reveal>
      <Reveal
        as="p"
        delay={2}
        className="mb-0 mt-4 max-w-[52ch] text-[16px] leading-[1.62] opacity-80 md:text-[17px]"
      >
        {lead}
      </Reveal>
    </section>
  );
}
