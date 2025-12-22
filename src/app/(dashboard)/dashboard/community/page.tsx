"use client";

import { Users, MessageSquare, Trophy, TrendingUp, Bike, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { cn } from "@/lib/utils";

const upcomingFeatures = [
  {
    icon: MessageSquare,
    title: "Race Forums",
    description: "Discuss strategies, conditions, and tips with athletes who've done each race.",
    gradient: "from-blue-600 via-indigo-500 to-purple-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Users,
    title: "Gear Sharing",
    description: "See what bikes, tires, and setups other athletes are running for each race.",
    gradient: "from-emerald-600 via-green-500 to-teal-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Track performance benchmarks and compare stats across races.",
    gradient: "from-amber-600 via-orange-500 to-yellow-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: TrendingUp,
    title: "Race Reports",
    description: "Read and share race reports with tips, photos, and course insights.",
    gradient: "from-rose-600 via-pink-500 to-purple-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
];

export default function CommunityPage() {
  return (
    <div className="space-y-8">
      {/* Header with visual flair */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 p-6 sm:p-8">
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='24' viewBox='0 0 88 24'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M10 0l-5.5 9h11L10 0zm0 5.07L12.81 9H7.19L10 5.07zM0 18l5.5-9h-11L0 18zm0-5.07L-2.81 9h5.62L0 12.93zM20 6l-5.5 9h11L20 6zm0 5.07L22.81 15H17.19L20 11.07zM30 0l-5.5 9h11L30 0zm0 5.07L32.81 9H27.19L30 5.07z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative shapes */}
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                Community
              </h1>
              <p className="text-white/90">
                Connect with fellow athletes and share knowledge
              </p>
            </div>
          </div>

          {/* Stats preview */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold text-white font-mono">—</p>
              <p className="text-xs text-white/80">Athletes</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold text-white font-mono">—</p>
              <p className="text-xs text-white/80">Discussions</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm text-center">
              <p className="text-2xl font-bold text-white font-mono">—</p>
              <p className="text-xs text-white/80">Gear Shares</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features Grid */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-brand-navy-900 mb-4">
          Coming Soon
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcomingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border border-brand-navy-200 bg-white hover:border-brand-sky-300 hover:shadow-md transition-all duration-200"
              >
                {/* Gradient header */}
                <div className={cn("h-2 bg-gradient-to-r", feature.gradient)} />

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2.5 rounded-xl", feature.iconBg)}>
                      <Icon className={cn("h-6 w-6", feature.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm text-brand-navy-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Coming soon badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-sky-50 text-brand-sky-600 text-xs font-medium">
                      <Star className="h-3 w-3" />
                      Coming soon
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Empty State */}
      <IllustratedEmptyState
        icon={Users}
        title="Community features launching soon"
        description="We're building race-specific forums, gear sharing features, and more. Create a race plan to be first in line when these features go live!"
        variant="community"
      />

      {/* Quick links / CTA area */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-brand-navy-200 hover:border-brand-sky-300 hover:shadow-md transition-all group cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
              <Bike className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors">
                Browse Races
              </h3>
              <p className="text-sm text-brand-navy-600">
                Find your next adventure and join other athletes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-navy-200 hover:border-brand-sky-300 hover:shadow-md transition-all group cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-navy-900 group-hover:text-brand-sky-600 transition-colors">
                Complete Your Profile
              </h3>
              <p className="text-sm text-brand-navy-600">
                Add your FTP and weight to unlock personalized plans
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
