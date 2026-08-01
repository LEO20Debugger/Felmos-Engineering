import type { CmsPostBlock } from "@/lib/cms";

/**
 * Renders a post body from its block array.
 *
 * The one place in the site that sets long-form measure and rhythm, so the
 * type scale here is deliberately larger than the rest of the site's 15px:
 * body copy that will be read for four minutes is a different job from copy
 * that will be scanned in four seconds.
 *
 * Add a block kind here, in `CmsPostBlock` (lib/cms.ts) and in the API's zod
 * union together — the exhaustiveness check at the foot makes forgetting one a
 * compile error rather than a silently missing section.
 */
export default function PostBody({ body }: { body: CmsPostBlock[] }) {
  return (
    <div className="prose">
      {body.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return <h2 key={i}>{block.text}</h2>;
          case "p":
            return <p key={i}>{block.text}</p>;
          case "list":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote key={i}>
                <p>{block.text}</p>
                {/* Optional, and only rendered when it is there — an empty
                    <cite> would still draw the dash and the indent. */}
                {block.attribution ? <cite>{block.attribution}</cite> : null}
              </blockquote>
            );
          default: {
            /* If a new kind is added to Block without a case above, `block`
               is no longer `never` here and this line stops compiling. */
            const exhaustive: never = block;
            return exhaustive;
          }
        }
      })}
    </div>
  );
}
