import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's race IDs
    const { data: userPlans } = await supabase
      .from("race_plans")
      .select(
        "race_distance:race_distances!inner(race_edition:race_editions!inner(race_id))"
      )
      .eq("user_id", user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raceIds = [
      ...new Set(
        userPlans
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?.map((rp: any) => rp.race_distance?.race_edition?.race_id)
          .filter(Boolean) || []
      ),
    ];

    // Get user's athletes (if coach)
    const { data: athletes } = await supabase
      .from("users")
      .select("id")
      .eq("coach_id", user.id);

    const athleteIds = athletes?.map((a) => a.id) || [];

    // Build OR conditions
    const orConditions: string[] = [];
    if (raceIds.length > 0) {
      orConditions.push(`race_id.in.(${raceIds.join(",")})`);
    }
    orConditions.push("type.eq.new_race");
    if (athleteIds.length > 0) {
      orConditions.push(`target_user_id.in.(${athleteIds.join(",")})`);
    }

    if (orConditions.length === 0) {
      return NextResponse.json({ data: { count: 0 } });
    }

    // Count notifications from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get IDs of relevant notifications
    const { data: relevantNotifications } = await supabase
      .from("notification_events")
      .select("id")
      .or(orConditions.join(","))
      .neq("actor_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const relevantIds = relevantNotifications?.map((n) => n.id) || [];

    if (relevantIds.length === 0) {
      return NextResponse.json({ data: { count: 0 } });
    }

    // Count reads only for relevant notifications
    const { count: readCount } = await supabase
      .from("notification_reads")
      .select("notification_event_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("notification_event_id", relevantIds);

    const unreadCount = Math.max(0, relevantIds.length - (readCount || 0));

    return NextResponse.json({ data: { count: unreadCount } });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ data: { count: 0 } });
  }
}
