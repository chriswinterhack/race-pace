import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NotificationEvent } from "@/types/notifications";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's race IDs (races they have plans for)
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

    // Get user preferences (create default if not exists)
    let { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!prefs) {
      // Create default preferences
      await supabase.from("notification_preferences").insert({
        user_id: user.id,
      });
      prefs = {
        discussion_activity: true,
        gear_shares: true,
        new_races: true,
        coach_alerts: true,
      };
    }

    // Build list of enabled notification types based on preferences
    const enabledTypes: string[] = [];
    if (prefs.discussion_activity) {
      enabledTypes.push("discussion_post", "discussion_reply");
    }
    if (prefs.gear_shares) {
      enabledTypes.push("gear_share");
    }
    if (prefs.new_races) {
      enabledTypes.push("new_race");
    }
    if (prefs.coach_alerts && athleteIds.length > 0) {
      enabledTypes.push("athlete_profile_update");
    }

    if (enabledTypes.length === 0) {
      return NextResponse.json({
        data: { notifications: [], unread_count: 0, has_more: false },
      });
    }

    // Build OR filter for relevance
    // Events are relevant if:
    // 1. race_id is in user's races (for discussion/gear events)
    // 2. type is 'new_race' (all users see new races)
    // 3. target_user_id is in user's athletes (for coach alerts)
    const orConditions: string[] = [];

    if (raceIds.length > 0) {
      orConditions.push(`race_id.in.(${raceIds.join(",")})`);
    }

    if (prefs.new_races) {
      orConditions.push("type.eq.new_race");
    }

    if (athleteIds.length > 0 && prefs.coach_alerts) {
      orConditions.push(`target_user_id.in.(${athleteIds.join(",")})`);
    }

    // If no conditions match, user has no relevant notifications
    if (orConditions.length === 0) {
      return NextResponse.json({
        data: { notifications: [], unread_count: 0, has_more: false },
      });
    }

    // Fetch notifications
    const { data: notifications, error } = await supabase
      .from("notification_events")
      .select(
        `
        *,
        race:races(id, name, slug)
      `
      )
      .in("type", enabledTypes)
      .or(orConditions.join(","))
      .neq("actor_id", user.id) // Don't show own actions
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    // Fetch actor info separately (since FK is to auth.users, not public.users)
    const actorIds = [...new Set(notifications?.map((n) => n.actor_id) || [])];
    const { data: actors } = actorIds.length > 0
      ? await supabase
          .from("users")
          .select("id, name, avatar_url")
          .in("id", actorIds)
      : { data: [] };

    const actorMap = new Map(actors?.map((a) => [a.id, a]) || []);

    // Get read status for these notifications
    const notificationIds = notifications?.map((n) => n.id) || [];
    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_event_id")
      .eq("user_id", user.id)
      .in("notification_event_id", notificationIds);

    const readIds = new Set(reads?.map((r) => r.notification_event_id) || []);

    // Enrich notifications with read status and actor info
    const enrichedNotifications: NotificationEvent[] =
      notifications?.map((n) => ({
        ...n,
        is_read: readIds.has(n.id),
        actor: actorMap.get(n.actor_id) || null,
      })) || [];

    // Count unread (from recent 30 days for performance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: totalRecentCount } = await supabase
      .from("notification_events")
      .select("id", { count: "exact", head: true })
      .in("type", enabledTypes)
      .or(orConditions.join(","))
      .neq("actor_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const { count: readCount } = await supabase
      .from("notification_reads")
      .select("notification_event_id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const unreadCount = Math.max(0, (totalRecentCount || 0) - (readCount || 0));

    return NextResponse.json({
      data: {
        notifications: enrichedNotifications,
        unread_count: unreadCount,
        has_more: notifications?.length === limit,
      },
    });
  } catch (error) {
    console.error("Error in notifications API:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
