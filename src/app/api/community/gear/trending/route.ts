import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for aggregated gear stats
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GearItem {
  brand: string;
  model: string;
  count: number;
  percentage: number;
}

export async function GET() {
  try {
    // Get total public gear selections for percentage calculation
    const { count: totalCount } = await supabaseAdmin
      .from("race_gear_selections")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true);

    const total = totalCount || 1;

    // Fetch gear aggregations in parallel
    const [bikesResult, tiresResult, shoesResult, hydrationResult] = await Promise.all([
      // Top bikes
      supabaseAdmin
        .from("race_gear_selections")
        .select(`
          bike:user_bikes!inner (
            brand,
            model
          )
        `)
        .eq("is_public", true)
        .not("bike_id", "is", null),

      // Top tires (front + rear combined)
      supabaseAdmin
        .from("race_gear_selections")
        .select(`
          front_tire:user_tires!race_gear_selections_front_tire_id_fkey (
            brand,
            model
          ),
          rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (
            brand,
            model
          )
        `)
        .eq("is_public", true),

      // Top shoes
      supabaseAdmin
        .from("race_gear_selections")
        .select(`
          shoe:user_shoes!inner (
            brand,
            model
          )
        `)
        .eq("is_public", true)
        .not("shoe_id", "is", null),

      // Top hydration packs
      supabaseAdmin
        .from("race_gear_selections")
        .select(`
          hydration_pack:user_hydration_packs!inner (
            brand,
            model
          )
        `)
        .eq("is_public", true)
        .not("hydration_pack_id", "is", null),
    ]);

    // Aggregate bikes
    const bikeMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bikesResult.data?.forEach((item: any) => {
      if (item.bike?.brand && item.bike?.model) {
        const key = `${item.bike.brand}|${item.bike.model}`;
        bikeMap.set(key, (bikeMap.get(key) || 0) + 1);
      }
    });

    // Aggregate tires (combine front and rear)
    const tireMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tiresResult.data?.forEach((item: any) => {
      if (item.front_tire?.brand && item.front_tire?.model) {
        const key = `${item.front_tire.brand}|${item.front_tire.model}`;
        tireMap.set(key, (tireMap.get(key) || 0) + 1);
      }
      if (item.rear_tire?.brand && item.rear_tire?.model) {
        const key = `${item.rear_tire.brand}|${item.rear_tire.model}`;
        tireMap.set(key, (tireMap.get(key) || 0) + 1);
      }
    });

    // Aggregate shoes
    const shoeMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shoesResult.data?.forEach((item: any) => {
      if (item.shoe?.brand && item.shoe?.model) {
        const key = `${item.shoe.brand}|${item.shoe.model}`;
        shoeMap.set(key, (shoeMap.get(key) || 0) + 1);
      }
    });

    // Aggregate hydration packs
    const hydrationMap = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hydrationResult.data?.forEach((item: any) => {
      if (item.hydration_pack?.brand && item.hydration_pack?.model) {
        const key = `${item.hydration_pack.brand}|${item.hydration_pack.model}`;
        hydrationMap.set(key, (hydrationMap.get(key) || 0) + 1);
      }
    });

    // Convert maps to sorted arrays
    const mapToSortedArray = (map: Map<string, number>): GearItem[] => {
      return Array.from(map.entries())
        .map(([key, count]) => {
          const parts = key.split("|");
          return {
            brand: parts[0] || "Unknown",
            model: parts[1] || "Unknown",
            count,
            percentage: Math.round((count / total) * 100),
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };

    return NextResponse.json({
      bikes: mapToSortedArray(bikeMap),
      tires: mapToSortedArray(tireMap),
      shoes: mapToSortedArray(shoeMap),
      hydration_packs: mapToSortedArray(hydrationMap),
      total_selections: total,
    });
  } catch (error) {
    console.error("Error fetching trending gear:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending gear" },
      { status: 500 }
    );
  }
}
