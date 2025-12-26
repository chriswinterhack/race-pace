import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

// Use service role for admin operations to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PassDirection = "outbound" | "inbound" | "single";

interface AidStation {
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
  type?: "aid_station" | "checkpoint";
  // Logistics flags
  is_drop_bag?: boolean;
  is_crew_access?: boolean;
  drop_bag_notes?: string;
  crew_notes?: string;
  // Linked drop bag support (for out-and-back courses)
  drop_bag_name?: string;
  pass_direction?: PassDirection;
}

export async function PUT(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { distanceId, aidStations } = body as {
      distanceId: string;
      aidStations: AidStation[];
    };

    if (!distanceId) {
      return NextResponse.json(
        { error: "Missing distanceId" },
        { status: 400 }
      );
    }

    // Validate and clean aid stations
    const cleanedStations = (aidStations || [])
      .filter((s) => s.name && s.mile >= 0)
      .map((s) => ({
        name: s.name.trim(),
        mile: s.mile,
        supplies: s.supplies || [],
        cutoff_time: s.cutoff_time || null,
        type: s.type || "aid_station", // Default to aid_station for backward compatibility
        // Logistics flags
        is_drop_bag: s.is_drop_bag || false,
        is_crew_access: s.is_crew_access || false,
        drop_bag_notes: s.drop_bag_notes || null,
        crew_notes: s.crew_notes || null,
        // Linked drop bag support
        drop_bag_name: s.drop_bag_name || null,
        pass_direction: s.pass_direction || null,
      }))
      .sort((a, b) => a.mile - b.mile);

    const { error } = await supabaseAdmin
      .from("race_distances")
      .update({ aid_stations: cleanedStations })
      .eq("id", distanceId);

    if (error) {
      console.error("Error updating aid stations:", error);
      return NextResponse.json(
        { error: `Failed to update: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { aidStations: cleanedStations },
      error: null,
    });
  } catch (error) {
    console.error("Aid stations update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
