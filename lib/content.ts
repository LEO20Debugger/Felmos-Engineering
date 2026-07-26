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

/* ────────────────────────────── trust strip ────────────────────────────── */

export const trustPoints = [
  { icon: ShieldCheck, label: "Certified Engineers" },
  { icon: Gauge, label: "Calibrated Equipment" },
  { icon: Clock, label: "Fast Report Delivery" },
  { icon: Headset, label: "Direct Engineer Access" },
] as const;

/* ─────────────────────────────── the numbers ────────────────────────────── */

export const stats = [
  { value: 12, suffix: "+", label: "Years in practice" },
  { value: 640, suffix: "+", label: "Projects tested" },
  { value: 98, suffix: "%", label: "Reports on schedule" },
  { value: 5, suffix: "", label: "Testing disciplines" },
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
    clients: ["Homeowners", "Banks", "Property Developers"],
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

export const audiences = [
  { icon: Users, label: "Property Developers" },
  { icon: Home, label: "Homeowners" },
  { icon: Landmark, label: "Banks & Lenders" },
  { icon: Ruler, label: "Architects" },
  { icon: HardHat, label: "Construction Firms" },
  { icon: Building2, label: "Government Projects" },
] as const;

/* ─────────────────────────────── why felmos ────────────────────────────── */

export const differentiators = [
  { icon: Target, title: "Accurate Reports", line: "Measured and cross-checked, never estimated." },
  { icon: Award, title: "Certified Engineers", line: "Chartered professionals on every job." },
  { icon: Gauge, title: "Modern Equipment", line: "Calibrated instruments on every site." },
  { icon: Clock, title: "Fast Turnaround", line: "Delivered on the date we committed to." },
  { icon: Headset, title: "Real Support", line: "Speak to the engineer who did the work." },
  { icon: Scale, title: "Code Compliant", line: "Built to satisfy lenders and regulators." },
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

export const team = [
  { name: "K. Adeyemi", role: "Principal Structural Engineer", tag: "P.Eng · 18 yrs", image: "team-1" },
  { name: "S. Nwosu", role: "Lead Geotechnical Engineer", tag: "M.Sc Geotech", image: "team-2" },
  { name: "R. Alvarez", role: "NDT Testing Specialist", tag: "ACI Certified", image: "team-3" },
  { name: "T. Bello", role: "Quality Assurance Lead", tag: "Chartered Engineer", image: "team-4" },
] as const satisfies ReadonlyArray<{ name: string; role: string; tag: string; image: ImageKey }>;

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
