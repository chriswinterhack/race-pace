import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to fetch public gear selections
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GearSetupSummary {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  race: {
    id: string;
    name: string;
    slug: string;
    type: string;
    year: number;
    distance: {
      name: string | null;
      miles: number;
    };
  };
  gear: {
    bike: { brand: string; model: string; year?: number } | null;
    frontTire: { brand: string; model: string; width?: string } | null;
    rearTire: { brand: string; model: string; width?: string } | null;
    shoes: { brand: string; model: string } | null;
    repairKit: { name: string; itemCount: number } | null;
    hydrationPack: { brand: string; model: string } | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const search = searchParams.get("search") || "";
    const raceType = searchParams.get("raceType") || "all";
    const distanceMin = searchParams.get("distanceMin")
      ? parseFloat(searchParams.get("distanceMin")!)
      : null;
    const distanceMax = searchParams.get("distanceMax")
      ? parseFloat(searchParams.get("distanceMax")!)
      : null;
    const raceId = searchParams.get("raceId") || null;
    const sortBy = searchParams.get("sortBy") || "newest";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build the query
    let query = supabaseAdmin
      .from("race_gear_selections")
      .select(`
        id,
        created_at,
        notes,
        user:users!race_gear_selections_user_id_fkey (
          id,
          name,
          avatar_url
        ),
        race_distance:race_distances!inner (
          id,
          name,
          distance_miles,
          race_edition:race_editions!inner (
            year,
            race:races!inner (
              id,
              name,
              slug,
              race_subtype
            )
          )
        ),
        bike:user_bikes (
          brand,
          model,
          year
        ),
        front_tire:user_tires!race_gear_selections_front_tire_id_fkey (
          brand,
          model,
          width_value,
          width_unit
        ),
        rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (
          brand,
          model,
          width_value,
          width_unit
        ),
        shoe:user_shoes (
          brand,
          model
        ),
        hydration_pack:user_hydration_packs (
          brand,
          model
        ),
        repair_kit:user_repair_kits (
          name,
          items
        )
      `, { count: "exact" })
      .eq("is_public", true);

    // Apply filters
    if (raceType && raceType !== "all") {
      query = query.eq("race_distance.race_edition.race.race_subtype", raceType);
    }

    if (raceId) {
      query = query.eq("race_distance.race_edition.race.id", raceId);
    }

    // Apply sorting
    if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      // Default: newest first
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: selections, error, count } = await query;

    if (error) {
      console.error("Error fetching gear selections:", error);
      throw error;
    }

    // Post-process: filter by distance and search (Supabase nested filtering is limited)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filteredSelections = (selections || []) as any[];

    // Filter by distance range
    if (distanceMin !== null || distanceMax !== null) {
      filteredSelections = filteredSelections.filter((sel) => {
        const miles = sel.race_distance?.distance_miles;
        if (miles === undefined || miles === null) return false;
        if (distanceMin !== null && miles < distanceMin) return false;
        if (distanceMax !== null && miles > distanceMax) return false;
        return true;
      });
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSelections = filteredSelections.filter((sel) => {
        const raceName = sel.race_distance?.race_edition?.race?.name?.toLowerCase() || "";
        const userName = sel.user?.name?.toLowerCase() || "";
        return raceName.includes(searchLower) || userName.includes(searchLower);
      });
    }

    // Transform to response format
    const transformedSelections: GearSetupSummary[] = filteredSelections.map((sel) => {
      const rd = sel.race_distance;
      const re = rd?.race_edition;
      const race = re?.race;

      // Format tire width
      const formatTireWidth = (tire: { width_value?: number; width_unit?: string } | null) => {
        if (!tire?.width_value) return undefined;
        return `${tire.width_value}${tire.width_unit || "mm"}`;
      };

      return {
        id: sel.id,
        createdAt: sel.created_at,
        user: {
          id: sel.user?.id || "",
          name: sel.user?.name || "Anonymous",
          avatarUrl: sel.user?.avatar_url || null,
        },
        race: {
          id: race?.id || "",
          name: race?.name || "",
          slug: race?.slug || "",
          type: race?.race_subtype || "gravel",
          year: re?.year || new Date().getFullYear(),
          distance: {
            name: rd?.name || null,
            miles: rd?.distance_miles || 0,
          },
        },
        gear: {
          bike: sel.bike ? {
            brand: sel.bike.brand,
            model: sel.bike.model,
            year: sel.bike.year || undefined,
          } : null,
          frontTire: sel.front_tire ? {
            brand: sel.front_tire.brand,
            model: sel.front_tire.model,
            width: formatTireWidth(sel.front_tire),
          } : null,
          rearTire: sel.rear_tire ? {
            brand: sel.rear_tire.brand,
            model: sel.rear_tire.model,
            width: formatTireWidth(sel.rear_tire),
          } : null,
          shoes: sel.shoe ? {
            brand: sel.shoe.brand,
            model: sel.shoe.model,
          } : null,
          repairKit: sel.repair_kit ? {
            name: sel.repair_kit.name,
            itemCount: Array.isArray(sel.repair_kit.items) ? sel.repair_kit.items.length : 0,
          } : null,
          hydrationPack: sel.hydration_pack ? {
            brand: sel.hydration_pack.brand,
            model: sel.hydration_pack.model,
          } : null,
        },
      };
    });

    // Count unique athletes and races
    const { data: uniqueAthletes } = await supabaseAdmin
      .from("race_gear_selections")
      .select("user_id")
      .eq("is_public", true);

    const { data: uniqueRaces } = await supabaseAdmin
      .from("race_gear_selections")
      .select("race_distance!inner(race_edition!inner(race_id))")
      .eq("is_public", true);

    const uniqueAthleteCount = new Set(uniqueAthletes?.map(a => a.user_id)).size;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueRaceCount = new Set(uniqueRaces?.map((r: any) => r.race_distance?.race_edition?.race_id)).size;

    return NextResponse.json({
      data: {
        selections: transformedSelections,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: offset + transformedSelections.length < (count || 0),
        },
        meta: {
          totalSetups: count || 0,
          totalAthletes: uniqueAthleteCount,
          totalRaces: uniqueRaceCount,
        },
      },
    });
  } catch (error) {
    console.error("Error in gear discovery:", error);
    return NextResponse.json(
      { error: "Failed to fetch gear setups" },
      { status: 500 }
    );
  }
}
