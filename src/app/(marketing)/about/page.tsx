import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mountain, ArrowRight, Target, ListChecks, Users, Bike } from "lucide-react";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Our Story | FinalClimb",
  description: "FinalClimb was born at the Leadville 100 MTB. Learn why founder Chris Winterhack built the race execution platform he wished existed.",
  openGraph: {
    title: "Our Story | FinalClimb",
    description: "FinalClimb was born at the Leadville 100 MTB. Learn why founder Chris Winterhack built the race execution platform he wished existed.",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-brand-navy-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Mountain className="h-7 w-7 text-brand-sky-500 transition-transform group-hover:scale-110" />
            <span className="text-xl font-heading font-bold text-brand-navy-900">
              Final<span className="text-brand-sky-500">Climb</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-navy-600 hover:text-brand-navy-900 transition-colors"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-brand-sky-500 hover:bg-brand-sky-600 text-white rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-50 via-white to-brand-sky-50" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-sky-100 text-brand-sky-700 text-sm font-medium mb-6">
                <Mountain className="h-4 w-4" />
                Our Story
              </div>

              <h1 className="text-4xl lg:text-5xl font-heading font-bold text-brand-navy-900 leading-tight mb-6">
                Built by an athlete,{" "}
                <span className="text-brand-sky-500">for athletes</span>
              </h1>

              <p className="text-lg text-brand-navy-600 leading-relaxed">
                FinalClimb was born from a simple realization: the best training in the world
                means nothing if you can&apos;t execute on race day.
              </p>
            </div>

            {/* Founder Image */}
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-brand-navy-900/20">
                <Image
                  src="/images/founder-leadville.png"
                  alt="Chris Winterhack racing at the Leadville 100 MTB with Colorado mountains in the background"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-navy-900/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-heading font-semibold">Chris Winterhack</p>
                  <p className="text-white/80 text-sm">Founder & CEO • Leadville 100 MTB, 2025</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-sky-400/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand-navy-400/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-lg prose-navy max-w-none">
            <h2 className="text-3xl font-heading font-bold text-brand-navy-900 mb-8">
              The gap between training and race day
            </h2>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              In 2025, I lined up at the start of the Leadville 100 MTB. 104 miles. 12,600 feet of climbing.
              Starting at 10,200 feet elevation. I&apos;d spent a year preparing for this moment.
            </p>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              I had an amazing coach. World-class training software in TrainerRoad and
              TrainingPeaks. My fitness was dialed. The hay was in the barn, as they say.
            </p>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              Then my coach handed me my race plan. Power targets, pacing strategies,
              checkpoint splits, nutrition schedule. It was exactly what I needed. But
              there was a problem:
            </p>

            <blockquote className="border-l-4 border-brand-sky-500 pl-6 my-8 italic text-brand-navy-700">
              &ldquo;How am I supposed to actually follow this while I&apos;m on the bike?&rdquo;
            </blockquote>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              I ended up creating Google Docs for my nutrition plan. Spreadsheets for
              checkpoint logistics. Packing lists in random notes apps. I spent hours
              on the Leadville Facebook group looking for advice on tire choice, shoe
              recommendations, and what to pack in my drop bags.
            </p>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              Everything I needed existed somewhere, but it was spread across a dozen
              different tools, documents, and social media posts. The industry had solved
              training. It had solved data analysis. But nobody had solved race day execution.
            </p>

            <h2 className="text-3xl font-heading font-bold text-brand-navy-900 mt-12 mb-8">
              Building what I wished existed
            </h2>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              I finished that Leadville 100. Successfully, with a buckle. But the experience
              stuck with me. So I started building the tool I wished I&apos;d had. Something that
              pulls all those pieces together in one place.
            </p>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              FinalClimb is the result. Power targets, pacing strategy, nutrition plan,
              checkpoint logistics, gear decisions, crew coordination. All in one place,
              ready when you need it.
            </p>

            <p className="text-brand-navy-600 leading-relaxed mb-6">
              The name comes from that moment in every endurance race when you&apos;re
              hurting and the finish line finally comes into view. That final climb.
              The training got you there. Now it&apos;s about execution.
            </p>

            <p className="text-brand-navy-700 font-medium leading-relaxed">
              That&apos;s what FinalClimb is for.
            </p>

            <div className="mt-12 pt-8 border-t border-brand-navy-100">
              <p className="text-brand-navy-600 mb-2">
                - Chris Winterhack
              </p>
              <p className="text-brand-navy-400 text-sm">
                Founder & CEO, FinalClimb
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We're Building */}
      <section className="py-20 lg:py-28 bg-brand-navy-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-brand-navy-900 mb-4">
              What we&apos;re building
            </h2>
            <p className="text-lg text-brand-navy-600 max-w-2xl mx-auto">
              FinalClimb brings together everything you need for race day execution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: "Pacing & Power",
                description: "Personalized targets based on your FTP, the course profile, and conditions"
              },
              {
                icon: ListChecks,
                title: "Nutrition Planning",
                description: "Hour-by-hour fueling schedules with top tube stickers you can actually follow"
              },
              {
                icon: Bike,
                title: "Gear Decisions",
                description: "See what other athletes are running and make informed equipment choices"
              },
              {
                icon: Users,
                title: "Crew Coordination",
                description: "Drop bag planning and crew logistics so your support team knows the plan"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-brand-navy-100"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-sky-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-brand-sky-600" />
                </div>
                <h3 className="font-heading font-semibold text-brand-navy-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-brand-navy-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-brand-navy-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
            Ready for your final climb?
          </h2>
          <p className="text-lg text-brand-navy-300 mb-8">
            Join athletes who are taking race day execution seriously.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-brand-sky-500 hover:bg-brand-sky-400 text-white rounded-xl px-8 h-12 text-base font-semibold shadow-lg shadow-brand-sky-500/25"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy-950 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-brand-sky-400" />
              <span className="text-lg font-heading font-bold text-white">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>
            <p className="text-brand-navy-400 text-sm">
              &copy; {new Date().getFullYear()} FinalClimb. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
