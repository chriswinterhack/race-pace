import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for this public endpoint (sync code is the auth)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/garmin/sync/[code] - Validate sync code and return plan data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: "Sync code is required" },
        { status: 400 }
      );
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Look up the sync code
    const { data: syncCode, error } = await supabaseAdmin
      .from("garmin_sync_codes")
      .select(`
        id,
        code,
        plan_data,
        expires_at,
        is_active,
        sync_count
      `)
      .eq("code", normalizedCode)
      .single();

    if (error || !syncCode) {
      return NextResponse.json(
        { error: "Invalid sync code" },
        { status: 404 }
      );
    }

    // Check if code is active
    if (!syncCode.is_active) {
      return NextResponse.json(
        { error: "This sync code has been deactivated" },
        { status: 410 }
      );
    }

    // Check if code has expired
    const expiresAt = new Date(syncCode.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This sync code has expired" },
        { status: 410 }
      );
    }

    // Update sync tracking
    await supabaseAdmin
      .from("garmin_sync_codes")
      .update({
        last_synced_at: new Date().toISOString(),
        sync_count: (syncCode.sync_count || 0) + 1,
      })
      .eq("id", syncCode.id);

    // Return plan data formatted for Garmin display
    // The Connect IQ app will parse this JSON
    const planData = syncCode.plan_data as {
      raceName: string;
      distanceName: string;
      distanceMiles: number;
      goalTimeMinutes: number | null;
      goalTimeFormatted: string | null;
      checkpoints: Array<{
        name: string;
        mile: number;
        targetTime: string;
        targetMinutes: number;
        effort: string;
      }>;
      power: {
        ftp: number;
        adjustedFtp: number;
        safe: number;
        tempo: number;
        pushing: number;
        climbSafe: number;
        climbTempo: number;
        climbPushing: number;
        flatSafe: number;
        flatTempo: number;
        flatPushing: number;
      } | null;
      athleteName: string;
      exportedAt: string;
    };

    // Format response optimized for Connect IQ display
    // Keep it compact but readable
    const garminResponse = {
      // Header info
      race: planData.raceName,
      distance: planData.distanceName,
      miles: planData.distanceMiles,
      goal: planData.goalTimeFormatted,
      athlete: planData.athleteName,

      // Power targets (if available)
      power: planData.power
        ? {
            ftp: planData.power.ftp,
            adj: planData.power.adjustedFtp,
            // Race NP targets
            safe: planData.power.safe,
            tempo: planData.power.tempo,
            push: planData.power.pushing,
            // Terrain-specific
            climbSafe: planData.power.climbSafe,
            climbTempo: planData.power.climbTempo,
            climbPush: planData.power.climbPushing,
            flatSafe: planData.power.flatSafe,
            flatTempo: planData.power.flatTempo,
            flatPush: planData.power.flatPushing,
          }
        : null,

      // Checkpoints (simplified for display)
      // Handle both field name formats (mile/targetTime or mi/time)
      checkpoints: planData.checkpoints.map((cp: Record<string, unknown>) => ({
        name: cp.name,
        mi: cp.mile ?? cp.mi,
        time: cp.targetTime ?? cp.time,
        effort: cp.effort,
      })),

      // Metadata
      exported: planData.exportedAt,
      syncs: (syncCode.sync_count || 0) + 1,
    };

    return NextResponse.json({ data: garminResponse });
  } catch (error) {
    console.error("Error validating sync code:", error);
    return NextResponse.json(
      { error: "Failed to validate sync code" },
      { status: 500 }
    );
  }
}
