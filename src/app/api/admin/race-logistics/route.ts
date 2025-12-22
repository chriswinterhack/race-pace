import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

// Use service role for admin operations to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PacketPickup {
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes?: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
}

interface CrewLocation {
  name: string;
  mile_out: number;
  mile_in?: number;
  access_type: "unlimited" | "limited" | "reserved";
  parking_info?: string;
  setup_time?: string;
  shuttle_info?: string;
  notes?: string;
  restrictions?: string;
}

interface RaceLogistics {
  parking_info?: string;
  packet_pickup?: PacketPickup[];
  event_schedule?: ScheduleItem[];
  crew_info?: string;
  crew_locations?: CrewLocation[];
  drop_bag_info?: string;
  course_rules?: string;
  course_marking?: string;
  weather_notes?: string;
  additional_info?: string;
}

export async function PUT(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { raceId, logistics } = body as {
      raceId: string;
      logistics: RaceLogistics;
    };

    if (!raceId) {
      return NextResponse.json(
        { error: "Missing raceId" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("races")
      .update({
        parking_info: logistics.parking_info || null,
        packet_pickup: logistics.packet_pickup || [],
        event_schedule: logistics.event_schedule || [],
        crew_info: logistics.crew_info || null,
        crew_locations: logistics.crew_locations || [],
        drop_bag_info: logistics.drop_bag_info || null,
        course_rules: logistics.course_rules || null,
        course_marking: logistics.course_marking || null,
        weather_notes: logistics.weather_notes || null,
        additional_info: logistics.additional_info || null,
      })
      .eq("id", raceId);

    if (error) {
      console.error("Error updating race logistics:", error);
      return NextResponse.json(
        { error: `Failed to update: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch (error) {
    console.error("Race logistics update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
