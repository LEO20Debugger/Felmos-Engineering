import type { ImageKey } from "./images";
import { team } from "./content";

/* ==========================================================================
   The blog.

   Posts are data, not MDX. That is a deliberate choice rather than a shortcut:
   adding an MDX pipeline means a build dependency, a loader, a components map
   and a second authoring format in a codebase whose entire content layer is
   already a typed array in lib/content.ts. A structured body buys type safety
   (a typo in a block kind is a compile error, not a blank section), keeps every
   post renderable by one component, and leaves the door open — moving to MDX
   later is a change to the renderer, not to the routes or the metadata.

   The cost is real and worth naming: no inline links or emphasis inside a
   paragraph. If a post needs those, that is the signal to add a `rich` block
   kind rather than to reach for dangerouslySetInnerHTML.
   ========================================================================== */

/** The names `team` actually publishes, as a union. */
type TeamName = (typeof team)[number]["name"];

/** One unit of post body. Add a kind here and in PostBody.tsx together. */
export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string };

export type Post = {
  slug: string;
  title: string;
  /** One or two sentences. Used on the index card, the related rail, and as the
      meta description — so it has to stand alone, away from the title. */
  excerpt: string;
  /** ISO yyyy-mm-dd. Sorted on, and published as JSON-LD datePublished. */
  date: string;
  /** A name from `team` (lib/content.ts), enforced by the compiler rather than
      by a runtime warning: the post page looks the author up to render their
      role, so a byline that does not resolve is a silently roleless post.
      Renaming an engineer now fails the build until the posts are updated.

      The trade-off, deliberately taken: a guest author who is not on the team
      cannot be expressed. If that is ever needed, widen this to
      `TeamName | { name: string; role: string }` rather than to plain string —
      going back to string gives up the invariant for every existing post too. */
  author: TeamName;
  category: string;
  image: ImageKey;
  body: Block[];
};

/* ⚠️  DO NOT SHIP WITHOUT SIGN-OFF ⚠️
   Every post below is PLACEHOLDER copy, written to prove the layout and the
   routes. It is technically plausible and deliberately generic — no figures, no
   client names, no claims about what Felmos specifically does or found. But it
   is not written by the engineers it is attributed to, and the bylines point at
   the stock-photo team in lib/content.ts.

   Before launch: either replace the bodies with real posts and real bylines, or
   empty this array. `/blog` renders an honest empty state and the route stays
   valid, so shipping with nothing here is safe. */

export const posts: Post[] = [
  {
    slug: "what-a-soil-investigation-tells-you",
    title: "What a soil investigation actually tells you",
    excerpt:
      "Most clients book one because a planning officer asked for it. The report answers a more useful question than the one on the form.",
    date: "2026-06-18",
    author: "S. Nwosu",
    category: "Geotechnical",
    image: "svc-subsoil",
    body: [
      {
        kind: "p",
        text: "A soil investigation is usually commissioned to satisfy someone else — a planning condition, a lender's checklist, an architect who will not draw a foundation without one. That framing is why so many of them are filed and never read. The report is treated as a permission slip rather than as what it is, which is the only description you will ever get of the material your building has to stand on.",
      },
      { kind: "h2", text: "Three questions it answers" },
      {
        kind: "p",
        text: "Strip away the tables and a ground investigation is answering three things, in order of how much money each one moves.",
      },
      {
        kind: "list",
        items: [
          "What is down there, and at what depth does it change. Layers matter more than any single reading — a competent stratum under two metres of fill is a different building from the same stratum at surface.",
          "How much load it will take before it moves. Bearing capacity is the number everyone quotes, but the useful figure is usually settlement: not whether it will fail, but how far it will sink and whether the movement will be even.",
          "What water is doing. Groundwater level, and whether it varies seasonally, decides half the buildability of a plot and most of the temporary works cost.",
        ],
      },
      { kind: "h2", text: "Why the depth of the boreholes is the whole report" },
      {
        kind: "p",
        text: "The commonest way a ground investigation misleads is not a wrong reading. It is a borehole that stopped above the layer that mattered. Depth is specified against the load the structure will impose and the depth of influence beneath the foundation — not against a standard figure, and certainly not against budget. A shallow investigation on a heavily loaded plot produces a report that is accurate about the wrong soil.",
      },
      {
        kind: "quote",
        text: "An investigation that stops short does not produce less information. It produces confident information about the wrong stratum.",
      },
      { kind: "h2", text: "Reading it before the architect does" },
      {
        kind: "p",
        text: "The best time to read a ground report is before anyone has committed to a foundation type, because that is the one decision it can still change cheaply. Once a design assumes piles, an investigation showing competent ground at two metres saves money. Once construction has started, the same finding saves nothing at all — it just documents what was already paid for.",
      },
    ],
  },
  {
    slug: "rebound-hammer-or-ultrasonic",
    title: "Rebound hammer or ultrasonic: which test, and when",
    excerpt:
      "Two non-destructive methods, routinely treated as interchangeable. They measure different properties, and the difference decides which one answers your question.",
    date: "2026-05-27",
    author: "R. Alvarez",
    category: "Testing Methods",
    image: "svc-integrity-testing",
    body: [
      {
        kind: "p",
        text: "Non-destructive testing gets requested as a single item — \"can you test the concrete\" — as though the methods were graded by accuracy and you simply pick the best one you can afford. They are not graded. They measure different physical properties, and each is close to useless at the other's job.",
      },
      { kind: "h2", text: "What each one is actually measuring" },
      {
        kind: "p",
        text: "A rebound hammer measures surface hardness. A calibrated mass strikes the concrete and the instrument records how far it bounces back. Harder surface, higher rebound. It reads the outer few centimetres and nothing beyond them.",
      },
      {
        kind: "p",
        text: "Ultrasonic pulse velocity measures how fast sound crosses the element. A pulse is sent in one face and timed at the other. Sound travels quickly through sound, dense concrete and slowly through concrete containing voids, cracking or poor compaction — so UPV reads the whole thickness, but reads it as a single averaged path.",
      },
      { kind: "h2", text: "Choosing between them" },
      {
        kind: "list",
        items: [
          "Uniformity across a large pour, or a quick comparative survey of many elements: rebound hammer. It is fast, needs one face, and is well suited to finding the outlier among fifty columns.",
          "Suspected voids, honeycombing, internal cracking or depth of damage: UPV. Surface hardness will tell you nothing about a void behind it.",
          "An actual strength figure you intend to rely on: neither, alone. Both are correlations. They need calibrating against cores taken from the same concrete before a number from either means anything defensible.",
        ],
      },
      { kind: "h2", text: "The pairing that works" },
      {
        kind: "p",
        text: "In practice the two are complementary and are usually run together. UPV locates where the concrete is not behaving as it should; the rebound hammer covers ground quickly across everything else; and a small number of cores, taken where the other two disagree, anchor the whole survey to a real measured strength. That combination is what lets a survey cover an entire phase of completed units while opening only one of them.",
      },
      {
        kind: "quote",
        text: "Both methods are correlations. A number from either, uncalibrated, is an opinion with a decimal point.",
      },
    ],
  },
  {
    slug: "reading-a-crack",
    title: "Reading a crack: which ones matter",
    excerpt:
      "Not every crack is structural, and the alarming-looking ones are often the least serious. What an engineer looks at before deciding.",
    date: "2026-04-30",
    author: "K. Adeyemi",
    category: "Assessment",
    image: "svc-piling-works",
    body: [
      {
        kind: "p",
        text: "Cracking is the most common reason a homeowner calls an engineer, and the most common finding is that the crack is not the problem. That is worth saying plainly, because the fear that brings people to the phone is usually disproportionate to what is happening — and occasionally it is not disproportionate at all, which is exactly why guessing is a poor strategy.",
      },
      { kind: "h2", text: "What gets looked at" },
      {
        kind: "list",
        items: [
          "Direction. Vertical cracking in masonry is frequently shrinkage or thermal movement. Diagonal cracking, particularly running from the corner of an opening, is more often differential movement and is taken more seriously.",
          "Width, and whether it changes along its length. A crack that tapers is telling you something is rotating. One of constant width more often is not.",
          "Whether it passes through units or follows the joints. A crack that has split the blocks themselves has been driven by more force than one that took the easy path around them.",
          "Whether it is moving. A single visit establishes what a crack looks like today. Only monitoring over time establishes whether it is live, and that distinction changes the remedy completely.",
        ],
      },
      { kind: "h2", text: "Why photographs are rarely enough" },
      {
        kind: "p",
        text: "Clients often send a photograph hoping for a verdict, and it is an entirely reasonable thing to try. The reason it seldom works is that the important information is not in the crack. It is in what is around it — the load path above, the ground conditions below, whether the same pattern repeats elsewhere in the building, whether a tree was removed, whether a neighbouring plot was excavated. A crack is a symptom presenting at the surface. The diagnosis is somewhere else.",
      },
      {
        kind: "quote",
        text: "A crack is a symptom presenting at the surface. What caused it is almost always somewhere else in the structure.",
      },
      { kind: "h2", text: "When to stop waiting" },
      {
        kind: "p",
        text: "Most cracking can be watched rather than acted on. The signals that change that are worth knowing: cracking that widens measurably over weeks, doors and windows that begin to bind having previously worked, cracking that appears in more than one element at once, and any crack accompanied by visible deflection in a beam or slab. Those are not the moment to start monitoring. They are the moment to have someone look.",
      },
    ],
  },
  {
    slug: "what-lenders-look-for",
    title: "What lenders actually look for in a verification report",
    excerpt:
      "A technically correct report can still be rejected. Usually the problem is not the engineering — it is that the report answers a different question than the one the credit committee asked.",
    date: "2026-03-12",
    author: "T. Bello",
    category: "Verification",
    image: "svc-drawings",
    body: [
      {
        kind: "p",
        text: "Reports come back for rework more often than they are found to be wrong. The engineering holds up; the document does not do the job the reader needed it to do. That is a format problem, and format problems are avoidable if you know who is reading.",
      },
      { kind: "h2", text: "The reader is not an engineer" },
      {
        kind: "p",
        text: "A verification report is commissioned by a lender, but the person who has to act on it usually sits in credit risk. They are competent, and they are not structural engineers. If the conclusion only becomes clear after reading nine pages of method, the report will be sent back with a request to clarify — not because it is unclear to an engineer, but because it is unclear to its actual audience.",
      },
      { kind: "h2", text: "What makes one straightforward to act on" },
      {
        kind: "list",
        items: [
          "A conclusion that appears before the evidence, stated in plain language, with the qualifications attached to it rather than buried later.",
          "Scope stated as much by exclusion as inclusion. What was not inspected, and why, is frequently the first question asked and the most common reason for a follow-up.",
          "Findings ranked by consequence rather than by the order they were encountered on site. A defect list in survey sequence makes the reader do the prioritising.",
          "Every instrument's calibration status included rather than referenced. A certificate that has to be requested separately is a delay built into the document.",
          "A named, signing engineer who can be reached. Anonymous reports raise a question that costs more time to resolve than it would have to answer up front.",
        ],
      },
      {
        kind: "quote",
        text: "Reports are rarely rejected for being wrong. They are returned for being hard to act on.",
      },
      { kind: "h2", text: "Independence is part of the format" },
      {
        kind: "p",
        text: "A verification report exists because someone wants a view that is not the contractor's and not the developer's. That independence has to be visible in the document, not merely true of it — which means the report should read the same whichever party commissioned it, and should be as willing to record what was satisfactory as what was not.",
      },
    ],
  },
  {
    slug: "five-checks-before-you-buy",
    title: "Five structural checks worth making before you buy",
    excerpt:
      "None of these replace an inspection. All of them are things you can look at yourself on a first viewing, and any one of them is a reason to book one.",
    date: "2026-02-04",
    author: "K. Adeyemi",
    category: "Homeowners",
    image: "svc-building-repairs",
    body: [
      {
        kind: "p",
        text: "A buyer gets very little time in a property before committing, usually in the company of someone who would prefer they commit. None of what follows substitutes for a structural assessment. It is a list of things that are visible on a first viewing and that tell you whether one is worth commissioning.",
      },
      { kind: "h2", text: "One: the line of the roof" },
      {
        kind: "p",
        text: "Step back and sight along the ridge from outside. A ridge that dips or a roof plane that waves is describing movement in the structure below it, and it is one of the few whole-building signals visible from the pavement in a few seconds.",
      },
      { kind: "h2", text: "Two: doors and windows that bind" },
      {
        kind: "p",
        text: "Open and close several, particularly upstairs. Frames that have gone out of square catch, stick or leave uneven gaps. One sticking door is a door. Several, on the same side of the building, is a pattern.",
      },
      { kind: "h2", text: "Three: recent decoration in one room only" },
      {
        kind: "p",
        text: "Fresh paint is not suspicious. Fresh paint in a single room of an otherwise untouched house is worth a question, particularly where it is confined to one wall or one corner. It is often innocent. It is also the cheapest way to make cracking disappear before a viewing.",
      },
      { kind: "h2", text: "Four: what is happening outside the walls" },
      {
        kind: "p",
        text: "Look at ground levels against the building, where rainwater discharges, and what is growing nearby. Mature trees close to a foundation, a downpipe emptying against a wall, or ground built up above the damp course are all causes rather than symptoms, and they are all visible without entering the house.",
      },
      { kind: "h2", text: "Five: the extension junction" },
      {
        kind: "p",
        text: "Where an extension meets the original building, two structures of different age, weight and foundation depth are trying to move together. They rarely do. That junction is the single most productive place to look for cracking in an extended property, and it is usually the last place a viewer thinks to check.",
      },
      {
        kind: "quote",
        text: "None of these tell you a building is unsound. They tell you whether the question is worth asking properly.",
      },
    ],
  },
];

/* ─────────────────────────────── helpers ────────────────────────────────── */

/** Newest first. Every consumer wants this order, so it is done once here
    rather than re-sorted at each call site. */
export const postsByDate = [...posts].sort((a, b) => b.date.localeCompare(a.date));

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);

/**
 * Reading time, derived rather than authored.
 *
 * A hand-typed `readMinutes` is a second source of truth that goes stale the
 * moment a paragraph is edited, and nothing would report the drift. 200 wpm is
 * the conventional figure for considered prose; the result is floored at one
 * minute so a short post never advertises "0 min read".
 */
export const readMinutes = (post: Post) => {
  const words = post.body.reduce((n, b) => {
    const text = b.kind === "list" ? b.items.join(" ") : b.text;
    return n + text.trim().split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
};

/**
 * Posts to show alongside `post` — same category first, then whatever is newest
 * to make up the count. Falling back this way means a category with only one
 * post still fills its rail instead of rendering a lone card or an empty band.
 */
export const relatedPosts = (post: Post, count = 3) => {
  const others = postsByDate.filter((p) => p.slug !== post.slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, count);
};

/** Stable across server and client: toLocaleDateString with no explicit locale
    resolves to the runtime's, which differs between the two and produces a
    hydration mismatch on any date rendered in markup. */
export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/* Same idiom as the audience/clients guard in lib/content.ts, for the two
   invariants the type system cannot express. (Bylines are not among them any
   more — `TeamName` makes a bad author a compile error.) Dev only; costs
   nothing in production. */
if (process.env.NODE_ENV !== "production") {
  const seen = new Set<string>();
  for (const p of posts) {
    /* A duplicate slug does not throw: generateStaticParams would emit the
       route twice and postBySlug would silently always return the first, so
       one of the two posts becomes unreachable with no error anywhere. */
    if (seen.has(p.slug)) console.warn(`[blog] duplicate slug "${p.slug}"`);
    seen.add(p.slug);
    /* formatDate and the sitemap both parse this as ISO. A malformed date
       yields "Invalid Date" in the byline rather than an exception. */
    if (Number.isNaN(Date.parse(`${p.date}T00:00:00Z`))) {
      console.warn(`[blog] post "${p.slug}" has an unparseable date "${p.date}"`);
    }
  }
}
