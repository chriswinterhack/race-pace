import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { raceId, name, slug, location, description, website_url, is_active, race_type, race_subtype } = body;

    if (!raceId) {
      return NextResponse.json({ error: "Race ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("races")
      .update({
        name,
        slug,
        location: location || null,
        description: description || null,
        website_url: website_url || null,
        is_active,
        race_type: race_type || null,
        race_subtype: race_subtype || null,
      })
      .eq("id", raceId);

    if (error) {
      console.error("Error updating race:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in races API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get("id");

    if (!raceId) {
      return NextResponse.json({ error: "Race ID is required" }, { status: 400 });
    }

    // Delete will cascade to editions, distances, and related data
    const { error } = await supabaseAdmin
      .from("races")
      .delete()
      .eq("id", raceId);

    if (error) {
      console.error("Error deleting race:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in races API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
