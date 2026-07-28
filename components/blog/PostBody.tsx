import type { Block } from "@/lib/blog";

/**
 * Renders a post body from its block array.
 *
 * The one place in the site that sets long-form measure and rhythm, so the
 * type scale here is deliberately larger than the rest of the site's 15px:
 * body copy that will be read for four minutes is a different job from copy
 * that will be scanned in four seconds.
 *
 * Add a block kind here and in lib/blog.ts's `Block` union together — the
 * exhaustiveness check at the foot makes forgetting one a compile error rather
 * than a silently missing section.
 */
export default function PostBody({ body }: { body: Block[] }) {
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
