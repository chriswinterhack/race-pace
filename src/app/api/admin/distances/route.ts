import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { race_edition_id, name, distance_miles, date, start_time, elevation_gain, gpx_file_url } = body;

    if (!race_edition_id || !distance_miles) {
      return NextResponse.json({ error: "Edition ID and distance are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("race_distances")
      .insert({
        race_edition_id,
        name: name || null,
        distance_miles,
        date: date || null,
        start_time: start_time || null,
        elevation_gain: elevation_gain || null,
        gpx_file_url: gpx_file_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating distance:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in distances API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { distanceId, name, distance_miles, date, start_time, elevation_gain, surface_composition } = body;

    if (!distanceId) {
      return NextResponse.json({ error: "Distance ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("race_distances")
      .update({
        name: name || null,
        distance_miles,
        date: date || null,
        start_time: start_time || null,
        elevation_gain: elevation_gain || null,
        surface_composition: surface_composition || null,
      })
      .eq("id", distanceId);

    if (error) {
      console.error("Error updating distance:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in distances API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const distanceId = searchParams.get("id");

    if (!distanceId) {
      return NextResponse.json({ error: "Distance ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("race_distances")
      .delete()
      .eq("id", distanceId);

    if (error) {
      console.error("Error deleting distance:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in distances API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
