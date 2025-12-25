"use client";

import Link from "next/link";
import { Plus, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

interface EmptyStateHeroProps {
  onAddRaceClick: () => void;
}

export function EmptyStateHero({ onAddRaceClick }: EmptyStateHeroProps) {
  return (
    <div className="relative -mt-6 lg:-mt-8 ml-[calc(-50vw+50%)] mr-[calc(-50vw+50%)] w-screen overflow-hidden">
      <div className="relative bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-navy-900 py-16 px-6">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-sky-600/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sky-500/10 border border-brand-sky-500/20 text-brand-sky-400 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Race Planning Made Easy
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 tracking-tight">
            Find Your Next
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-sky-400 to-brand-sky-300">
              Adventure
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-navy-300 mb-8 max-w-2xl mx-auto">
            Choose from premier gravel and mountain bike events. Get personalized
            pacing, nutrition plans, and race-day strategies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onAddRaceClick}
              size="lg"
              className="gap-2 bg-brand-sky-500 hover:bg-brand-sky-600 text-white font-semibold px-8 h-14 text-lg shadow-xl shadow-brand-sky-500/25"
            >
              <Plus className="h-5 w-5" />
              Add a Race
            </Button>
            <Link href="/dashboard/races">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-brand-navy-600 text-white hover:bg-brand-navy-800 px-8 h-14 text-lg"
              >
                Browse All Races
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
