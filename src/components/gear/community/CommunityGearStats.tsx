"use client";

import { useState, useEffect } from "react";
import { Bike, Circle, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, Skeleton } from "@/components/ui";
import type { RaceGearStats, GearAggregation } from "@/types/gear";

interface CommunityGearStatsProps {
  raceId: string;
}

export function CommunityGearStats({ raceId }: CommunityGearStatsProps) {
  const [stats, setStats] = useState<RaceGearStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [raceId]);

  async function fetchStats() {
    setLoading(true);
    try {
      const response = await fetch(`/api/gear/community/${raceId}`);
      const result = await response.json();
      if (result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch community gear stats:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_participants === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-brand-sky-500" />
            <h3 className="text-lg font-semibold text-brand-navy-900">
              Community Gear Choices
            </h3>
          </div>
          <div className="text-center py-8 text-brand-navy-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No gear data available yet.</p>
            <p className="text-sm mt-1">Be the first to share your setup!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-sky-500" />
            <h3 className="text-lg font-semibold text-brand-navy-900">
              Community Gear Choices
            </h3>
          </div>
          <span className="text-sm text-brand-navy-500 flex items-center gap-1">
            <Users className="h-4 w-4" />
            {stats.total_participants} {stats.total_participants === 1 ? "rider" : "riders"}
          </span>
        </div>

        <div className="space-y-6">
          {/* Bikes Section */}
          {stats.bikes.length > 0 && (
            <GearCategory
              title="Bikes"
              icon={<Bike className="h-5 w-5" />}
              items={stats.bikes}
              colorClass="bg-brand-sky-500"
            />
          )}

          {/* Tires Section - Combined front and rear for cleaner display */}
          {(stats.front_tires.length > 0 || stats.rear_tires.length > 0) && (
            <GearCategory
              title="Tires"
              icon={<Circle className="h-5 w-5" />}
              items={combineTires(stats.front_tires, stats.rear_tires)}
              colorClass="bg-amber-500"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface GearCategoryProps {
  title: string;
  icon: React.ReactNode;
  items: GearAggregation[];
  colorClass: string;
}

function GearCategory({ title, icon, items, colorClass }: GearCategoryProps) {
  // Show top 5 items
  const topItems = items.slice(0, 5);
  const maxPercentage = Math.max(...topItems.map((item) => item.percentage), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-brand-navy-700">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="space-y-2">
        {topItems.map((item, index) => (
          <GearBar
            key={`${item.brand}-${item.model}-${index}`}
            item={item}
            maxPercentage={maxPercentage}
            colorClass={colorClass}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

interface GearBarProps {
  item: GearAggregation;
  maxPercentage: number;
  colorClass: string;
  rank: number;
}

function GearBar({ item, maxPercentage, colorClass, rank }: GearBarProps) {
  const barWidth = (item.percentage / maxPercentage) * 100;

  return (
    <div className="relative">
      {/* Background bar */}
      <div className="h-10 bg-brand-navy-100 rounded-lg overflow-hidden">
        {/* Filled bar */}
        <div
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${barWidth}%`, opacity: 1 - rank * 0.12 }}
        />
      </div>
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-between px-3">
        <span className="font-medium text-sm text-brand-navy-900 truncate max-w-[60%]">
          {item.brand} {item.model}
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand-navy-600">
            {item.count} {item.count === 1 ? "rider" : "riders"}
          </span>
          <span className="font-semibold text-brand-navy-900 bg-white/80 px-2 py-0.5 rounded">
            {item.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to combine and dedupe front and rear tire data
function combineTires(
  frontTires: GearAggregation[],
  rearTires: GearAggregation[]
): GearAggregation[] {
  const combined = new Map<string, GearAggregation>();

  [...frontTires, ...rearTires].forEach((tire) => {
    const key = `${tire.brand}|${tire.model}`;
    const existing = combined.get(key);
    if (existing) {
      // Average the counts and percentages (since same tire might be front and rear)
      existing.count = Math.max(existing.count, tire.count);
      existing.percentage = Math.max(existing.percentage, tire.percentage);
    } else {
      combined.set(key, { ...tire });
    }
  });

  return Array.from(combined.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
