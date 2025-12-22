import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GearAggregation, RaceGearStats } from "@/types/gear";

// GET /api/gear/community/[raceId] - Get aggregated gear stats for a race
// Includes ALL selections (public + private) for aggregate stats
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const { raceId } = await params;
  const supabase = await createClient();

  // Get total participant count
  const { count: totalParticipants } = await supabase
    .from("race_gear_selections")
    .select("*", { count: "exact", head: true })
    .eq("race_id", raceId);

  if (!totalParticipants || totalParticipants === 0) {
    return NextResponse.json({
      data: {
        total_participants: 0,
        bikes: [],
        front_tires: [],
        rear_tires: [],
        shoes: [],
        hydration_packs: [],
      } as RaceGearStats,
      error: null,
    });
  }

  // Aggregate bikes
  const { data: bikeData } = await supabase
    .from("race_gear_selections")
    .select("bike:user_bikes(brand, model)")
    .eq("race_id", raceId)
    .not("bike_id", "is", null);

  const bikeCounts = new Map<string, { brand: string; model: string; count: number }>();
  (bikeData || []).forEach((row) => {
    const bike = row.bike as unknown as { brand: string; model: string } | null;
    if (bike) {
      const key = `${bike.brand}|${bike.model}`;
      const existing = bikeCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        bikeCounts.set(key, { brand: bike.brand, model: bike.model, count: 1 });
      }
    }
  });

  const bikes: GearAggregation[] = Array.from(bikeCounts.values())
    .map((b) => ({
      item_type: "bike" as const,
      brand: b.brand,
      model: b.model,
      count: b.count,
      percentage: Math.round((b.count / totalParticipants) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate front tires (include width to differentiate sizes)
  const { data: frontTireData } = await supabase
    .from("race_gear_selections")
    .select("tire:user_tires!race_gear_selections_front_tire_id_fkey(brand, model, width_value, width_unit)")
    .eq("race_id", raceId)
    .not("front_tire_id", "is", null);

  const frontTireCounts = new Map<string, { brand: string; model: string; width?: string; count: number }>();
  (frontTireData || []).forEach((row) => {
    const tire = row.tire as unknown as { brand: string; model: string; width_value: number | null; width_unit: string | null } | null;
    if (tire) {
      const width = tire.width_value ? `${tire.width_value}${tire.width_unit === "in" ? '"' : 'mm'}` : undefined;
      const key = `${tire.brand}|${tire.model}|${width || ''}`;
      const existing = frontTireCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        frontTireCounts.set(key, { brand: tire.brand, model: tire.model, width, count: 1 });
      }
    }
  });

  const front_tires: GearAggregation[] = Array.from(frontTireCounts.values())
    .map((t) => ({
      item_type: "tire" as const,
      brand: t.brand,
      model: t.model,
      width: t.width,
      count: t.count,
      percentage: Math.round((t.count / totalParticipants) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate rear tires (include width to differentiate sizes)
  const { data: rearTireData } = await supabase
    .from("race_gear_selections")
    .select("tire:user_tires!race_gear_selections_rear_tire_id_fkey(brand, model, width_value, width_unit)")
    .eq("race_id", raceId)
    .not("rear_tire_id", "is", null);

  const rearTireCounts = new Map<string, { brand: string; model: string; width?: string; count: number }>();
  (rearTireData || []).forEach((row) => {
    const tire = row.tire as unknown as { brand: string; model: string; width_value: number | null; width_unit: string | null } | null;
    if (tire) {
      const width = tire.width_value ? `${tire.width_value}${tire.width_unit === "in" ? '"' : 'mm'}` : undefined;
      const key = `${tire.brand}|${tire.model}|${width || ''}`;
      const existing = rearTireCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        rearTireCounts.set(key, { brand: tire.brand, model: tire.model, width, count: 1 });
      }
    }
  });

  const rear_tires: GearAggregation[] = Array.from(rearTireCounts.values())
    .map((t) => ({
      item_type: "tire" as const,
      brand: t.brand,
      model: t.model,
      width: t.width,
      count: t.count,
      percentage: Math.round((t.count / totalParticipants) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate shoes
  const { data: shoeData } = await supabase
    .from("race_gear_selections")
    .select("shoe:user_shoes(brand, model)")
    .eq("race_id", raceId)
    .not("shoe_id", "is", null);

  const shoeCounts = new Map<string, { brand: string; model: string; count: number }>();
  (shoeData || []).forEach((row) => {
    const shoe = row.shoe as unknown as { brand: string; model: string } | null;
    if (shoe) {
      const key = `${shoe.brand}|${shoe.model}`;
      const existing = shoeCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        shoeCounts.set(key, { brand: shoe.brand, model: shoe.model, count: 1 });
      }
    }
  });

  const shoes: GearAggregation[] = Array.from(shoeCounts.values())
    .map((s) => ({
      item_type: "shoe" as const,
      brand: s.brand,
      model: s.model,
      count: s.count,
      percentage: Math.round((s.count / totalParticipants) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate hydration packs
  const { data: hydrationData } = await supabase
    .from("race_gear_selections")
    .select("hydration_pack:user_hydration_packs(brand, model)")
    .eq("race_id", raceId)
    .not("hydration_pack_id", "is", null);

  const hydrationCounts = new Map<string, { brand: string; model: string; count: number }>();
  (hydrationData || []).forEach((row) => {
    const pack = row.hydration_pack as unknown as { brand: string; model: string } | null;
    if (pack) {
      const key = `${pack.brand}|${pack.model}`;
      const existing = hydrationCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        hydrationCounts.set(key, { brand: pack.brand, model: pack.model, count: 1 });
      }
    }
  });

  const hydration_packs: GearAggregation[] = Array.from(hydrationCounts.values())
    .map((h) => ({
      item_type: "hydration_pack" as const,
      brand: h.brand,
      model: h.model,
      count: h.count,
      percentage: Math.round((h.count / totalParticipants) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    data: {
      total_participants: totalParticipants,
      bikes,
      front_tires,
      rear_tires,
      shoes,
      hydration_packs,
    } as RaceGearStats,
    error: null,
  });
}
