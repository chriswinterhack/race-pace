import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { calculateAllPowerTargets } from "@/lib/calculations/power";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a unique sync code
function generateSyncCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for clarity
  let code = "FC-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  code += "-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/garmin/sync-code - Generate a sync code for a race plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription status
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_status, name")
      .eq("id", user.id)
      .single();

    if (userData?.subscription_status !== "active") {
      return NextResponse.json(
        { error: "Garmin sync requires an active subscription" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { race_plan_id } = body;

    if (!race_plan_id) {
      return NextResponse.json({ error: "race_plan_id is required" }, { status: 400 });
    }

    // Fetch the race plan with all related data
    const { data: plan, error: planError } = await supabase
      .from("race_plans")
      .select(`
        id,
        goal_time_minutes,
        race:races!inner(
          id,
          name,
          slug
        ),
        race_distance:race_distances(
          id,
          name,
          distance_miles
        ),
        segments(
          id,
          segment_order,
          start_mile,
          end_mile,
          start_name,
          end_name,
          target_time_minutes,
          effort_level
        )
      `)
      .eq("id", race_plan_id)
      .eq("user_id", user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Race plan not found" }, { status: 404 });
    }

    // Get athlete profile for power targets
    const { data: profile } = await supabase
      .from("athlete_profiles")
      .select(`
        ftp_watts,
        weight_kg,
        altitude_adjustment_factor,
        if_safe,
        if_tempo,
        if_pushing
      `)
      .eq("user_id", user.id)
      .single();

    // Calculate power targets
    let powerTargets = null;
    if (profile?.ftp_watts) {
      powerTargets = calculateAllPowerTargets(
        profile.ftp_watts,
        profile.altitude_adjustment_factor || 0.20,
        {
          safe: profile.if_safe || 0.67,
          tempo: profile.if_tempo || 0.70,
          pushing: profile.if_pushing || 0.73,
        }
      );
    }

    // Sort segments by order
    const sortedSegments = (plan.segments || []).sort(
      (a, b) => a.segment_order - b.segment_order
    );

    // Build checkpoint list from segments
    const checkpoints = sortedSegments.map((seg, index) => {
      // Calculate cumulative time up to this segment
      const cumulativeMinutes = sortedSegments
        .slice(0, index + 1)
        .reduce((sum, s) => sum + (s.target_time_minutes || 0), 0);

      const hours = Math.floor(cumulativeMinutes / 60);
      const minutes = cumulativeMinutes % 60;
      const targetTime = `${hours}:${minutes.toString().padStart(2, "0")}`;

      return {
        name: seg.end_name || `Checkpoint ${index + 1}`,
        mile: seg.end_mile,
        targetTime,
        targetMinutes: cumulativeMinutes,
        effort: seg.effort_level,
      };
    });

    // Build the plan data snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const race = plan.race as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const distance = plan.race_distance as any;

    const planData = {
      raceName: race?.name || "Race Plan",
      distanceName: distance?.name || "",
      distanceMiles: distance?.distance_miles || 0,
      goalTimeMinutes: plan.goal_time_minutes,
      goalTimeFormatted: plan.goal_time_minutes
        ? `${Math.floor(plan.goal_time_minutes / 60)}:${(plan.goal_time_minutes % 60).toString().padStart(2, "0")}`
        : null,
      checkpoints,
      power: powerTargets
        ? {
            ftp: powerTargets.baseFtp,
            adjustedFtp: powerTargets.adjustedFtp,
            safe: powerTargets.adjustedNP.safe,
            tempo: powerTargets.adjustedNP.tempo,
            pushing: powerTargets.adjustedNP.pushing,
            climbSafe: powerTargets.climbingPower.safe,
            climbTempo: powerTargets.climbingPower.tempo,
            climbPushing: powerTargets.climbingPower.pushing,
            flatSafe: powerTargets.flatPower.safe,
            flatTempo: powerTargets.flatPower.tempo,
            flatPushing: powerTargets.flatPower.pushing,
          }
        : null,
      athleteName: userData?.name || "Athlete",
      exportedAt: new Date().toISOString(),
    };

    // Generate unique code (retry if collision)
    let code = generateSyncCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from("garmin_sync_codes")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      code = generateSyncCode();
      attempts++;
    }

    // Create the sync code record (expires in 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: syncCode, error: insertError } = await supabaseAdmin
      .from("garmin_sync_codes")
      .insert({
        user_id: user.id,
        race_plan_id,
        code,
        plan_data: planData,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating sync code:", insertError);
      return NextResponse.json(
        { error: "Failed to generate sync code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        code: syncCode.code,
        expiresAt: syncCode.expires_at,
        planData,
      },
    });
  } catch (error) {
    console.error("Error in sync code API:", error);
    return NextResponse.json(
      { error: "Failed to generate sync code" },
      { status: 500 }
    );
  }
}

// GET /api/garmin/sync-code - Get user's existing sync codes
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: codes, error } = await supabase
      .from("garmin_sync_codes")
      .select(`
        id,
        code,
        plan_data,
        created_at,
        expires_at,
        last_synced_at,
        sync_count,
        is_active,
        race_plan:race_plans(
          id,
          race:races(name)
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sync codes:", error);
      return NextResponse.json({ error: "Failed to fetch sync codes" }, { status: 500 });
    }

    return NextResponse.json({ data: codes });
  } catch (error) {
    console.error("Error in sync codes GET:", error);
    return NextResponse.json({ error: "Failed to fetch sync codes" }, { status: 500 });
  }
}
