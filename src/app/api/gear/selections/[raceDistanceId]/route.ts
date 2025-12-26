import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { raceGearSelectionSchema } from "@/lib/validations/gear";
import { createNotificationEvent } from "@/lib/notifications/create-event";

// GET /api/gear/selections/[raceDistanceId] - Get gear selection for a specific race distance
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ raceDistanceId: string }> }
) {
  const { raceDistanceId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data: selection, error } = await supabase
    .from("race_gear_selections")
    .select(`
      *,
      bike:user_bikes(*),
      front_tire:user_tires!race_gear_selections_front_tire_id_fkey(*),
      rear_tire:user_tires!race_gear_selections_rear_tire_id_fkey(*),
      shoe:user_shoes(*),
      hydration_pack:user_hydration_packs(*),
      repair_kit:user_repair_kits(*)
    `)
    .eq("race_distance_id", raceDistanceId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  if (!selection) {
    return NextResponse.json({ data: null, error: null });
  }

  // Fetch bags and clothing
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

  return NextResponse.json({
    data: {
      ...selection,
      bags: bagsResult.data?.map((r) => r.bag) || [],
      clothing: clothingResult.data?.map((r) => r.clothing) || [],
    },
    error: null,
  });
}

// PUT /api/gear/selections/[raceDistanceId] - Create or update gear selection
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ raceDistanceId: string }> }
) {
  const { raceDistanceId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = raceGearSelectionSchema.safeParse({
    ...body,
    race_distance_id: raceDistanceId,
  });

  if (!validation.success) {
    return NextResponse.json({
      data: null,
      error: validation.error.issues[0]?.message || "Invalid input"
    }, { status: 400 });
  }

  const { bag_ids, clothing_ids, ...selectionData } = validation.data;

  // Check if this is a new public share (for notifications)
  const { data: existingSelection } = await supabase
    .from("race_gear_selections")
    .select("id, is_public")
    .eq("race_distance_id", raceDistanceId)
    .eq("user_id", user.id)
    .single();

  const wasPublic = existingSelection?.is_public || false;
  const isNowPublic = selectionData.is_public || false;

  // Upsert the main selection
  const { data: selection, error: upsertError } = await supabase
    .from("race_gear_selections")
    .upsert({
      user_id: user.id,
      ...selectionData,
    }, {
      onConflict: "user_id,race_distance_id",
    })
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ data: null, error: upsertError.message }, { status: 500 });
  }

  // Update bags junction table
  if (bag_ids !== undefined) {
    // Delete existing
    await supabase
      .from("race_gear_bags")
      .delete()
      .eq("race_gear_selection_id", selection.id);

    // Insert new
    if (bag_ids.length > 0) {
      await supabase.from("race_gear_bags").insert(
        bag_ids.map((bag_id) => ({
          race_gear_selection_id: selection.id,
          bag_id,
        }))
      );
    }
  }

  // Update clothing junction table
  if (clothing_ids !== undefined) {
    // Delete existing
    await supabase
      .from("race_gear_clothing")
      .delete()
      .eq("race_gear_selection_id", selection.id);

    // Insert new
    if (clothing_ids.length > 0) {
      await supabase.from("race_gear_clothing").insert(
        clothing_ids.map((clothing_id) => ({
          race_gear_selection_id: selection.id,
          clothing_id,
        }))
      );
    }
  }

  // Create notification if this is a new public share
  if (isNowPublic && !wasPublic) {
    try {
      // Get race info and user name for notification
      const [distanceResult, userResult] = await Promise.all([
        supabase
          .from("race_distances")
          .select(`
            name,
            race_edition:race_editions!inner(
              race:races!inner(id, name)
            )
          `)
          .eq("id", raceDistanceId)
          .single(),
        supabase.from("users").select("name").eq("id", user.id).single(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raceEdition = distanceResult.data?.race_edition as any;
      const raceName = raceEdition?.race?.name || "a race";
      const raceId = raceEdition?.race?.id;
      const distanceName = distanceResult.data?.name || "";
      const userName = userResult.data?.name || "Someone";

      if (raceId) {
        await createNotificationEvent(supabase, {
          type: "gear_share",
          actor_id: user.id,
          race_id: raceId,
          title: `${userName} shared their gear setup for ${raceName}`,
          body: distanceName ? `${distanceName} distance` : undefined,
        });
      }
    } catch (notifError) {
      // Log but don't fail the request if notification creation fails
      console.error("Error creating notification:", notifError);
    }
  }

  return NextResponse.json({ data: selection, error: null });
}

// DELETE /api/gear/selections/[raceDistanceId] - Delete gear selection
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ raceDistanceId: string }> }
) {
  const { raceDistanceId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("race_gear_selections")
    .delete()
    .eq("race_distance_id", raceDistanceId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to delete selection" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true }, error: null });
}
