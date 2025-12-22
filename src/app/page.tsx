import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Mountain,
  Zap,
  Clock,
  Utensils,
  Map,
  Users,
  ChevronRight,
  Shield,
  Bike,
  Check,
  MapPin,
  Calendar,
  Route,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Enhanced SEO metadata for landing page
export const metadata: Metadata = {
  title: "FinalClimb - Cycling Race Execution Plans | Gravel, MTB & Road",
  description:
    "Build personalized cycling race execution plans with power targets, pacing strategy, nutrition timing, and checkpoint goals. Designed for gravel racing, mountain biking, and ultra-endurance cycling events.",
  keywords: [
    "cycling race planning",
    "gravel race pacing",
    "cycling power targets",
    "MTB race strategy",
    "gravel cycling",
    "endurance cycling",
    "Unbound Gravel",
    "Mid South",
    "SBT GRVL",
    "Leadville 100 MTB",
    "cycling coach software",
    "FTP pacing calculator",
    "bike race nutrition plan",
    "gravel bike racing",
    "mountain bike racing",
  ],
  openGraph: {
    title: "FinalClimb - Cycling Race Execution Plans | Gravel, MTB & Road",
    description:
      "Stop guessing on race day. Build data-driven cycling race plans with power targets, nutrition timing, and checkpoint strategies for gravel, MTB, and road events.",
    type: "website",
    url: "https://finalclimb.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FinalClimb - Cycling Race Planning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalClimb - Cycling Race Execution Plans",
    description:
      "Build data-driven cycling race plans with power targets, nutrition timing, and checkpoint strategies.",
  },
  alternates: {
    canonical: "https://finalclimb.com",
  },
};

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://finalclimb.com/#organization",
      name: "FinalClimb",
      url: "https://finalclimb.com",
      logo: {
        "@type": "ImageObject",
        url: "https://finalclimb.com/logo.png",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://finalclimb.com/#website",
      url: "https://finalclimb.com",
      name: "FinalClimb",
      publisher: { "@id": "https://finalclimb.com/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "FinalClimb",
      applicationCategory: "SportsApplication",
      applicationSubCategory: "Cycling Race Planning",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "20",
        priceCurrency: "USD",
        priceValidUntil: "2026-12-31",
      },
    },
  ],
};

const features = [
  {
    icon: Zap,
    title: "Power-Based Pacing",
    description:
      "Altitude-adjusted power targets for every segment. Know exactly what watts to hold on climbs vs flats based on your FTP.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Clock,
    title: "Checkpoint Timing",
    description:
      "Hit your splits with precision. See projected arrival times at every aid station, water crossing, and key landmark.",
    color: "text-brand-sky-500",
    bg: "bg-brand-sky-500/10",
  },
  {
    icon: Utensils,
    title: "Nutrition Strategy",
    description:
      "Carbs, hydration, and sodium targets by the hour. Dial in your fueling for 6, 10, or 20+ hour efforts.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Map,
    title: "Course Intelligence",
    description:
      "Elevation profiles, surface breakdowns (gravel, pavement, singletrack), and key sections flagged.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Bike,
    title: "Gear Tracking",
    description:
      "Log your bike setup, tire choice, and gearing. See what other riders are running for each course.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "Coach Integration",
    description:
      "Coaches can build and lock plans for their athletes. Dial in power targets for your entire roster.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
];

// Helper to parse date as local time
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

// Generate a beautiful gradient based on race name for cards without images
function generateGradient(name: string): string {
  const gradients = [
    "from-brand-navy-800 via-brand-navy-700 to-brand-sky-900",
    "from-emerald-800 via-teal-700 to-brand-navy-900",
    "from-amber-700 via-orange-600 to-red-800",
    "from-purple-800 via-violet-700 to-brand-navy-900",
    "from-rose-700 via-pink-600 to-purple-800",
    "from-brand-sky-700 via-cyan-600 to-teal-700",
    "from-slate-800 via-zinc-700 to-stone-800",
    "from-indigo-800 via-blue-700 to-brand-navy-900",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length]!;
}

// Format date range from array of dates
function formatDateRange(dates: (string | null)[]): string | null {
  const validDates = dates
    .filter((d): d is string => d !== null)
    .map((d) => parseLocalDate(d))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length === 0) return null;

  const firstDate = validDates[0]!;
  const lastDate = validDates[validDates.length - 1]!;

  if (validDates.length === 1 || firstDate.getTime() === lastDate.getTime()) {
    return firstDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const sameMonth = firstDate.getMonth() === lastDate.getMonth() && firstDate.getFullYear() === lastDate.getFullYear();
  if (sameMonth) {
    const month = firstDate.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${firstDate.getDate()}-${lastDate.getDate()}, ${firstDate.getFullYear()}`;
  }

  const firstFormatted = firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const lastFormatted = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${firstFormatted} - ${lastFormatted}`;
}

// Format distances display
function formatDistances(distances: { distance_miles: number; elevation_gain: number | null }[]): {
  distanceText: string;
  elevationText: string | null;
} {
  if (distances.length === 0) return { distanceText: "", elevationText: null };

  const uniqueMiles = [...new Set(distances.map(d => d.distance_miles))].sort((a, b) => b - a);
  const distanceText = uniqueMiles.length > 1
    ? `${uniqueMiles[uniqueMiles.length - 1]}-${uniqueMiles[0]} mi`
    : `${uniqueMiles[0]} mi`;

  const maxElevation = Math.max(...distances.map(d => d.elevation_gain || 0));
  const elevationText = maxElevation > 0 ? `${maxElevation.toLocaleString()} ft` : null;

  return { distanceText, elevationText };
}

const disciplines = [
  { name: "Gravel Racing", description: "Long-distance mixed-surface events" },
  { name: "Mountain Biking", description: "XC, endurance, and ultra-distance MTB" },
  { name: "Road Cycling", description: "Gran fondos and ultra-endurance road events" },
  { name: "Cyclocross", description: "CX race pacing and strategy" },
];

interface RaceDistance {
  id: string;
  distance_miles: number;
  date: string | null;
  elevation_gain: number | null;
}

interface RaceEdition {
  id: string;
  year: number;
  race_distances: RaceDistance[];
}

interface Race {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  hero_image_url: string | null;
  race_subtype: string;
  race_editions: RaceEdition[];
}

export default async function HomePage() {
  // Fetch races from database
  const supabase = await createClient();
  const { data: racesData } = await supabase
    .from("races")
    .select(`
      id,
      name,
      slug,
      location,
      hero_image_url,
      race_subtype,
      race_editions (
        id,
        year,
        race_distances (
          id,
          distance_miles,
          date,
          elevation_gain
        )
      )
    `)
    .eq("is_active", true);

  // Process and sort races chronologically
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const races = (racesData || []).map((race: Race) => {
    // Get all dates from all editions
    const allDates: { date: Date; edition: RaceEdition }[] = [];
    for (const edition of race.race_editions || []) {
      for (const distance of edition.race_distances || []) {
        if (distance.date) {
          allDates.push({ date: parseLocalDate(distance.date), edition });
        }
      }
    }

    // Find the next upcoming date
    const upcomingDates = allDates.filter(d => d.date >= today);
    const nextDate = upcomingDates.length > 0
      ? upcomingDates.sort((a, b) => a.date.getTime() - b.date.getTime())[0]
      : allDates.sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    // Get the edition with the next upcoming date
    const relevantEdition = nextDate?.edition || race.race_editions[0];
    const distances = relevantEdition?.race_distances || [];
    const dateStrings = distances.map(d => d.date);
    const { distanceText, elevationText } = formatDistances(distances);
    const dateRange = formatDateRange(dateStrings);

    return {
      ...race,
      nextDate: nextDate?.date || null,
      distanceText,
      elevationText,
      dateRange,
    };
  });

  // Sort by next upcoming date
  const sortedRaces = races
    .sort((a, b) => {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    })
    .slice(0, 6); // Limit to 6 races

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-navy-950/80 backdrop-blur-xl border-b border-white/5">
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Mountain className="h-7 w-7 text-brand-sky-400 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-heading font-bold text-white tracking-tight">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#races"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Races
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Pricing
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-brand-navy-900 bg-brand-sky-400 hover:bg-brand-sky-300 px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section
          className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-navy-950"
          aria-labelledby="hero-heading"
        >
          {/* Atmospheric Background */}
          <div className="absolute inset-0">
            {/* Gradient Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900 via-brand-navy-950 to-black" />

            {/* Topographic Pattern - evokes cycling/terrain */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 30, 50 50 T 100 50' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 60 Q 25 40, 50 60 T 100 60' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q 25 50, 50 70 T 100 70' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 40 Q 25 20, 50 40 T 100 40' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 30 Q 25 10, 50 30 T 100 30' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            />

            {/* Radial Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-sky-500/10 rounded-full blur-[120px]" />

            {/* Grain Texture */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Bike className="h-4 w-4 text-brand-sky-400" />
              <span className="text-sm text-white/80">
                2026 Race Season Ready
              </span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight leading-[1.1]"
            >
              Race Day
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sky-400 via-brand-sky-300 to-emerald-400">
                Execution Plans
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Data-driven race plans for{" "}
              <span className="text-white/80 font-medium">gravel racing</span>,{" "}
              <span className="text-white/80 font-medium">mountain biking</span>, and{" "}
              <span className="text-white/80 font-medium">ultra-endurance cycling</span>.
              Power targets, nutrition timing, and checkpoint strategies built around your FTP.
            </p>

            {/* Discipline Tags */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {["Gravel", "MTB", "Road", "Cyclocross"].map((discipline) => (
                <span
                  key={discipline}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-white/5 text-white/70 border border-white/10"
                >
                  {discipline}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-brand-navy-900 bg-brand-sky-400 rounded-xl hover:bg-brand-sky-300 transition-all duration-200 shadow-lg shadow-brand-sky-500/25 hover:shadow-brand-sky-500/40 hover:scale-[1.02]"
              >
                Build Your Race Plan
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Free to explore races</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4" />
                <span>Built for cyclists</span>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-white/40 rounded-full" />
            </div>
          </div>
        </section>

        {/* Disciplines Bar */}
        <section className="relative bg-brand-navy-900 border-y border-white/5 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {disciplines.map((discipline) => (
                <div key={discipline.name} className="text-center">
                  <div className="text-lg font-heading font-semibold text-white">
                    {discipline.name}
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    {discipline.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-24 sm:py-32 bg-white"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2
                id="features-heading"
                className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900"
              >
                Everything You Need to
                <span className="text-brand-sky-500"> Execute Your Race</span>
              </h2>
              <p className="mt-4 text-lg text-brand-navy-600">
                Stop guessing on race day. Get the tools to pace your effort, fuel properly,
                and hit your goal time.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group relative p-6 rounded-2xl border border-brand-navy-100 hover:border-brand-sky-200 bg-white hover:shadow-xl transition-all duration-300"
                  >
                    <div
                      className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}
                    >
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-brand-navy-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-brand-navy-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Races Section */}
        <section
          id="races"
          className="py-24 sm:py-32 bg-brand-navy-50"
          aria-labelledby="races-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2
                id="races-heading"
                className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900"
              >
                Pre-Loaded <span className="text-brand-sky-500">Race Courses</span>
              </h2>
              <p className="mt-4 text-lg text-brand-navy-600">
                Select your race and get instant access to course data, elevation profiles,
                aid station locations, and more. New races added regularly.
              </p>
            </div>

            {/* Race Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRaces.map((race) => {
                const gradient = generateGradient(race.name);
                return (
                  <article
                    key={race.slug}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-brand-navy-100 hover:border-brand-sky-300 transform hover:-translate-y-1 h-80"
                  >
                    {/* Hero Image or Gradient */}
                    <div className="relative w-full h-48 overflow-hidden">
                      {race.hero_image_url ? (
                        <Image
                          src={race.hero_image_url}
                          alt={race.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                          {/* Subtle pattern overlay */}
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                          />
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Stats Badge */}
                      {(race.distanceText || race.elevationText) && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-navy-900/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg">
                            <Route className="h-3.5 w-3.5 text-brand-sky-400" />
                            {race.distanceText}
                            {race.elevationText && (
                              <>
                                <span className="text-brand-navy-400 mx-0.5">•</span>
                                <Mountain className="h-3.5 w-3.5 text-brand-sky-400" />
                                {race.elevationText}
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Race Type Badge */}
                      {race.race_subtype && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-navy-700 text-xs font-semibold uppercase tracking-wide shadow-md">
                            {race.race_subtype === "cx" ? "Cyclocross" : race.race_subtype}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-heading font-bold text-brand-navy-900 text-lg group-hover:text-brand-sky-600 transition-colors line-clamp-2">
                        {race.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-navy-600">
                        {race.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-brand-sky-500" />
                            <span className="truncate max-w-[150px]">{race.location}</span>
                          </span>
                        )}
                        {race.dateRange && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-brand-sky-500" />
                            {race.dateRange}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* View All Link */}
            <div className="mt-12 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-brand-sky-600 hover:text-brand-sky-700 font-semibold"
              >
                View all supported races
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-24 sm:py-32 bg-white"
          aria-labelledby="how-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2
                id="how-heading"
                className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900"
              >
                Race Ready in <span className="text-brand-sky-500">3 Steps</span>
              </h2>
              <p className="mt-4 text-lg text-brand-navy-600">
                From signup to start line in minutes. Get your personalized race plan
                before your next big event.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Enter Your Numbers",
                  description:
                    "Your FTP, weight, and nutrition preferences. We calculate altitude-adjusted power targets automatically.",
                },
                {
                  step: "02",
                  title: "Select Your Race",
                  description:
                    "Choose from our library of gravel, MTB, and road events with pre-loaded course data and aid stations.",
                },
                {
                  step: "03",
                  title: "Get Your Plan",
                  description:
                    "Receive personalized power targets, checkpoint times, and nutrition schedule for race day.",
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-sky-300 to-transparent" />
                  )}

                  <div className="relative bg-brand-navy-50 rounded-2xl p-8 border border-brand-navy-100">
                    <div className="text-5xl font-heading font-bold text-brand-sky-400/20 mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-brand-navy-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-brand-navy-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-24 sm:py-32 bg-brand-navy-900"
          aria-labelledby="pricing-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2
              id="pricing-heading"
              className="text-3xl sm:text-4xl font-heading font-bold text-white"
            >
              Simple <span className="text-brand-sky-400">Pricing</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              One plan. All features. Build unlimited race plans for less than a gel pack per month.
            </p>

            {/* Pricing Card */}
            <div className="mt-12 bg-white rounded-3xl shadow-2xl border border-brand-navy-100 p-8 sm:p-12 max-w-lg mx-auto">
              <div className="text-brand-sky-500 font-semibold text-sm uppercase tracking-wider mb-2">
                Annual Membership
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-heading font-bold text-brand-navy-900">
                  $20
                </span>
                <span className="text-brand-navy-500">/year</span>
              </div>
              <p className="mt-2 text-brand-navy-600">
                That&apos;s less than $2/month
              </p>

              <ul className="mt-8 space-y-4 text-left">
                {[
                  "Unlimited race plans",
                  "All supported races & courses",
                  "Power & nutrition calculations",
                  "Exportable race sheets",
                  "Gear tracking",
                  "Course maps & elevation profiles",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-brand-navy-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-brand-navy-900 rounded-xl hover:bg-brand-navy-800 transition-all duration-200"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Link>

              <p className="mt-4 text-sm text-brand-navy-500">
                Browse races free. Subscription required for full plans.
              </p>
            </div>

            {/* Coach Pricing Teaser */}
            <p className="mt-12 text-white/60">
              <span className="font-semibold text-white">Coaches:</span> Manage your
              athletes&apos; race plans.{" "}
              <Link
                href="/signup"
                className="text-brand-sky-400 hover:text-brand-sky-300 font-medium"
              >
                View coach pricing →
              </Link>
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 sm:py-32 bg-brand-navy-950 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-sky-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white">
              Your Next PR Starts with a Plan
            </h2>
            <p className="mt-6 text-xl text-white/60 max-w-2xl mx-auto">
              Show up to race day with a clear execution strategy. Know your power targets,
              your nutrition timing, and your checkpoint goals.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-brand-navy-900 bg-brand-sky-400 rounded-xl hover:bg-brand-sky-300 transition-all duration-200 shadow-lg shadow-brand-sky-500/25"
              >
                Build Your Race Plan
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-navy-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-brand-sky-400" />
              <span className="text-lg font-heading font-bold text-white">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/50">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="#races" className="hover:text-white transition-colors">
                Races
              </a>
              <a href="#pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <Link
                href="/login"
                className="hover:text-white transition-colors"
              >
                Login
              </Link>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </nav>

            {/* Copyright */}
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} FinalClimb. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
