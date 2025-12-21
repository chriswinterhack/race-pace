import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role for admin operations to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AidStation {
  name: string;
  mile: number;
  supplies?: string[];
  cutoff_time?: string;
}

export async function PUT(request: NextRequest) {
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
