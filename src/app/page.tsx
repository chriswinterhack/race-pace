import Link from "next/link";
import { Mountain } from "lucide-react";

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Mountain className="h-10 w-10 sm:h-12 sm:w-12 text-brand-sky-400" />
          </div>
          <h1 className="text-4xl font-heading font-bold tracking-tight text-brand-navy-900 sm:text-5xl md:text-6xl">
            Final
            <span className="text-brand-sky-400">Climb</span>
          </h1>
          <p className="mt-6 text-lg text-brand-navy-600 leading-relaxed">
            Build personalized race execution plans with pacing, nutrition, gear
            management, and checkpoint strategies for gravel, road, MTB, and
            cyclocross racing.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-brand-sky-400 rounded-md shadow-subtle hover:bg-brand-sky-500 focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:ring-offset-2 transition-colors min-h-[44px]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-brand-navy-900 bg-white border border-brand-navy-200 rounded-md shadow-subtle hover:bg-brand-navy-50 focus:outline-none focus:ring-2 focus:ring-brand-sky-400 focus:ring-offset-2 transition-colors min-h-[44px]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
