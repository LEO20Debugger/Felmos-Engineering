import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Compass,
  Crosshair,
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
  Radar,
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
  /* Kept in step with `services.length` by the guard at the foot of this file.
     Relabelled from "Testing disciplines" when the list grew to eight: piling
     works, drawings, project management and repairs are delivery services, not
     testing disciplines, so the old label would have overcounted the lab. */
  { key: "disciplines", value: 8, suffix: "", label: "Services offered" },
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

/* The eight below are Felmos's own service list, supplied verbatim — titles,
   `short`, `lead` and `benefits` are company copy. Note that the practice is no
   longer described as testing-only: 05 through 08 are delivery services
   (piling, drawings, project management, repairs), which is why the section
   heading and the stats label say "services" rather than "testing disciplines".

   `clients` on 08 is deliberately empty — see the comment on that entry. */
export const services: Service[] = [
  {
    slug: "integrity-testing",
    num: "01",
    title: "Non-Destructive Integrity Testing",
    label: "Integrity",
    short: "Assess structural condition without damaging the structure.",
    lead: "Structural condition assessed using methods that don't damage or disrupt the asset — applied to roads, buildings and bridges to determine integrity without taking them out of service.",
    icon: Waves,
    image: "svc-integrity-testing",
    benefits: [
      "Confirms condition without disrupting use of the structure",
      "Detects deterioration before it becomes visible or urgent",
      "Applies across roads, buildings and bridges",
    ],
    clients: ["Government Projects", "Property Developers", "Banks"],
  },
  {
    slug: "concrete-strength",
    num: "02",
    title: "Concrete Compressive Strength Testing",
    label: "Concrete",
    short: "Confirm concrete has reached the strength the design requires.",
    lead: "Concrete strength tested against the design specification, before load is placed on the structure or before work proceeds to the next stage.",
    icon: Gauge,
    image: "svc-concrete-strength",
    benefits: [
      "Confirms concrete meets design strength before it's load-bearing",
      "Catches under-strength concrete before it's built over",
      "Required for stage sign-off on most construction projects",
    ],
    clients: ["Construction Companies", "Property Developers", "Government Projects"],
  },
  {
    slug: "pile-testing",
    num: "03",
    title: "Pile Integrity & Pile Load Testing",
    label: "Pile Testing",
    short: "Verify pile continuity and load capacity before you build on it.",
    lead: "Piles tested for structural continuity and load-bearing capacity — before a structure is built on top, or after settlement raises doubt about an existing pile.",
    icon: Ruler,
    image: "svc-pile-testing",
    benefits: [
      "Confirms piles are sound before they carry structural load",
      "Identifies pile defects that aren't visible from the surface",
      "Applies to both new piling and investigation of existing foundations",
    ],
    clients: ["Property Developers", "Construction Companies", "Architects"],
  },
  {
    slug: "subsoil-investigation",
    num: "04",
    title: "Sub-soil Investigation",
    label: "Sub-soil",
    short: "Know what you're building on before you build.",
    lead: "Ground bearing capacity and composition determined through sub-soil investigation, before foundation design begins.",
    icon: Layers,
    image: "svc-subsoil",
    benefits: [
      "Prevents costly foundation redesign later",
      "Establishes bearing capacity and settlement risk",
      "Required for most municipal approvals",
    ],
    clients: ["Property Developers", "Architects", "Homeowners"],
  },
  {
    slug: "piling-works",
    num: "05",
    title: "Piling Works & Foundation Repairs",
    label: "Piling Works",
    short: "Correct a failing foundation, or install piling where ground conditions demand it.",
    lead: "Piling installation and foundation repair carried out where sub-soil investigation shows the existing foundation is inadequate, or where ground conditions require piled support from the start.",
    icon: Mountain,
    image: "svc-piling-works",
    benefits: [
      "Addresses settlement, cracking or movement at the source",
      "Piling scoped to the ground conditions confirmed by testing, not estimated",
      "Suited to both new construction and remedial work on existing structures",
    ],
    clients: ["Property Developers", "Homeowners", "Construction Companies"],
  },
  {
    slug: "structural-drawings",
    num: "06",
    title: "Structural Drawing Production",
    label: "Drawings",
    short: "Structural drawings prepared for approval, construction or as-built record.",
    lead: "Structural drawings produced to support design approval, construction, or renovation work — reflecting either the intended design or the as-built condition confirmed by inspection.",
    icon: FileText,
    image: "svc-drawings",
    benefits: [
      "Provides the drawing set regulators and contractors require",
      "Aligns drawings with actual site or structural conditions",
      "Supports both new-build design and renovation planning",
    ],
    clients: ["Architects", "Property Developers", "Construction Companies"],
  },
  {
    slug: "project-management",
    num: "07",
    title: "Project Management",
    label: "Management",
    short: "Coordinate the project from design through completion.",
    lead: "Engineering oversight of a construction or renovation project — coordinating design, contractors and compliance through to completion.",
    icon: ClipboardCheck,
    image: "svc-project-management",
    benefits: [
      "Single point of accountability across the project",
      "Reduces risk of design and construction falling out of alignment",
      "Engineering oversight through to project completion",
    ],
    clients: ["Property Developers", "Homeowners"],
  },
  {
    slug: "building-repairs",
    num: "08",
    title: "Building Repairs & Renovations",
    label: "Repairs",
    short: "Repair or renovate a structure based on its actual condition, not guesswork.",
    lead: "Repair and renovation work carried out on existing structures, informed by structural integrity assessment where prior testing has identified the cause of damage or deterioration.",
    icon: Building2,
    image: "svc-building-repairs",
    benefits: [
      "Repairs address the diagnosed cause, not just the visible symptom",
      "Renovation scoped against the structure's actual condition",
      "Suited to buildings with known cracking, settlement or deterioration",
    ],
    /* The supplied copy gives no client list for this service — every other
       entry names three. Left empty rather than guessed: `clients` drives the
       audience joins below and the tag row on /services, both of which degrade
       cleanly on an empty array, whereas a wrong guess would route the wrong
       audience here. Ask Felmos who this is for and fill it in. */
    clients: [],
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

/**
 * Most of a project is optional, and that is the shape of the real data rather
 * than laziness about the type.
 *
 * The company's project record supplies a title, a location and an account of
 * the work. It supplies a client name and a year only for the engagements whose
 * report title page was photographed, and it supplies no duration, outcome or
 * headline figure at all. Rather than invent them — on a page whose entire job
 * is to be credible — every field that can be absent is nullable, and the fact
 * grid, the metric block and the outcome line each render only when they have
 * something to say.
 */
export type Project = {
  slug: string;
  num: string;
  title: string;
  category: string | null;
  location: string | null;
  year: number | null;
  client: string | null;
  /** How long the engagement ran — fills a cell of the fact grid. */
  duration: string | null;
  /** One line. Used by the homepage teaser and the index, where there is no
      room for the narrative. */
  scope: string;
  /** The dossier body: what was found, and how. */
  narrative: string;
  result: string | null;
  metric: ProjectMetric | null;
  /** Slugs from `services` above. Rendered as links through to /services#slug,
      so a project shows which disciplines it drew on. Kept as string[] rather
      than a slug union — `Service["slug"]` is plain string, and narrowing it
      would ripple through five other files for no real gain. The render site
      guards with `services.find()`. */
  services: string[];
  /** Null in the fallback: these seventeen have real photographs, but they live
      on the media volume rather than in lib/images.ts. A build that falls back
      to this array renders the text and leaves the frames blank. */
  image: ImageKey | null;
};

/* The seventeen engagements below are the company's real record, transcribed
   from its own project brief (the source manifest is api/seed/deck-projects.json,
   and the photographs went in with it).

   This array is now only a fallback. The site reads projects from the database
   through getProjects(); these entries are what renders if the API is
   unreachable at build time, which must never fail a Vercel deploy. Treat them
   as a snapshot, not the source of truth — corrections belong in the dashboard.

   Nulls are deliberate. The brief records no duration, outcome or headline
   figure for any of this work, and client and year only where a report title
   page was photographed. Nothing here is estimated; the render sites omit a
   fact they do not have rather than printing a gap. */

export const projects: Project[] = [
  {
    slug: "tafawa-balewa-square",
    num: "01",
    title: "Tafawa Balewa Square",
    category: "Non-Destructive Integrity Testing",
    location: "Onikan, Lagos Island, Lagos",
    year: 2023,
    client: "Tafawa Balewa Square Management Board",
    duration: null,
    scope: "Non-destructive integrity testing of every structural member across Nigeria's foremost ceremonial ground.",
    narrative:
      "Built in 1972 and holding over 55,000 people, Tafawa Balewa Square is Nigeria's foremost ceremonial ground and games centre. Felmos Engineering carried out an in-situ non-destructive integrity test on all the structural members within the facility â€” the pavilion, the towers, the terrace and the office complex among them â€” working throughout with ultrasonic equipment so that a building of this standing was never cut into.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "st-nicholas-house",
    num: "02",
    title: "St. Nicholas House",
    category: "Non-Destructive Integrity Testing",
    location: "26 Catholic Mission Street, Lagos Island, Lagos",
    year: 2023,
    client: "St. Nicholas",
    duration: null,
    scope: "Integrity testing of a fifteen-floor high rise in continuous use as a hospital, offices and car park.",
    narrative:
      "St. Nicholas House is a fifteen-floor high-rise on Lagos Island housing a hospital, an office complex and a car park. Felmos Engineering tested the compressive strength of the structural elements in situ, floor by floor, without taking the building out of use â€” the whole survey ran non-destructively around an operating hospital.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "eko-electricity-distribution",
    num: "03",
    title: "Eko Electricity Distribution Company",
    category: "Non-Destructive Integrity Testing",
    location: "Marina, Lagos Island, Lagos",
    year: null,
    client: null,
    duration: null,
    scope: "Integrity testing of all structural members in a sixteen-floor high rise at the centre of Lagos power distribution.",
    narrative:
      "A sixteen-floor high-rise structure and the home of Eko Electricity Distribution Company. Felmos Engineering conducted a non-destructive integrity test on all the structural members within the facility, working around occupied offices throughout.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "iddo-modern-market",
    num: "04",
    title: "Iddo Modern Market",
    category: "Non-Destructive Integrity Testing",
    location: "Mainland L.C.D.A., Lagos",
    year: 2023,
    client: "Total Value Integrated Services Limited",
    duration: null,
    scope: "Testing of an ongoing commercial centre of six units, two floors each.",
    narrative:
      "An ongoing six-unit commercial centre, two floors to each unit. Felmos Engineering tested the compressive strength of the structural elements in situ while the building was still under construction, which is when a strength problem is cheapest to put right.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "british-canadian-university",
    num: "05",
    title: "British-Canadian University",
    category: "Non-Destructive Integrity Testing",
    location: "Obudu, Cross River",
    year: 2022,
    client: "British-Canadian University",
    duration: null,
    scope: "Campus-wide testing across the administration block, faculty building, hostels, library and staff quarters.",
    narrative:
      "Felmos Engineering carried out non-destructive testing across the university's campus at Obudu: the administration block, the faculty building, hostels one and two, the library, and staff quarters one and two. A single mobilisation covered the whole campus rather than returning building by building.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "wemabod-marina",
    num: "06",
    title: "Wemabod, Marina",
    category: "Non-Destructive Integrity Testing",
    location: "37 Marina Road, Lagos Island, Lagos",
    year: 2022,
    client: "Wemabod",
    duration: null,
    scope: "Integrity testing of all structural members in a twenty-floor building on the Marina.",
    narrative:
      "A twenty-floor building on Marina Road. Felmos Engineering conducted non-destructive testing on all the structural members â€” slabs, beams, columns and walls â€” across the height of the tower.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "barracuda-beach-resort",
    num: "07",
    title: "Barracuda Beach Resort & Water Park",
    category: "Non-Destructive Integrity Testing",
    location: "Okun-Ajah Road, off Ogombo Road, Lekki Phase 2, Eti-Osa, Lagos",
    year: 2023,
    client: "Barracuda Beach Resort & Water Park Limited",
    duration: null,
    scope: "Testing of every structure across the resort â€” hotel, offices, lounge, pool house, laundry, bar, kitchen, games house and security post.",
    narrative:
      "Felmos Engineering conducted a non-destructive integrity test on all the structures within the resort: the hotel, the office complex, the lounge and hall, the pool house, the laundry, the bar, the kitchen and hall, the preview building, the MTN house, the security post and the games house. Eleven separate buildings, surveyed across one engagement.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "lagos-state-college-of-nursing",
    num: "08",
    title: "Lagos State College of Nursing Sewage Treatment Plant",
    category: "Non-Destructive Integrity Testing",
    location: "Igando, Lasu-Iba Road, Lagos",
    year: 2023,
    client: "Lagos State College of Nursing, Igando",
    duration: null,
    scope: "Non-destructive testing of an existing sewage treatment plant.",
    narrative:
      "Felmos Engineering conducted a non-destructive test on the college's existing sewage treatment plant, working across the aeration, clarifier and effluent sections. Testing a wet, buried structure means reaching the concrete through opened covers and narrow excavations rather than working from a clear face.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "teju-industrial-clinic",
    num: "09",
    title: "Teju Industrial Clinic",
    category: "Non-Destructive Integrity Testing",
    location: "Fola Osibo Street, Lekki Phase 1, Eti-Osa, Lagos",
    year: null,
    client: null,
    duration: null,
    scope: "Testing of an ongoing six-floor commercial building at Lekki Phase 1.",
    narrative:
      "An ongoing six-floor commercial building on Fola Osibo Street. Felmos Engineering tested the structural members in situ during construction.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "agl-property-marina",
    num: "10",
    title: "AGL Property",
    category: "Non-Destructive Integrity Testing",
    location: "Marina Road, Lagos Island, Lagos",
    year: null,
    client: null,
    duration: null,
    scope: "Testing of a multi-functional structure on Marina Road.",
    narrative:
      "A multi-functional structure on Marina Road, Lagos Island. Felmos Engineering tested the structural members in situ, working from bamboo scaffolding and beneath the slabs where no other access existed.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "high-point-properties",
    num: "11",
    title: "High Point Properties",
    category: "Non-Destructive Integrity Testing",
    location: "5 MacGregor Road, Ikoyi, Lagos",
    year: 2023,
    client: "High Point Properties Limited",
    duration: null,
    scope: "Integrity testing of all structural members in an ongoing three-floor building complex.",
    narrative:
      "An ongoing three-floor building complex at Ikoyi. Felmos Engineering conducted a non-destructive integrity test on all the structural members within the facility while the frame was still going up.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "bua-group-office-tower",
    num: "12",
    title: "Office Development for BUA Group",
    category: "Non-Destructive Integrity Testing",
    location: "10 Mulliner Road, Ikoyi, Eti-Osa, Lagos",
    year: 2022,
    client: "BUA Group",
    duration: null,
    scope: "Testing of all structural members in a seven-floor commercial building â€” the proposed office tower for Intercontinental Bank Plc.",
    narrative:
      "A building of seven floors built for commercial purposes, the proposed office tower for Intercontinental Bank Plc. Felmos Engineering tested all the structural members in situ, working from the scaffold and from the slabs above as the frame rose.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "gr-estate-development",
    num: "13",
    title: "G&R Estate Development",
    category: "Sub-Structure Integrity Testing",
    location: "19B Cooper Road, off Bourdillon Road, Ikoyi, Lagos",
    year: 2023,
    client: "G&R Estate Development Company Limited",
    duration: null,
    scope: "Integrity testing of all sub-structural members ahead of a proposed thirteen-floor building.",
    narrative:
      "A proposed thirteen-floor building at Ikoyi. Felmos Engineering conducted a non-destructive integrity test on all the sub-structural members â€” the part of a tower that becomes unreachable the moment the frame goes up, and the only sensible time to test it is before that happens.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "holy-rosary-auditorium",
    num: "14",
    title: "Holy Rosary Secondary School Auditorium",
    category: "Failure Investigation",
    location: "Umuahia, Abia",
    year: null,
    client: null,
    duration: null,
    scope: "Investigation into the cause of a collapsed auditorium at finishing stage.",
    narrative:
      "An ongoing auditorium at finishing stage collapsed at Holy Rosary Secondary School. Felmos Engineering was engaged to conduct a non-destructive test to investigate the cause or causes. Work ran from the failed roof structure down to foundations reached by hand excavation.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "citadel-hotel-uromi",
    num: "15",
    title: "Citadel Hotel",
    category: "Non-Destructive Integrity Testing",
    location: "New Agbor Road, Uromi, Esan North-East, Edo",
    year: null,
    client: null,
    duration: null,
    scope: "Testing of both sub-structure and super-structure on an ongoing five-floor commercial building.",
    narrative:
      "An ongoing five-floor building at finishing stage, built for commercial purposes. Both the sub-structure and the super-structure were tested by Felmos Engineering using up-to-date equipment, which meant excavating down to the foundations as well as working through the finished floors above.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "national-stadium-surulere",
    num: "16",
    title: "National Stadium, Surulere",
    category: "Non-Destructive Integrity Testing",
    location: "Surulere, Lagos",
    year: null,
    client: null,
    duration: null,
    scope: "Testing of the facility ahead of renovation.",
    narrative:
      "Built in 1972, the National Stadium is a major sports venue and a symbol of national pride. Felmos Engineering was commissioned to conduct a non-destructive test on the facility prior to renovation â€” establishing what the existing structure could still carry before anything was designed on top of it.",
    result: null,
    metric: null,
    services: ["integrity-testing", "concrete-strength"],
    image: null,
  },
  {
    slug: "dynamic-load-testing",
    num: "17",
    title: "Dynamic Load Testing",
    category: "Pile Load Testing",
    location: "Lagos and Akwa Ibom",
    year: null,
    client: null,
    duration: null,
    scope: "Dynamic load tests on working piles, carried out on sites in Lagos State and Akwa Ibom.",
    narrative:
      "Dynamic load testing establishes the capacity of a pile already in the ground by measuring its response to a controlled impact, rather than by stacking kentledge on top of it. Felmos Engineering has carried these out on sites in Lagos State and in Akwa Ibom, with the site team briefed at the pile before each test.",
    result: null,
    metric: null,
    services: ["pile-testing", "piling-works"],
    image: null,
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
    primary: "subsoil-investigation",
    image: "svc-subsoil",
  },
  {
    slug: "homeowners",
    label: "Homeowners",
    icon: Home,
    need: "Find out what the crack actually means, before you buy or build.",
    matches: ["Homeowners", "Homeowner"],
    primary: "piling-works",
    image: "svc-piling-works",
  },
  {
    slug: "banks-lenders",
    label: "Banks & Lenders",
    icon: Landmark,
    need: "Structural adequacy confirmed independently, in your credit committee's format.",
    matches: ["Banks", "Bank", "Financial Institutions", "Financial Institution"],
    primary: "integrity-testing",
    image: "svc-pile-testing",
  },
  {
    slug: "architects",
    label: "Architects",
    icon: Ruler,
    /* Re-pointed from soil to drawings when the service list changed. Architects
       match three services now (pile testing, sub-soil, drawings); drawings is
       the one no other audience routes to, and it keeps every row on a distinct
       photograph — which is what the old "borrowed image" note was working
       around back when only five svc-* images existed. */
    need: "The structural drawing set your design needs, aligned to real site conditions.",
    matches: ["Architects", "Architect"],
    primary: "structural-drawings",
    image: "svc-drawings",
  },
  {
    slug: "construction-firms",
    label: "Construction Firms",
    icon: HardHat,
    need: "Concrete strength and workmanship verified without stopping the job.",
    matches: ["Construction Companies", "Construction Company", "Construction Firms"],
    primary: "concrete-strength",
    image: "svc-concrete-strength",
  },
  {
    slug: "government-projects",
    label: "Government Projects",
    icon: Building2,
    need: "Roads, bridges and public buildings assessed without taking them out of service.",
    matches: ["Government Projects", "Government Project"],
    primary: "integrity-testing",
    image: "svc-integrity-testing",
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
  projects.filter(
    (p) => p.client !== null && a.matches.some((m) => norm(m) === norm(p.client as string))
  );

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

  /* Added after the service list was replaced wholesale (five entries became
     eight, and three slugs disappeared). Every project links out to its
     disciplines through `services.find()`, which drops an unknown slug silently
     — so the whole set went stale at once with nothing reporting it. */
  const slugs = new Set(services.map((s) => s.slug));
  for (const p of projects) {
    for (const ref of p.services) {
      if (!slugs.has(ref)) {
        console.warn(`[content] project "${p.slug}" references unknown service slug "${ref}"`);
      }
    }
  }

  /* The disciplines figure is rendered on the homepage and both banners as a
     count of what this array holds. It is the same fact stated twice. */
  const disciplines = stats.find((s) => s.key === "disciplines");
  if (disciplines && disciplines.value !== services.length) {
    console.warn(
      `[content] stats "disciplines" says ${disciplines.value} but services has ${services.length} entries.`
    );
  }
}

/* ────────────────────────────── instruments ────────────────────────────── */

/**
 * The testing equipment, named by Felmos's own project brief.
 *
 * Static rather than database-backed on purpose: a testing practice replaces an
 * instrument every few years, not every few weeks, and putting six fixed rows
 * behind a CMS screen buys nothing. Edit them here.
 *
 * The NAMES are the company's, taken verbatim from the equipment slide (spelling
 * corrected). The one-line descriptions are what each class of instrument
 * measures — standard, checkable properties of the tools themselves, not claims
 * about Felmos. Nothing here asserts a calibration status, an accreditation or a
 * turnaround; those live in `differentiators` and need sign-off.
 *
 * Deliberately NO manufacturer product shots. The brief illustrates this slide
 * with vendor material — a Dalian Tailai datasheet, Proceq renders, and a Pundit
 * image carrying an Australian reseller's "2 Year Warranty / Australian Service"
 * advert. Beyond whose copyright they are, they are unusable: the rebar locator
 * is 235×166 and the Pulsar figure is a blurry 397×316, against a site that
 * serves images from 360px to 2000px.
 *
 * The section uses Felmos's own site photography instead — engineers holding
 * these instruments against real structures, 1000px and up, and unarguably the
 * company's own. See `instrumentPhotos` below.
 */
export type Instrument = {
  name: string;
  icon: LucideIcon;
  /** What it measures. One sentence, no superlatives. */
  measures: string;
};

export const instruments: readonly Instrument[] = [
  {
    name: "Digital Schmidt Hammer",
    icon: Gauge,
    measures:
      "Rebound hardness at the surface — fast comparative strength readings across many elements at once.",
  },
  {
    name: "Pundit",
    icon: Waves,
    measures:
      "Ultrasonic pulse velocity through the full thickness of an element, which is what exposes voids, cracking and poor compaction.",
  },
  {
    name: "Pulsar",
    icon: Layers,
    measures:
      "Ultrasonic tomography from a single face, for elements where the opposite side cannot be reached.",
  },
  {
    name: "Profoscope",
    icon: Crosshair,
    measures:
      "Reinforcement position, cover depth and bar diameter, read through the concrete face.",
  },
  {
    name: "Rebar Locator",
    icon: Radar,
    measures:
      "Maps the reinforcement layout across a large area before detailed testing begins.",
  },
  {
    name: "Rebar Corrosion Detector",
    icon: Activity,
    measures:
      "Half-cell potential readings that show where reinforcement has begun to corrode inside concrete that still looks sound.",
  },
] as const;

/**
 * Which project photographs to feature beside the instrument list.
 *
 * Matched on the image's alt text rather than an id, because ids differ between
 * every database the import has ever run against and would not survive a
 * re-import. Alt text is editable in the dashboard, so a match can be lost — the
 * section handles that by rendering the instrument list without the photo band
 * rather than leaving empty frames.
 *
 * These three are deliberate: an instrument is clearly in frame and in use in
 * each. Note what is NOT claimed — no photograph is captioned with a model name.
 * A Bosch detector is identifiable from the housing; a grey handheld unit held
 * against a soffit could be any of four instruments in the list above, and
 * guessing which would put a wrong fact on the page to fill a caption.
 */
export const instrumentPhotos: readonly string[] = [
  "A rebar detector held against an exposed concrete surface",
  "Two engineers setting up an ultrasonic reading between them",
  "A reading taken on a column with its finish removed",
];

/**
 * The three frames of the homepage banner, in the order they play.
 *
 * Mixed sources deliberately. The BUA tower is Felmos's own photograph and
 * comes out of the project galleries; the other two are stock. The company's
 * building shots top out around 1280px — ample on a project page, soft stretched
 * across a full-bleed banner on a desktop — so the banner leads with the real
 * one and keeps two stock frames that hold up at that width.
 *
 * A `project` frame is matched on alt text rather than id: ids differ between
 * every database the import has run against and would not survive a re-import.
 * If the match fails — the project unpublished, or its alt edited in the
 * dashboard — the frame falls back to `fallback` rather than leaving a hole.
 * The crossfade is a three-step CSS loop on one clock, so a missing frame reads
 * as a blank flash rather than as a shorter cycle.
 */
export type HeroFrame =
  | {
      source: "project";
      alt: string;
      fallback: ImageKey;
      /** Describes the FALLBACK picture, not the project one. Alt text travels
          with the image it belongs to — reusing the project's description over
          a stock photograph tells a screen reader about a building that isn't
          on screen, which is worse than no banner at all. */
      fallbackAlt: string;
    }
  | { source: "stock"; image: ImageKey; alt: string };

export const heroFrames: readonly HeroFrame[] = [
  {
    source: "project",
    alt: "The office tower under construction at Mulliner Road, Ikoyi, with its tower crane",
    fallback: "hero",
    fallbackAlt:
      "Tower cranes standing over a glass-clad high-rise under construction",
  },
  {
    source: "stock",
    image: "hero-3",
    alt: "Two high-rise blocks under construction, a tower crane rising beside the left one",
  },
  {
    source: "stock",
    image: "hero-2",
    alt: "A site engineer sighting through a levelling instrument mounted on a tripod",
  },
];

/**
 * The About banner photograph.
 *
 * Same alt-matched-with-a-fallback shape as `heroFrames`, and for the same
 * reasons. A team-on-site shot rather than an empty building: this is the page
 * that answers "who are you", and the survey team walking up to a job says that
 * better than a facade does.
 */
export const aboutHeroPhoto: { alt: string; fallback: ImageKey } = {
  alt: "The main resort building with its curved external staircase, the survey team on site",
  fallback: "about-hero",
};

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

/* Felmos's core values, kept as ONE piece of copy rather than nine list items.
   The company statement names the values mid-sentence, and that is how it now
   renders: `opening`, then the nine names set inline, then `closing`. All three
   parts are the company's own words.

   This replaced a 3x3 grid where each value carried a one-line gloss. The
   glosses were ours, not Felmos's — inventing nine definitions to fill a layout
   put words in the company's mouth that it had never approved, and the grid
   also read as nine separate claims when the source is a single sentence about
   culture. Do not reintroduce per-value copy without sign-off.

   `names` is a plain string list: order is the company's and is not
   alphabetical or ranked, so don't sort it. */
export const coreValues = {
  opening: "A successful organization needs a strong culture. At Felmos Engineering, our culture includes",
  names: [
    "Quality",
    "Integrity",
    "Reliability",
    "Flexibility",
    "Innovativeness",
    "Responsiveness",
    "Professionalism",
    "Mutual Respect",
    "Accountability",
  ],
  closing:
    "Wherever we find ourselves, we live and drive this value daily. People who work at Felmos Engineering are fulfilled because we have an environment that encourages creativity, innovation and a passion to constantly achieve and improve on the present.",
} as const;

/* ─────────────────────────── company philosophy ────────────────────────── */

/* Company copy, supplied by Felmos. `statement` is verbatim; the six pillars
   are the philosophy's own list, split out so the section can set them as
   named items rather than as one run-on sentence. */
export const philosophy = {
  statement:
    "Our business philosophy is based on responsibility, mutual respect, willingness to excel, professionalism, safety and efficiency. We believe that people are our most important asset.",
  pillars: [
    "Responsibility",
    "Mutual Respect",
    "Willingness to Excel",
    "Professionalism",
    "Safety",
    "Efficiency",
  ],
} as const;

/* How the company describes itself and how it gets there — supplied by Felmos.
   `intro` is the registered-company description; `goals` are the three means
   named in the same copy, in the order Felmos gives them. */
export const companyIntro =
  "Felmos Engineering Limited is an indigenous company duly registered according to the laws of Nigeria, with a track record of experience in quality control and assurance of construction materials, structural stability and integrity of existing structures, and other civil engineering services.";

export const companyGoals = [
  {
    icon: Target,
    title: "Resource Management",
    line: "Goals achieved through effective resource management and core competencies at all times.",
  },
  {
    icon: Users,
    title: "Training & Re-training",
    line: "Constant training and re-training of staff keeps competence current, not assumed.",
  },
  {
    icon: Headset,
    title: "Liaison At Every Level",
    line: "Effective liaison and communication with staff at all levels lets us exceed the minimum standard requirement.",
  },
  {
    icon: ShieldCheck,
    title: "HSE Management",
    line: "Above all, we are proud of a successful HSE management system.",
  },
] as const;

/* The mission line is Felmos's own mission statement, supplied verbatim (it
   arrives in full caps; set in sentence case here because it renders as body
   copy, and the headings that carry it are uppercased by CSS anyway). The
   vision line has no company-supplied equivalent yet — it is still ours. */
export const missionVision = [
  {
    icon: Target,
    title: "Our Mission",
    line: "To consistently deliver a high-quality service in the shortest possible time, at a reasonable cost, for the complete satisfaction of our extremely valued client — through the commitment of our highly seasoned staff.",
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
  /* The one entry here is NOT invented — it is Felmos's own claim, supplied in
     the company copy and also stated in the homepage hero. It is still the kind
     of claim the warning above is about, so it wants a certificate on file and
     an approval reference before launch, but it is the company's statement to
     make rather than ours. */
  {
    name: "LASBCA CAP",
    body: "Approved under the Lagos State Building Control Agency's Certified Accreditors Programme",
  },
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
