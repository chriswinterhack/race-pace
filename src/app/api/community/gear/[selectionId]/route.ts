import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to fetch public gear selections
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ selectionId: string }> }
) {
  const { selectionId } = await params;

  try {
    // Fetch the gear selection with all related items
    const { data: selection, error } = await supabaseAdmin
      .from("race_gear_selections")
      .select(`
        id,
        is_public,
        notes,
        created_at,
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
              location
            )
          )
        ),
        bike:user_bikes (
          id,
          brand,
          model,
          year,
          bike_type
        ),
        front_tire:user_tires!race_gear_selections_front_tire_id_fkey (
          id,
          brand,
          model,
          width_value,
          width_unit,
          tire_type
        ),
        rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey (
          id,
          brand,
          model,
          width_value,
          width_unit,
          tire_type
        ),
        shoe:user_shoes (
          id,
          brand,
          model,
          shoe_type
        ),
        hydration_pack:user_hydration_packs (
          id,
          brand,
          model,
          capacity_liters
        ),
        repair_kit:user_repair_kits (
          id,
          name,
          items
        )
      `)
      .eq("id", selectionId)
      .eq("is_public", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Gear setup not found or not public" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Fetch bags separately (many-to-many relationship)
    const { data: bags } = await supabaseAdmin
      .from("race_gear_bags")
      .select(`
        bag:user_bags (
          id,
          brand,
          model,
          bag_type,
          capacity_liters
        )
      `)
      .eq("race_gear_selection_id", selectionId);

    // Transform the response (use any to handle Supabase's complex join types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel = selection as any;
    const raceDistance = sel.race_distance;
    const raceEdition = raceDistance?.race_edition;
    const race = raceEdition?.race;

    const gearSetup = {
      id: sel.id,
      notes: sel.notes,
      created_at: sel.created_at,
      user: {
        id: sel.user?.id,
        name: sel.user?.name || "Anonymous",
        avatar_url: sel.user?.avatar_url,
      },
      race: {
        id: race?.id,
        name: race?.name,
        slug: race?.slug,
        location: race?.location,
        year: raceEdition?.year,
        distance: {
          name: raceDistance?.name,
          miles: raceDistance?.distance_miles,
        },
      },
      bike: sel.bike,
      front_tire: sel.front_tire,
      rear_tire: sel.rear_tire,
      shoe: sel.shoe,
      hydration_pack: sel.hydration_pack,
      repair_kit: sel.repair_kit,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bags: bags?.map((b: any) => b.bag).filter(Boolean) || [],
    };

    return NextResponse.json({ data: gearSetup });
  } catch (error) {
    console.error("Error fetching gear setup:", error);
    return NextResponse.json(
      { error: "Failed to fetch gear setup" },
      { status: 500 }
    );
  }
}
