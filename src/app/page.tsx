import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Mountain,
  Clock,
  MapPin,
  Users,
  Bike,
  Sparkles,
  Check,
  Zap,
  Utensils,
  Route,
  Calendar,
  Sticker,
  Package,
  TrendingUp,
  Target,
  Timer,
  Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, generateGradient, parseLocalDate } from "@/lib/utils";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { OrganizationSchema, WebSiteSchema, SoftwareApplicationSchema } from "@/components/seo";

export const metadata: Metadata = {
  title: "FinalClimb - Race Day Execution Plans for Gravel, MTB & Ultra-Endurance",
  description:
    "Build personalized race execution plans with power targets, pacing strategy, nutrition timing, Garmin integration, and crew logistics. Designed for gravel racing, mountain biking, and ultra-endurance cycling.",
  keywords: [
    "cycling race planning",
    "gravel race pacing",
    "cycling power targets",
    "MTB race strategy",
    "Garmin cycling data field",
    "race nutrition plan",
    "top tube sticker",
    "crew logistics",
  ],
};

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

export default async function HomePage() {
  const supabase = await createClient();
  const { data: racesData } = await supabase
    .from("races")
    .select(`
      id, name, slug, location, hero_image_url, race_subtype,
      race_editions (
        id, year,
        race_distances ( id, distance_miles, date, elevation_gain )
      )
    `)
    .eq("is_active", true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const races = (racesData || []).map((race: Race) => {
    const allDates: { date: Date; edition: RaceEdition }[] = [];
    for (const edition of race.race_editions || []) {
      for (const distance of edition.race_distances || []) {
        if (distance.date) {
          allDates.push({ date: parseLocalDate(distance.date), edition });
        }
      }
    }
    const upcomingDates = allDates.filter(d => d.date >= today);
    const nextDate = upcomingDates.length > 0
      ? upcomingDates.sort((a, b) => a.date.getTime() - b.date.getTime())[0]
      : allDates.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    const relevantEdition = nextDate?.edition || race.race_editions[0];
    const distances = relevantEdition?.race_distances || [];
    const { distanceText, elevationText } = formatDistances(distances);
    const dateRange = formatDateRange(distances.map(d => d.date));

    return { ...race, nextDate: nextDate?.date || null, distanceText, elevationText, dateRange };
  });

  const sortedRaces = races
    .sort((a, b) => {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    })
    .slice(0, 6);

  return (
    <>
      {/* Structured Data */}
      <OrganizationSchema />
      <WebSiteSchema />
      <SoftwareApplicationSchema />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-navy-950/90 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Mountain className="h-7 w-7 text-brand-sky-400 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-heading font-bold text-white tracking-tight">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#races" className="text-sm text-white/70 hover:text-white transition-colors">Races</a>
              <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">How It Works</a>
              <Link href="/about" className="text-sm text-white/70 hover:text-white transition-colors">Our Story</Link>
            </div>
            <Link
              href="/login"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
              Early Access Login
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-navy-950">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900 via-brand-navy-950 to-black" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 30, 50 50 T 100 50' fill='none' stroke='%2338bdf8' stroke-width='0.5'/%3E%3Cpath d='M0 60 Q 25 40, 50 60 T 100 60' fill='none' stroke='%2338bdf8' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q 25 50, 50 70 T 100 70' fill='none' stroke='%2338bdf8' stroke-width='0.5'/%3E%3Cpath d='M0 40 Q 25 20, 50 40 T 100 40' fill='none' stroke='%2338bdf8' stroke-width='0.5'/%3E%3Cpath d='M0 30 Q 25 10, 50 30 T 100 30' fill='none' stroke='%2338bdf8' stroke-width='0.5'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-sky-500/8 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sky-500/10 border border-brand-sky-500/20 mb-8 animate-pulse">
              <Sparkles className="h-4 w-4 text-brand-sky-400" />
              <span className="text-sm font-medium text-brand-sky-300">Launching Early 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight leading-[1.1]">
              Your Race Day
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sky-400 via-brand-sky-300 to-emerald-400">
                Command Center
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Personalized power targets, pacing, nutrition timing, and Garmin integration
              for <span className="text-white/80">gravel racing</span>, <span className="text-white/80">mountain biking</span>,
              and <span className="text-white/80">ultra-endurance</span> events.
            </p>

            <div className="mt-10 max-w-md mx-auto">
              <WaitlistForm source="homepage-hero" />
              <p className="mt-3 text-sm text-white/40">Get early access and launch updates. No spam, ever.</p>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Zap, label: "Power Targets" },
                { icon: Timer, label: "Time Splits" },
                { icon: Utensils, label: "Nutrition Plan" },
                { icon: Monitor, label: "Garmin Sync" },
                { icon: Sticker, label: "Top Tube Stickers" },
                { icon: Package, label: "Crew Logistics" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-white/70 border border-white/10"
                >
                  <item.icon className="h-4 w-4 text-brand-sky-400" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <a href="#features" className="block animate-bounce">
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-white/40 rounded-full" />
              </div>
            </a>
          </div>
        </section>

        {/* Core Features Grid */}
        <section id="features" className="py-24 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900">
                Everything You Need to <span className="text-brand-sky-500">Execute Your Race</span>
              </h2>
              <p className="mt-4 text-lg text-brand-navy-600">
                Stop guessing on race day. Get the tools to pace your effort, fuel properly, and hit your goal time.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Power-Based Pacing",
                  description: "Altitude-adjusted power targets for every segment. Know exactly what watts to hold on climbs vs flats based on your FTP.",
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                {
                  icon: Clock,
                  title: "Time Split Generator",
                  description: "Hit your splits with precision. See projected arrival times at every aid station, water crossing, and key landmark.",
                  color: "text-brand-sky-500",
                  bg: "bg-brand-sky-500/10",
                },
                {
                  icon: Utensils,
                  title: "Hour-by-Hour Nutrition",
                  description: "Carbs, hydration, and sodium targets by the hour. Dial in your fueling strategy for 6, 10, or 20+ hour efforts.",
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
                {
                  icon: Monitor,
                  title: "Garmin Integration",
                  description: "Export your plan to Garmin Edge bike computers. See checkpoints, pacing, and nutrition reminders on your handlebar.",
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
                {
                  icon: Bike,
                  title: "Gear & Setup Tracking",
                  description: "Log your bike setup, tire choice, and gearing. See what other riders are running for each course.",
                  color: "text-rose-500",
                  bg: "bg-rose-500/10",
                },
                {
                  icon: Users,
                  title: "Crew Logistics",
                  description: "Plan drop bags, crew meeting points, and support logistics. Share access so your crew knows the plan.",
                  color: "text-indigo-500",
                  bg: "bg-indigo-500/10",
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group relative p-6 rounded-2xl border border-brand-navy-100 hover:border-brand-sky-200 bg-white hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-brand-navy-900 mb-2">{feature.title}</h3>
                    <p className="text-brand-navy-600 leading-relaxed">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feature Deep Dives */}
        <section className="py-24 sm:py-32 bg-brand-navy-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Power Targets */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
              <div>
                <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 overflow-hidden shadow-xl">
                  <div className="absolute inset-0 p-6">
                    <div className="bg-white rounded-xl shadow-lg p-5">
                      <div className="text-xs font-semibold text-brand-navy-500 uppercase tracking-wide mb-3">Power Targets</div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div>
                            <div className="font-semibold text-brand-navy-900">Climbing</div>
                            <div className="text-xs text-brand-navy-500">Altitude adjusted</div>
                          </div>
                          <div className="text-2xl font-mono font-bold text-amber-600">185-205w</div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-brand-sky-50 border border-brand-sky-200">
                          <div>
                            <div className="font-semibold text-brand-navy-900">Rolling</div>
                            <div className="text-xs text-brand-navy-500">Tempo effort</div>
                          </div>
                          <div className="text-2xl font-mono font-bold text-brand-sky-600">165-180w</div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div>
                            <div className="font-semibold text-brand-navy-900">Flats</div>
                            <div className="text-xs text-brand-navy-500">Recovery pace</div>
                          </div>
                          <div className="text-2xl font-mono font-bold text-emerald-600">145-160w</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
                  <Zap className="h-4 w-4" />
                  Power-Based Pacing
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy-900 mb-4">
                  Know Your Numbers for Every Terrain
                </h3>
                <p className="text-lg text-brand-navy-600 mb-6">
                  Enter your FTP once and get altitude-adjusted power targets for every segment of your race.
                  Different targets for climbing, rolling terrain, and flats so you never blow up.
                </p>
                <ul className="space-y-3">
                  {[
                    "Altitude-adjusted FTP calculations",
                    "Terrain-specific power zones",
                    "Effort level guidance (safe, tempo, pushing)",
                    "Based on your weight and race goals",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-brand-navy-700">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Time Splits & Stickers */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-sky-100 text-brand-sky-700 text-sm font-semibold mb-4">
                  <Timer className="h-4 w-4" />
                  Time Splits & Top Tube Stickers
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy-900 mb-4">
                  Your Race Plan, On Your Bike
                </h3>
                <p className="text-lg text-brand-navy-600 mb-6">
                  Generate checkpoint times based on your goal and print top tube stickers with
                  time splits and hour-by-hour nutrition. Glance down and know exactly where you should be.
                </p>
                <ul className="space-y-3">
                  {[
                    "Checkpoint arrival times based on your goal",
                    "Hour-by-hour carbs, hydration, and sodium",
                    "Custom sizes for any top tube",
                    "Print-ready PDF export",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-brand-navy-700">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-sky-50 to-cyan-50 border border-brand-sky-200 overflow-hidden shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-4 transform -rotate-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold text-brand-navy-900 uppercase tracking-wide">Mid South 100</div>
                        <div className="text-xs text-brand-navy-500">Goal: 7:15</div>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { mile: "25", time: "1:45", note: "Water crossing" },
                          { mile: "42", time: "3:05", note: "Aid 1 - Refill bottles" },
                          { mile: "58", time: "4:20", note: "Crew meetup" },
                          { mile: "75", time: "5:30", note: "Aid 2 - Final push" },
                          { mile: "100", time: "7:15", note: "Finish!" },
                        ].map((row) => (
                          <div key={row.mile} className="flex items-center text-xs border-b border-gray-100 pb-1.5">
                            <span className="w-10 font-mono font-bold text-brand-navy-900">{row.mile}mi</span>
                            <span className="w-14 font-mono text-brand-sky-600 font-semibold">{row.time}</span>
                            <span className="flex-1 text-brand-navy-500 truncate">{row.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Garmin Integration - Edge 840 */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-32">
              <div>
                <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-950 border border-brand-navy-700 overflow-hidden shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Edge 840 Bike Computer Mockup */}
                    <div className="w-56 h-72 rounded-2xl bg-black border-4 border-gray-800 shadow-2xl flex flex-col overflow-hidden">
                      {/* Screen bezel */}
                      <div className="flex-1 m-2 rounded-lg bg-gradient-to-br from-gray-900 to-black flex flex-col p-3">
                        {/* Top bar */}
                        <div className="flex items-center justify-between text-[8px] text-gray-500 mb-2">
                          <span>12:45</span>
                          <span className="flex items-center gap-1">
                            <span className="w-4 h-2 border border-gray-500 rounded-sm">
                              <span className="block w-3/4 h-full bg-emerald-500 rounded-sm" />
                            </span>
                          </span>
                        </div>
                        {/* Main data */}
                        <div className="flex-1 flex flex-col justify-center space-y-3">
                          <div className="text-center">
                            <div className="text-[9px] text-gray-400 uppercase tracking-wider">Next Checkpoint</div>
                            <div className="text-3xl font-mono font-bold text-brand-sky-400">42.3</div>
                            <div className="text-[10px] text-gray-500">miles to Aid 1</div>
                          </div>
                          <div className="h-px bg-gray-700" />
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div>
                              <div className="text-[8px] text-gray-400 uppercase">ETA</div>
                              <div className="text-lg font-mono font-bold text-white">3:05</div>
                            </div>
                            <div>
                              <div className="text-[8px] text-gray-400 uppercase">Target</div>
                              <div className="text-lg font-mono font-bold text-emerald-400">175w</div>
                            </div>
                          </div>
                          <div className="h-px bg-gray-700" />
                          <div className="text-center">
                            <div className="text-[8px] text-amber-400 uppercase">Nutrition Alert</div>
                            <div className="text-sm text-white">Gel in 12 min</div>
                          </div>
                        </div>
                      </div>
                      {/* Bottom buttons */}
                      <div className="h-4 flex items-center justify-center gap-6 mb-1">
                        <div className="w-6 h-1.5 rounded-full bg-gray-700" />
                        <div className="w-6 h-1.5 rounded-full bg-gray-700" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Monitor className="h-8 w-8 text-brand-sky-400/50" />
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
                  <Monitor className="h-4 w-4" />
                  Garmin Edge Integration
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy-900 mb-4">
                  Your Plan on Your Handlebars
                </h3>
                <p className="text-lg text-brand-navy-600 mb-6">
                  Export your race plan directly to Garmin Edge bike computers. See your next checkpoint,
                  target power, and nutrition reminders right on your screen—no phone needed.
                </p>
                <ul className="space-y-3">
                  {[
                    "Connect IQ data field for Edge 540, 840, 1040+",
                    "Real-time checkpoint countdown and ETA",
                    "Power target display for current terrain",
                    "Nutrition and hydration reminders",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-brand-navy-700">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Crew & Athlete Hub */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
                  <Package className="h-4 w-4" />
                  Crew Logistics & Athlete Hub
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-brand-navy-900 mb-4">
                  Coordinate Your Team, Learn from the Community
                </h3>
                <p className="text-lg text-brand-navy-600 mb-6">
                  Plan drop bag contents and crew meeting points. See what gear other athletes are running
                  for your specific race and conditions.
                </p>
                <ul className="space-y-3">
                  {[
                    "Drop bag contents checklist per location",
                    "Crew meeting points with estimated arrival times",
                    "Race-specific gear trends from the community",
                    "Shareable crew view with driving directions",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-brand-navy-700">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 overflow-hidden shadow-xl">
                  <div className="absolute inset-0 p-5 flex flex-col gap-3">
                    <div className="bg-white rounded-xl shadow-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        <span className="font-semibold text-brand-navy-900 text-sm">Aid 2 - Mile 58</span>
                        <span className="ml-auto text-xs text-brand-sky-600 font-medium">ETA 4:20</span>
                      </div>
                      <div className="space-y-1 text-xs text-brand-navy-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded border-2 border-emerald-400 bg-emerald-100" />
                          Fresh bottles (x2)
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded border-2 border-emerald-400 bg-emerald-100" />
                          Gels (x4)
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-4 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold text-brand-navy-900 text-sm">Trending Gear</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: "Vittoria Terreno Dry 40c", count: "38" },
                          { name: "Enve SES 4.5 AR", count: "24" },
                        ].map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="text-brand-navy-700">{item.name}</span>
                            <span className="text-brand-sky-600 flex items-center gap-1">
                              <Users className="h-3 w-3" /> {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Races */}
        <section id="races" className="py-24 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900">
                Pre-Loaded <span className="text-brand-sky-500">Race Courses</span>
              </h2>
              <p className="mt-4 text-lg text-brand-navy-600">
                Select your race and get instant access to course data, elevation profiles,
                aid station locations, and more. New races added regularly.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRaces.map((race) => {
                const gradient = generateGradient(race.name);
                return (
                  <article
                    key={race.slug}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-brand-navy-100 hover:border-brand-sky-300 transform hover:-translate-y-1 h-80"
                  >
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
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

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

                      {race.race_subtype && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-navy-700 text-xs font-semibold uppercase tracking-wide shadow-md">
                            {race.race_subtype === "cx" ? "Cyclocross" : race.race_subtype}
                          </span>
                        </div>
                      )}
                    </div>

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

            <div className="mt-12 text-center">
              <p className="text-brand-navy-600">
                And many more including Unbound, SBT GRVL, Leadville 100, Big Sugar, Gravel Worlds...
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 sm:py-32 bg-brand-navy-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white">
                Race Ready in <span className="text-brand-sky-400">Minutes</span>
              </h2>
              <p className="mt-4 text-lg text-white/60">
                From signup to start line. Get your personalized race plan before your next event.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Enter Your Numbers",
                  description: "Your FTP, weight, and nutrition preferences. We calculate altitude-adjusted power targets automatically.",
                  icon: Target,
                },
                {
                  step: "02",
                  title: "Select Your Race",
                  description: "Choose from our library of gravel, MTB, and road events with pre-loaded course data and aid stations.",
                  icon: Route,
                },
                {
                  step: "03",
                  title: "Execute Your Plan",
                  description: "Get personalized pacing, nutrition timing, top tube stickers, and sync to your Garmin Edge.",
                  icon: Zap,
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-sky-500/50 to-transparent" />
                  )}
                  <div className="relative bg-brand-navy-800/50 backdrop-blur rounded-2xl p-8 border border-white/10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-sky-500/20 mb-4">
                      <item.icon className="h-6 w-6 text-brand-sky-400" />
                    </div>
                    <div className="text-4xl font-heading font-bold text-brand-sky-400/20 absolute top-6 right-6">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-heading font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-white/60">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder Story */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Image */}
              <div className="relative">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-brand-navy-900/20">
                  <Image
                    src="/images/founder-leadville.png"
                    alt="Chris Winterhack racing at the Leadville 100 MTB"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-navy-900/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-heading font-semibold">Chris Winterhack</p>
                    <p className="text-white/80 text-sm">Founder & CEO • Leadville 100 MTB, 2025</p>
                  </div>
                </div>
                {/* Decorative */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-sky-400/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand-navy-400/10 rounded-full blur-2xl" />
              </div>

              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-sky-100 text-brand-sky-700 text-sm font-medium mb-6">
                  <Mountain className="h-4 w-4" />
                  Why FinalClimb
                </div>

                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900 mb-6">
                  Built from the{" "}
                  <span className="text-brand-sky-500">Leadville 100</span>
                </h2>

                <div className="space-y-4 text-brand-navy-600 leading-relaxed">
                  <p>
                    In 2025, I lined up at the Leadville 100 MTB with a year of training behind me.
                    Amazing coach. World-class software. The fitness was there.
                  </p>
                  <p>
                    Then my coach handed me my race plan. Power targets, checkpoint splits,
                    nutrition schedule. It was exactly what I needed. But I had no way to follow it on the bike.
                  </p>
                  <p>
                    I ended up creating Google Docs for nutrition, spreadsheets for logistics, and
                    scouring Facebook groups for gear advice. Everything I needed existed, but it was
                    spread across a dozen different places.
                  </p>
                  <p className="font-medium text-brand-navy-900">
                    FinalClimb is the tool I wished I&apos;d had. Everything for race day execution, in one place.
                  </p>
                </div>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 mt-8 text-brand-sky-600 hover:text-brand-sky-700 font-semibold transition-colors"
                >
                  Read the full story
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 sm:py-32 bg-brand-navy-950 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-sky-500/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white">
              Be First to Race with FinalClimb
            </h2>
            <p className="mt-6 text-xl text-white/60 max-w-2xl mx-auto">
              Join the waitlist for early access. We&apos;re launching soon with support
              for major gravel and ultra-endurance events.
            </p>

            <div className="mt-10 max-w-md mx-auto">
              <WaitlistForm variant="footer" source="homepage-footer" />
            </div>

            <p className="mt-8 text-white/40 text-sm">
              Already have early access?{" "}
              <Link href="/login" className="text-brand-sky-400 hover:text-brand-sky-300 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-navy-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-brand-sky-400" />
              <span className="text-lg font-heading font-bold text-white">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/50">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#races" className="hover:text-white transition-colors">Races</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <Link href="/about" className="hover:text-white transition-colors">Our Story</Link>
              <Link href="/login" className="hover:text-white transition-colors">Early Access</Link>
            </nav>
            <p className="text-sm text-white/30">© {new Date().getFullYear()} FinalClimb</p>
          </div>
        </div>
      </footer>
    </>
  );
}
