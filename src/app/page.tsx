import type { Metadata } from "next";
import Link from "next/link";
import {
  Mountain,
  Zap,
  Clock,
  Utensils,
  Map,
  Users,
  ChevronRight,
  Star,
  Shield,
  Bike,
  Check,
} from "lucide-react";

// Enhanced SEO metadata for landing page
export const metadata: Metadata = {
  title: "FinalClimb - Race Day Execution Plans for Endurance Athletes",
  description:
    "Build personalized race execution plans with power targets, pacing strategy, nutrition timing, and checkpoint goals. Used by gravel racers, mountain bikers, and ultra-endurance cyclists worldwide.",
  keywords: [
    "race planning software",
    "gravel race pacing",
    "cycling power targets",
    "endurance race nutrition",
    "MTB race strategy",
    "Unbound Gravel",
    "Mid South",
    "SBT GRVL",
    "Leadville 100",
    "cycling coach software",
    "FTP pacing calculator",
    "race day nutrition plan",
  ],
  openGraph: {
    title: "FinalClimb - Race Day Execution Plans for Endurance Athletes",
    description:
      "Stop guessing on race day. Build data-driven execution plans with power targets, nutrition timing, and checkpoint strategies.",
    type: "website",
    url: "https://finalclimb.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FinalClimb - Race Planning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinalClimb - Race Day Execution Plans",
    description:
      "Build data-driven race plans with power targets, nutrition timing, and checkpoint strategies.",
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
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "20",
        priceCurrency: "USD",
        priceValidUntil: "2025-12-31",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "127",
      },
    },
  ],
};

const features = [
  {
    icon: Zap,
    title: "Power-Based Pacing",
    description:
      "Altitude-adjusted power targets for every segment. Know exactly what watts to hold on climbs vs flats.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Clock,
    title: "Checkpoint Timing",
    description:
      "Hit your splits with precision. See projected arrival times at every aid station and landmark.",
    color: "text-brand-sky-500",
    bg: "bg-brand-sky-500/10",
  },
  {
    icon: Utensils,
    title: "Nutrition Strategy",
    description:
      "Carbs, hydration, and sodium targets by the hour. Never bonk or cramp again.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Map,
    title: "Course Intelligence",
    description:
      "Elevation profiles, surface breakdowns, and key sections flagged so you know what's coming.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Bike,
    title: "Gear Management",
    description:
      "Track your race setup. See what the community is running for tire choice, gearing, and more.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Users,
    title: "Coach Integration",
    description:
      "Coaches can build and lock plans for athletes. Perfect power targets, every time.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
];

const stats = [
  { value: "2,500+", label: "Race Plans Created" },
  { value: "150+", label: "Supported Races" },
  { value: "98%", label: "Finish Rate" },
  { value: "4.9/5", label: "Athlete Rating" },
];

const testimonials = [
  {
    quote:
      "Finally finished Unbound under my goal time. The pacing strategy kept me from going out too hot in the first 50 miles.",
    author: "Sarah K.",
    role: "Unbound 200 Finisher",
    avatar: "SK",
  },
  {
    quote:
      "As a coach, I can dial in power targets for each athlete and know they'll execute. Game changer for race week.",
    author: "Marcus T.",
    role: "Endurance Coach",
    avatar: "MT",
  },
  {
    quote:
      "The nutrition timing alone is worth it. No more guessing when to eat - it's all laid out mile by mile.",
    author: "Jake R.",
    role: "Leadville 100 Finisher",
    avatar: "JR",
  },
];

const races = [
  "Unbound Gravel",
  "Mid South",
  "SBT GRVL",
  "Leadville 100",
  "Belgian Waffle Ride",
  "Dirty Kanza",
  "Gravel Worlds",
  "Big Sugar",
];

export default function HomePage() {
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
                Start Free
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

            {/* Topographic Pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 30, 50 50 T 100 50' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 60 Q 25 40, 50 60 T 100 60' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q 25 50, 50 70 T 100 70' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
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
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm text-white/80">
                2025 Race Season Ready
              </span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white tracking-tight leading-[1.1]"
            >
              Stop Guessing.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sky-400 via-brand-sky-300 to-emerald-400">
                Start Executing.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Data-driven race execution plans with power targets, nutrition
              timing, and checkpoint strategies. Built for gravel racers,
              mountain bikers, and ultra-endurance athletes.
            </p>

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
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                <span>4.9/5 from 127 athletes</span>
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

        {/* Stats Bar */}
        <section className="relative bg-brand-navy-900 border-y border-white/5 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-heading font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-white/50">{stat.label}</div>
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
                <span className="text-brand-sky-500"> Execute Perfectly</span>
              </h2>
              <p className="mt-4 text-lg text-brand-navy-600">
                Race day is too important for guesswork. Get the tools
                professional athletes and coaches use.
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

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-24 sm:py-32 bg-brand-navy-50"
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
                From signup to start line in minutes, not hours.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "Enter Your Numbers",
                  description:
                    "FTP, weight, and nutrition preferences. We handle the altitude adjustments automatically.",
                },
                {
                  step: "02",
                  title: "Select Your Race",
                  description:
                    "Choose from 150+ supported races with pre-loaded courses, aid stations, and elevation data.",
                },
                {
                  step: "03",
                  title: "Get Your Plan",
                  description:
                    "Receive personalized power targets, checkpoint times, and nutrition schedule. Export or print.",
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-sky-300 to-transparent" />
                  )}

                  <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-brand-navy-100">
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

        {/* Testimonials Section */}
        <section
          className="py-24 sm:py-32 bg-brand-navy-900"
          aria-labelledby="testimonials-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2
                id="testimonials-heading"
                className="text-3xl sm:text-4xl font-heading font-bold text-white"
              >
                Trusted by <span className="text-brand-sky-400">Finishers</span>
              </h2>
              <p className="mt-4 text-lg text-white/60">
                Athletes who execute their race plans, not abandon them.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.author}
                  className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  <p className="text-white/80 leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  <footer className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-sky-400 to-brand-sky-600 flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <cite className="not-italic font-medium text-white">
                        {testimonial.author}
                      </cite>
                      <p className="text-sm text-white/50">{testimonial.role}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Races */}
        <section className="py-16 bg-white border-y border-brand-navy-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-brand-navy-500 mb-8">
              PRE-LOADED COURSES FOR 150+ RACES INCLUDING
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {races.map((race) => (
                <span
                  key={race}
                  className="text-brand-navy-400 font-medium text-sm sm:text-base"
                >
                  {race}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-24 sm:py-32 bg-brand-navy-50"
          aria-labelledby="pricing-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2
              id="pricing-heading"
              className="text-3xl sm:text-4xl font-heading font-bold text-brand-navy-900"
            >
              Simple, <span className="text-brand-sky-500">Athlete-First</span>{" "}
              Pricing
            </h2>
            <p className="mt-4 text-lg text-brand-navy-600 max-w-2xl mx-auto">
              One plan. All features. No upsells. Build unlimited race plans for
              less than a gel pack per month.
            </p>

            {/* Pricing Card */}
            <div className="mt-12 bg-white rounded-3xl shadow-xl border border-brand-navy-100 p-8 sm:p-12 max-w-lg mx-auto">
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
                  "All 150+ supported races",
                  "Power & nutrition calculations",
                  "Exportable race sheets",
                  "Gear tracking & community data",
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
                Start Your Free Trial
                <ChevronRight className="h-4 w-4" />
              </Link>

              <p className="mt-4 text-sm text-brand-navy-500">
                14-day free trial. No credit card required.
              </p>
            </div>

            {/* Coach Pricing Teaser */}
            <p className="mt-12 text-brand-navy-600">
              <span className="font-semibold">Coaches:</span> Manage your
              athletes&apos; race plans.{" "}
              <Link
                href="/signup"
                className="text-brand-sky-600 hover:text-brand-sky-700 font-medium"
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
              Join thousands of athletes who show up to race day with a clear
              execution strategy.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-brand-navy-900 bg-brand-sky-400 rounded-xl hover:bg-brand-sky-300 transition-all duration-200 shadow-lg shadow-brand-sky-500/25"
              >
                Build Your Race Plan Free
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
