import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/gear/selections - List user's race gear selections
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("race_gear_selections")
    .select(`
      *,
      bike:user_bikes(*),
      front_tire:user_tires!race_gear_selections_front_tire_id_fkey(*),
      rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey(*),
      shoe:user_shoes(*),
      hydration_pack:user_hydration_packs(*),
      repair_kit:user_repair_kits(*),
      race:races(id, name, slug),
      race_edition:race_editions(id, year),
      race_distance:race_distances(id, name, distance_miles)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  // Fetch bags and clothing for each selection
  const selectionsWithItems = await Promise.all(
    (data || []).map(async (selection) => {
      const [bagsResult, clothingResult] = await Promise.all([
        supabase
          .from("race_gear_bags")
          .select("bag:user_bags(*)")
          .eq("race_gear_selection_id", selection.id),
        supabase
          .from("race_gear_clothing")
          .select("clothing:user_clothing(*)")
          .eq("race_gear_selection_id", selection.id),
      ]);

      return {
        ...selection,
        bags: bagsResult.data?.map((r) => r.bag) || [],
        clothing: clothingResult.data?.map((r) => r.clothing) || [],
      };
    })
  );

  return NextResponse.json({ data: selectionsWithItems, error: null });
}
