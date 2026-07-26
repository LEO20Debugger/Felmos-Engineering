import SectionHead from "@/components/ui/Section";
import Reveal from "@/components/ui/Reveal";
import { standards, trustReasons } from "@/lib/content";

/**
 * Why clients trust us, plus the accreditations column.
 *
 * `standards` ships empty on purpose (see the banner in lib/content.ts): an
 * unverified certification claim is a regulatory problem, not a marketing one.
 * So the right column only exists when there is something real to put in it,
 * and the section degrades to a clean two-column trust block rather than
 * rendering an empty promise.
 */
export default function Standards() {
  const hasStandards = standards.length > 0;

  return (
    <section className="wrap py-10 md:py-14" aria-label="Why clients trust Felmos">
      <SectionHead kicker="Why Clients Trust Felmos" title="Independent By Design" />

      <div
        className={
          hasStandards
            ? "grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
            : ""
        }
      >
        {/* A definition list, not another card grid — this page already has
            enough of those, and these genuinely are term/definition pairs. */}
        <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
          {trustReasons.map((t, i) => (
            <Reveal
              as="div"
              key={t.title}
              delay={i % 2}
              className="border-t border-divider py-5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
            >
              <dt className="font-heading text-[16.5px] uppercase">{t.title}</dt>
              <dd className="m-0 mt-1.5 max-w-[38ch] text-[14px] leading-[1.55] opacity-75">
                {t.line}
              </dd>
            </Reveal>
          ))}
        </dl>

        {hasStandards && (
          <Reveal delay={2}>
            <h3 className="m-0 font-heading text-[16.5px] uppercase">Accreditations</h3>
            <p className="m-0 mt-2 max-w-[38ch] text-[14px] leading-[1.55] opacity-75">
              Testing is carried out to published standards, and the certificates travel
              with the report.
            </p>
            <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
              {standards.map((s) => (
                <li key={s.name} className="flex flex-col gap-1">
                  <span className="tag tag-outline self-start">{s.name}</span>
                  <span className="text-[13px] leading-[1.5] opacity-70">{s.body}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}
