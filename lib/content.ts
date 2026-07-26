import type { LucideIcon } from "lucide-react";
import {
  Award,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Compass,
  Eye,
  FileCheck2,
  FileText,
  FlaskConical,
  Gauge,
  Handshake,
  HardHat,
  Headset,
  Home,
  Landmark,
  Layers,
  LineChart,
  Mountain,
  Ruler,
  Scale,
  Search,
  ShieldCheck,
  Target,
  Users,
  Waves,
} from "lucide-react";

import type { ImageKey } from "./images";
import { site } from "./site";

/* ────────────────────────────── trust strip ────────────────────────────── */

export const trustPoints = [
  { icon: ShieldCheck, label: "Certified Engineers" },
  { icon: Gauge, label: "Calibrated Equipment" },
  { icon: Clock, label: "Fast Report Delivery" },
  { icon: Headset, label: "Direct Engineer Access" },
] as const;

/* ─────────────────────────────── the numbers ────────────────────────────── */

/* `key` is the stable handle. Banners look these up to avoid retyping the
   figures, and doing that by display label meant renaming a label silently
   dropped a cell with nothing reporting it. Never key off `label`. */
export const stats = [
  /* Resolved 2026-07: was "12+", which implied a ~2014 founding and
     contradicted site.founded = 2016. The founding year is published as
     JSON-LD foundingDate and is the harder fact, so the marketing figure moved.
     The invariant at the foot of this file stops the two drifting again. */
  { key: "years", value: 10, suffix: "+", label: "Years in practice" },
  { key: "projects", value: 640, suffix: "+", label: "Projects tested" },
  { key: "onTime", value: 98, suffix: "%", label: "Reports on schedule" },
  { key: "disciplines", value: 5, suffix: "", label: "Testing disciplines" },
] as const;

/* ──────────────────────────────── services ─────────────────────────────── */

export type Service = {
  slug: string;
  num: string;
  title: string;
  /** One or two words — used where the full title won't fit, e.g. the vertical
      spine of a collapsed service panel. */
  label: string;
  short: string;
  lead: string;
  icon: LucideIcon;
  image: ImageKey;
  benefits: string[];
  clients: string[];
};

export const services: Service[] = [
  {
    slug: "soil-investigation",
    num: "01",
    title: "Soil Investigation & Testing",
    label: "Soil Testing",
    short: "Know what you're building on before you build.",
    lead: "Geotechnical investigation that determines soil bearing capacity, composition and suitability before design begins.",
    icon: Layers,
    image: "svc-soil",
    benefits: [
      "Prevents costly foundation redesign later",
      "Establishes bearing capacity and settlement risk",
      "Required for most municipal approvals",
    ],
    clients: ["Property Developers", "Architects", "Homeowners"],
  },
  {
    slug: "non-destructive-testing",
    num: "02",
    title: "Non-Destructive Structural Testing",
    label: "Concrete Testing",
    short: "Concrete strength verified without breaking a wall.",
    lead: "Rebound hammer, ultrasonic pulse velocity and core sampling that evaluate concrete strength and condition without damage.",
    icon: Waves,
    image: "svc-ndt",
    benefits: [
      "Assesses concrete strength without demolition",
      "Detects voids, cracking and deterioration early",
      "Ideal for occupied or heritage buildings",
    ],
    clients: ["Construction Companies", "Homeowners", "Government Projects"],
  },
  {
    slug: "structural-integrity",
    num: "03",
    title: "Structural Integrity Assessment",
    label: "Integrity",
    short: "A full condition read on an existing structure.",
    lead: "Complete condition assessment identifying defects, deterioration and risk — with prioritised engineering recommendations.",
    icon: Building2,
    image: "svc-integrity",
    benefits: [
      "Comprehensive defect and risk identification",
      "Supports insurance, sale and renovation decisions",
      "Prioritised remedial recommendations",
    ],
    /* "Government Projects" is listed here deliberately: project 03 (the
       heritage office block) is a Government Project delivered under this
       discipline, so omitting it contradicted our own record. */
    clients: ["Homeowners", "Banks", "Property Developers", "Government Projects"],
  },
  {
    slug: "building-verification",
    num: "04",
    title: "Building Structural Verification",
    label: "Verification",
    short: "The independent report your lender asks for.",
    lead: "Independent verification confirming a building's structural adequacy — commonly required before financing or occupation.",
    icon: FileCheck2,
    image: "svc-verify",
    benefits: [
      "Independent, lender-ready documentation",
      "Confirms compliance with design and code",
      "Accepted by financial institutions",
    ],
    clients: ["Banks", "Financial Institutions", "Property Developers"],
  },
  {
    slug: "foundation-assessment",
    num: "05",
    title: "Foundation Assessment & Investigation",
    label: "Foundations",
    short: "Find out why it's settling, cracking or moving.",
    lead: "Diagnostic inspection of foundations showing settlement, cracking or load-bearing concerns, with cost-aware remedial guidance.",
    icon: Mountain,
    image: "svc-foundation",
    benefits: [
      "Diagnoses settlement and foundation cracking",
      "Cost-aware, prioritised remedial options",
      "Suited to purchase, renovation or extension",
    ],
    clients: ["Homeowners", "Construction Companies", "Architects"],
  },
];

/* ─────────────────────────────── projects ───────────────────────────────── */

/** The headline figure set large beside each project's outcome. */
export type ProjectMetric = {
  /** Pre-formatted for display — "23", "1/3", "40 yrs". These are typeset
      figures, not operands: nothing ever does arithmetic on them. */
  value: string;
  label: string;
};

export type Project = {
  slug: string;
  num: string;
  title: string;
  category: string;
  location: string;
  year: string;
  client: string;
  /** How long the engagement ran — fills the fourth cell of the fact grid. */
  duration: string;
  /** One line. Used by the homepage teaser and the index, where there is no
      room for the narrative. */
  scope: string;
  /** The dossier body: what was found, and how. */
  narrative: string;
  result: string;
  metric: ProjectMetric;
  /** Slugs from `services` above. Rendered as links through to /services#slug,
      so a project shows which disciplines it drew on. Kept as string[] rather
      than a slug union — `Service["slug"]` is plain string, and narrowing it
      would ripple through five other files for no real gain. The render site
      guards with `services.find()`. */
  services: string[];
  image: ImageKey;
};

/* The six entries below are illustrative case studies, not real engagements —
   the copy, clients and figures are all placeholder. Replace them with real
   project records before this goes live. */

export const projects: Project[] = [
  {
    slug: "lekki-tower-verification",
    num: "01",
    title: "23-Storey Residential Tower",
    category: "Building Verification",
    location: "Lekki, Lagos",
    year: "2025",
    client: "Property Developer",
    duration: "6 weeks",
    scope: "Independent structural verification ahead of construction financing.",
    narrative:
      "The developer had design drawings and a contractor's warranty, but the lender wanted a third party to confirm the frame as built matched what had been approved. We surveyed the completed structure floor by floor, cored and tested concrete at every third level, and checked reinforcement against the issued-for-construction drawings.",
    result: "Report accepted by the lender without a single follow-up query.",
    metric: { value: "23", label: "Storeys verified" },
    services: ["building-verification", "non-destructive-testing"],
    image: "proj-1",
  },
  {
    slug: "ikeja-foundation-diagnosis",
    num: "02",
    title: "Settling Warehouse Foundation",
    category: "Foundation Assessment",
    location: "Ikeja, Lagos",
    year: "2024",
    client: "Construction Company",
    duration: "9 days on site",
    scope: "Diagnostic investigation of visible cracking and uneven settlement.",
    narrative:
      "Cracking had opened along one wall of a working warehouse and the owner had been quoted for full underpinning. We levelled the slab, opened inspection pits at four locations and tested the soil beneath the affected corner. The movement traced to a single poorly compacted fill zone, not to the foundation design.",
    result: "Root cause identified in one visit; remedial cost cut by a third.",
    metric: { value: "1/3", label: "Remedial cost avoided" },
    services: ["foundation-assessment", "soil-investigation"],
    image: "proj-2",
  },
  {
    slug: "victoria-island-integrity",
    num: "03",
    title: "Heritage Office Block Assessment",
    category: "Structural Integrity",
    location: "Victoria Island, Lagos",
    year: "2024",
    client: "Government Project",
    duration: "8 weeks",
    scope: "Full condition assessment of a 40-year-old occupied structure.",
    narrative:
      "A public building still in daily use needed a condition read before a refurbishment budget could be set. Testing had to be non-destructive and work around occupancy. We assessed the frame, facade and slabs over eight weeks of evening and weekend access, and ranked every defect found by structural consequence rather than by visibility.",
    result: "Cleared for continued occupation with a prioritised repair plan.",
    metric: { value: "40 yrs", label: "Structure re-certified" },
    services: ["structural-integrity", "non-destructive-testing"],
    image: "proj-3",
  },
  {
    slug: "ajah-ndt-survey",
    num: "04",
    title: "Concrete Strength Survey, Housing Estate",
    category: "Non-Destructive Testing",
    location: "Ajah, Lagos",
    year: "2023",
    client: "Property Developer",
    duration: "3 weeks",
    scope: "Rebound hammer and UPV testing across 60 residential units.",
    narrative:
      "A batching inconsistency during construction put a whole phase of completed units in question. Breaking out samples would have meant making good across sixty finished homes. Rebound hammer and ultrasonic pulse velocity readings, calibrated against cores taken from a single sacrificial unit, established strength across the phase instead.",
    result: "Every unit verified without breaking a single wall.",
    metric: { value: "60", label: "Units tested, zero opened" },
    services: ["non-destructive-testing", "structural-integrity"],
    image: "proj-4",
  },
  {
    slug: "epe-soil-investigation",
    num: "05",
    title: "Coastal Plot Soil Investigation",
    category: "Soil Investigation",
    location: "Epe, Lagos",
    year: "2023",
    client: "Homeowner",
    duration: "2 weeks",
    scope: "Bearing capacity and composition testing ahead of design.",
    narrative:
      "A private client bought a coastal plot and wanted to know what they were building on before an architect drew anything. Boreholes to eight metres found a competent bearing stratum shallower than the area's reputation suggested, which let the design proceed on pads rather than the piled solution that had been assumed.",
    result: "Foundation redesign avoided; approvals secured on first submission.",
    metric: { value: "1", label: "Submission to approval" },
    services: ["soil-investigation", "foundation-assessment"],
    image: "proj-5",
  },
  {
    slug: "ikoyi-lender-verification",
    num: "06",
    title: "Mixed-Use Development Financing Report",
    category: "Building Verification",
    location: "Ikoyi, Lagos",
    year: "2022",
    client: "Bank",
    duration: "5 weeks",
    scope: "Independent adequacy verification for a construction loan facility.",
    narrative:
      "The bank was lending against a part-built mixed-use scheme and needed structural adequacy confirmed before drawing down the next tranche. We verified the completed substructure and frame against the design, and reported in the format the credit committee already used, so the findings could be actioned without translation.",
    result: "Became the bank's standard reference for the borrower's next three projects.",
    metric: { value: "3", label: "Follow-on facilities" },
    services: ["building-verification", "structural-integrity"],
    image: "proj-6",
  },
];

/* ──────────────────────────── the process ────────────────────────────────
   The centrepiece: six stages, one line each, one image each. Rendered as a
   swipeable carousel on mobile and a drawn timeline on desktop — both read
   from this single array. */

export type ProcessStep = {
  num: string;
  title: string;
  line: string;
  meta: string;
  icon: LucideIcon;
  image: ImageKey;
};

export const processSteps: ProcessStep[] = [
  {
    num: "01",
    title: "Submit Request",
    line: "Tell us the project, the location and what you need tested.",
    meta: "Same day",
    icon: ClipboardCheck,
    image: "process-1",
  },
  {
    num: "02",
    title: "Site Inspection",
    line: "An engineer visits and inspects the structure or site first-hand.",
    meta: "2–3 days",
    icon: HardHat,
    image: "process-2",
  },
  {
    num: "03",
    title: "Laboratory Testing",
    line: "Samples and readings are tested to standard in the lab.",
    meta: "On site + lab",
    icon: FlaskConical,
    image: "process-3",
  },
  {
    num: "04",
    title: "Engineering Analysis",
    line: "Results are analysed against code and design requirements.",
    meta: "Certified review",
    icon: LineChart,
    image: "process-4",
  },
  {
    num: "05",
    title: "Detailed Report",
    line: "A full written report with findings, data and photographs.",
    meta: "3–5 days",
    icon: FileText,
    image: "process-5",
  },
  {
    num: "06",
    title: "Recommendations",
    line: "Clear next steps and remedial advice you can act on.",
    meta: "Engineer on call",
    icon: Handshake,
    image: "process-6",
  },
];

/* ─────────────────────────────── audiences ─────────────────────────────── */

export type Audience = {
  slug: string;
  label: string;
  icon: LucideIcon;
  /** The "is this for me?" line — one sentence, naming a real service. */
  need: string;
  /** Every spelling this audience appears under in `Service.clients` and
      `Project.client`. Both of those are visible copy on /services and
      /projects and are deliberately NOT normalised to these labels, so the
      join lives here instead. Plural forms match services, singular match
      projects. Add a spelling here rather than editing the copy there. */
  matches: readonly string[];
  /** The service this audience is routed to; the row links at its anchor. */
  primary: string;
  image: ImageKey;
};

export const audiences: readonly Audience[] = [
  {
    slug: "property-developers",
    label: "Property Developers",
    icon: Users,
    need: "Ground data before design, and an independent report before drawdown.",
    matches: ["Property Developers", "Property Developer"],
    primary: "soil-investigation",
    image: "svc-soil",
  },
  {
    slug: "homeowners",
    label: "Homeowners",
    icon: Home,
    need: "Find out what the crack actually means, before you buy or build.",
    matches: ["Homeowners", "Homeowner"],
    primary: "foundation-assessment",
    image: "svc-foundation",
  },
  {
    slug: "banks-lenders",
    label: "Banks & Lenders",
    icon: Landmark,
    need: "Structural adequacy confirmed independently, in your credit committee's format.",
    matches: ["Banks", "Bank", "Financial Institutions", "Financial Institution"],
    primary: "building-verification",
    image: "svc-verify",
  },
  {
    slug: "architects",
    label: "Architects",
    icon: Ruler,
    need: "Bearing capacity established before the first foundation is drawn.",
    matches: ["Architects", "Architect"],
    primary: "soil-investigation",
    // Borrowed: only five svc-* images exist and all six rows need a distinct one.
    image: "about-story",
  },
  {
    slug: "construction-firms",
    label: "Construction Firms",
    icon: HardHat,
    need: "Concrete strength and workmanship verified without stopping the job.",
    matches: ["Construction Companies", "Construction Company", "Construction Firms"],
    primary: "non-destructive-testing",
    image: "svc-ndt",
  },
  {
    slug: "government-projects",
    label: "Government Projects",
    icon: Building2,
    need: "Condition assessment on occupied public buildings, tested non-destructively.",
    matches: ["Government Projects", "Government Project"],
    primary: "structural-integrity",
    image: "svc-integrity",
  },
] as const;

/* Case- and punctuation-insensitive, so "Banks & Lenders" and "banks and
   lenders" can't diverge on a stray ampersand. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "");

/** The services that actually list this audience among their clients. */
export const servicesFor = (a: Audience) =>
  services.filter((s) => s.clients.some((c) => a.matches.some((m) => norm(m) === norm(c))));

/** The projects delivered for this audience. Not currently rendered on the
    homepage — Architects match zero projects, which would leave a row empty. */
export const projectsFor = (a: Audience) =>
  projects.filter((p) => a.matches.some((m) => norm(m) === norm(p.client)));

/* There is no test runner in this project, and the join above reads strings
   that live in two other arrays as visible copy. Without this, renaming a
   client on /services silently empties a row on the homepage and nothing
   anywhere reports it. Dev only — it costs nothing in production. */
if (process.env.NODE_ENV !== "production") {
  for (const a of audiences) {
    if (servicesFor(a).length === 0) {
      console.warn(`[content] audience "${a.slug}" matches no service — check .matches against Service.clients`);
    }
    if (!services.some((s) => s.slug === a.primary)) {
      console.warn(`[content] audience "${a.slug}".primary "${a.primary}" is not a service slug`);
    }
  }
  const known = new Set(audiences.flatMap((a) => a.matches.map(norm)));
  for (const s of services) {
    for (const c of s.clients) {
      if (!known.has(norm(c))) {
        console.warn(`[content] Service.clients value "${c}" (${s.slug}) matches no audience`);
      }
    }
  }
}

/* ─────────────────────────────── why felmos ────────────────────────────── */

/* ⚠️  DO NOT SHIP WITHOUT SIGN-OFF ⚠️
   Unlike the project case studies (which are openly illustrative), these
   describe the REAL business and are the kind of specifics a client can hold
   Felmos to contractually. Every item marked INVENTED below is a placeholder
   written to shape the layout — confirm each with Felmos or replace it.
   An unverifiable claim can always fall back to the icon-and-proof treatment
   used by Modern Equipment, which carries no figure.

   Constraint on any replacement figure: it must not repeat or near-repeat a
   `stats` value above (10+ yrs, 640+ projects, 98% on schedule, 5 disciplines).
   That rule is why Modern Equipment has no number — a "calibrated within N
   months" figure collides with the years figure, and "98% on the committed
   date" merely restates "98% reports on schedule". */

export type Differentiator = {
  /** Stable id — drives the bento cell span map in WhyUs.tsx. */
  key: string;
  title: string;
  icon: LucideIcon;
  /** Set large. Pre-formatted for display, never an operand. */
  figure?: string;
  figureLabel?: string;
  proof: string;
  image?: ImageKey;
};

export const differentiators: readonly Differentiator[] = [
  {
    key: "certified-engineers",
    icon: Award,
    title: "Certified Engineers",
    figure: "100%", // INVENTED
    figureLabel: "Reports signed by a chartered engineer",
    proof:
      "Every report is signed by a chartered engineer — not a technician's readings with an engineer's name on the cover.",
  },
  {
    key: "fast-turnaround",
    icon: Clock,
    title: "Fast Turnaround",
    figure: "3–5", // INVENTED
    figureLabel: "Working days to report",
    proof: "Quoted before we start, and held to.",
  },
  {
    key: "modern-equipment",
    icon: Gauge,
    title: "Modern Equipment",
    // INVENTED: that the certificate travels with the report.
    proof:
      "Every instrument carries a current calibration certificate, and the certificate travels with the report.",
  },
  {
    key: "code-compliant",
    icon: Scale,
    title: "Code Compliant",
    proof:
      "Written to the submission standard banks and regulators already work in, so findings are actioned rather than translated.",
  },
  {
    key: "accurate-reports",
    icon: Target,
    title: "Accurate Reports",
    // INVENTED: the twice-on-two-instruments procedure.
    proof:
      "Every reading is taken twice, on two instruments, before it enters a report. Nothing is estimated.",
  },
  {
    key: "real-support",
    icon: Headset,
    title: "Real Support",
    proof:
      "The engineer who stood on your site answers when you call. No account manager in between.",
    image: "team-1",
  },
] as const;

/* ──────────────────────────────── about ────────────────────────────────── */

export const values = [
  { icon: Gauge, title: "Precision", line: "Measured and verified, never estimated." },
  { icon: ShieldCheck, title: "Integrity", line: "Reports reflect findings, not preference." },
  { icon: ClipboardCheck, title: "Accountability", line: "We stand behind every result." },
  { icon: Clock, title: "Reliability", line: "On site and on schedule." },
  { icon: FileText, title: "Compliance", line: "Built to code and regulation." },
  { icon: Handshake, title: "Partnership", line: "Engineers who explain the findings." },
] as const;

export const missionVision = [
  {
    icon: Target,
    title: "Our Mission",
    line: "Accurate, independently verified structural data that protects lives, property and investment at every stage of construction.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    line: "To be the reference point every developer, homeowner and lender turns to for structural certainty.",
  },
] as const;

/* ⚠️  DO NOT SHIP WITHOUT SIGN-OFF ⚠️
   Two separate problems in this array:

   1. The four portraits are STOCK PEOPLE, not Felmos staff (see lib/images.ts),
      and the names are invented. The About page now renders them larger, with
      bios, which makes the fiction more prominent, not less.
   2. Every `tag` is an unverified professional credential — "P.Eng",
      "ACI Certified", "M.Sc Geotech", "Chartered Engineer". These predate this
      work but are now set as standalone chips. Claiming a professional
      registration nobody holds is a regulatory problem, not a marketing one.

   Replace the photographs and confirm every credential before launch, or cut
   the names and run this section as roles only. The `bio` lines are new and
   deliberately qualitative — no dates, employers or client names. */
export const team = [
  {
    name: "K. Adeyemi",
    role: "Principal Structural Engineer",
    tag: "P.Eng · 18 yrs",
    bio: "Signs off every verification report the practice issues.",
    image: "team-1",
  },
  {
    name: "S. Nwosu",
    role: "Lead Geotechnical Engineer",
    tag: "M.Sc Geotech",
    bio: "Runs the ground investigation programme, borehole to bearing capacity.",
    image: "team-2",
  },
  {
    name: "R. Alvarez",
    role: "NDT Testing Specialist",
    tag: "ACI Certified",
    bio: "Rebound hammer, ultrasonic pulse velocity and coring on occupied structures.",
    image: "team-3",
  },
  {
    name: "T. Bello",
    role: "Quality Assurance Lead",
    tag: "Chartered Engineer",
    bio: "Checks every reading against method before it reaches a client.",
    image: "team-4",
  },
] as const satisfies ReadonlyArray<{
  name: string;
  role: string;
  tag: string;
  bio: string;
  image: ImageKey;
}>;

/* ───────────────────────────── company history ─────────────────────────── */

/* ⚠️  DO NOT SHIP WITHOUT SIGN-OFF ⚠️
   Milestone 01's year is derived from site.founded and is therefore as good as
   that value. Everything else below — the three later years and all four
   description lines — is INVENTED to shape the section.

   If sign-off doesn't arrive: delete entries 02–04. The section renders
   whatever is in the array, so a single founding entry degrades honestly. */
export const milestones = [
  {
    year: String(site.founded),
    title: "Practice founded",
    line: "Started with soil investigation for residential developers.",
  },
  { year: "2019", title: "Materials lab in house", line: "Sample testing stopped being outsourced." }, // INVENTED
  { year: "2022", title: "First lender framework", line: "Verification reports accepted without rework." }, // INVENTED
  { year: "2025", title: "Fifth discipline added", line: "Foundation assessment joined the practice." }, // INVENTED
] as const;

/* ─────────────────────── accreditations & standards ────────────────────── */

/* ⚠️  DO NOT SHIP WITHOUT SIGN-OFF ⚠️
   This array is INTENTIONALLY EMPTY. The entries below are commented-out
   placeholders that were used to build and prove the layout.

   Claiming a certification the practice does not hold is a materially
   different risk from an optimistic turnaround figure — it is the kind of
   claim that draws regulatory and legal attention, and certification bodies
   pursue misuse of their marks.

   `components/about/Standards.tsx` renders NOTHING while this is empty, so
   shipping as-is is safe and is the correct action if sign-off never arrives.
   Uncomment only what Felmos can produce a current certificate for. */
export const standards: readonly { name: string; body: string }[] = [
  // { name: "ISO 9001:2015", body: "Quality management" },          // INVENTED — verify certificate number and expiry
  // { name: "ASTM C805 / C597", body: "Rebound hammer & UPV" },     // INVENTED — confirm methods actually accredited
  // { name: "COREN", body: "Council for the Regulation of Engineering in Nigeria" }, // INVENTED — confirm registration
];

/* `site.founded` is published as JSON-LD `foundingDate` in app/layout.tsx, and
   the years figure is rendered on the homepage and both banners. They are two
   statements of the same fact and drifted apart once already (12+ vs 2016).
   Dev only, same idiom as the audience/clients guard above. */
if (process.env.NODE_ENV !== "production") {
  const years = stats.find((s) => s.key === "years");
  const actual = new Date().getFullYear() - site.founded;
  if (years && Math.abs(actual - years.value) > 1) {
    console.warn(
      `[content] founding-year conflict: site.founded=${site.founded} implies ~${actual} years, ` +
        `but stats "${years.key}" says ${years.value}${years.suffix}. One of them is wrong.`
    );
  }
}

export const trustReasons = [
  { icon: Compass, title: "Independent Findings", line: "Our reports serve the structure, not a party." },
  { icon: FileCheck2, title: "Lender-Ready", line: "Formatted for bank and regulatory submission." },
  { icon: Gauge, title: "Calibrated Kit", line: "Instruments maintained to manufacturer standard." },
  { icon: Headset, title: "Direct Access", line: "No call centre between you and the engineer." },
] as const;

/* ───────────────────────────── testimonials ────────────────────────────── */

export const testimonials = [
  {
    quote:
      "Felmos delivered our soil investigation two days early. The bank accepted it without a single follow-up question.",
    name: "A. Okonkwo",
    role: "Property Developer",
  },
  {
    quote:
      "We had visible cracking in a ten-year-old building. Their testing pinpointed the cause without breaking a wall.",
    name: "M. Reyes",
    role: "Homeowner",
  },
  {
    quote:
      "Their verification reports are now our standard requirement before we approve any construction loan.",
    name: "D. Whitfield",
    role: "Credit Risk Manager",
  },
] as const;

/* ─────────────────────────────────── faq ───────────────────────────────── */

export const faqs = [
  {
    q: "How soon can an inspection be scheduled?",
    a: "Most inspections are scheduled within 2–3 business days of your request, subject to site access and scope.",
  },
  {
    q: "How long does the report take?",
    a: "Standard reports are delivered 3–5 business days after testing is complete, depending on the service.",
  },
  {
    q: "Are your reports accepted by banks and lenders?",
    a: "Yes. Our verification and assessment reports are formatted to meet standard lender and regulatory submission requirements.",
  },
  {
    q: "Do you serve residential as well as commercial projects?",
    a: "Yes — homeowners, developers, construction companies and government projects, across residential, commercial and institutional structures.",
  },
  {
    q: "What areas do you serve?",
    a: "Projects across the metro region and surrounding areas. Contact us to confirm coverage for your location.",
  },
] as const;

export const contactIcons = { CalendarCheck, Search };
