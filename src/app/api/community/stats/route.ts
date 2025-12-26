import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for aggregated public stats
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Run all count queries in parallel
    const [athleteResult, discussionResult, gearShareResult] = await Promise.all([
      // Count distinct users with race plans
      supabaseAdmin
        .from("race_plans")
        .select("user_id", { count: "exact", head: true }),

      // Count total discussions
      supabaseAdmin
        .from("race_discussions")
        .select("id", { count: "exact", head: true }),

      // Count public gear selections
      supabaseAdmin
        .from("race_gear_selections")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true),
    ]);

    return NextResponse.json({
      athlete_count: athleteResult.count || 0,
      discussion_count: discussionResult.count || 0,
      gear_share_count: gearShareResult.count || 0,
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch community stats" },
      { status: 500 }
    );
  }
}
