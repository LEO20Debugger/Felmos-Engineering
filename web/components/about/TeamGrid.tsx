import SectionHead from "@/components/ui/Section";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { team } from "@/lib/content";

/**
 * The team, on a surface band.
 *
 * Portraits are 4:5 rather than square — at 1:1 they read as avatars, at 4:5
 * as commissioned portraits, which is the whole difference between a staff
 * list and a practice page. The ratio comes from the `team-*` source crops in
 * lib/images.ts, so next/image is handed an already-correct frame.
 *
 * See the DO-NOT-SHIP banner above `team` in lib/content.ts: these are stock
 * people and the credentials are unverified.
 */
export default function TeamGrid() {
  return (
    <section className="bg-surface" aria-label="Our team">
      <div className="wrap py-14 md:py-20">
        <SectionHead
          kicker="Our Team"
          title="The Engineers Behind the Scenes"
          lead="Named, reachable, and accountable for the report they sign."
        />

        <ul className="m-0 grid list-none grid-cols-2 gap-x-5 gap-y-8 p-0 lg:grid-cols-4">
          {team.map((m, i) => (
            <Reveal as="li" key={m.name} delay={i % 4}>
              <figure className="m-0">
                <Photo
                  src={m.image}
                  alt={`${m.name}, ${m.role}`}
                  ratio="4/5"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <figcaption className="pt-4">
                  <h3 className="m-0 font-heading text-[16.5px] uppercase">{m.name}</h3>
                  <span className="mt-1 block text-[12.5px] opacity-65">{m.role}</span>
                  {/* Outline rather than filled: this is a credential, not a
                      category label. */}
                  <span className="tag tag-outline mt-2.5">{m.tag}</span>
                  <p className="m-0 mt-3 text-[13.5px] leading-[1.5] opacity-75">{m.bio}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
