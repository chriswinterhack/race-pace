import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all } = body;

    if (mark_all) {
      // Get all unread notification IDs for this user
      // First, get all notification IDs the user should see
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

      const orConditions: string[] = [];
      if (raceIds.length > 0) {
        orConditions.push(`race_id.in.(${raceIds.join(",")})`);
      }
      orConditions.push("type.eq.new_race");

      // Get all unread notifications
      const { data: allNotifications } = await supabase
        .from("notification_events")
        .select("id")
        .or(orConditions.join(","))
        .neq("actor_id", user.id);

      const allIds = allNotifications?.map((n) => n.id) || [];

      // Get already read IDs
      const { data: alreadyRead } = await supabase
        .from("notification_reads")
        .select("notification_event_id")
        .eq("user_id", user.id);

      const readIds = new Set(
        alreadyRead?.map((r) => r.notification_event_id) || []
      );

      // Filter to only unread
      const unreadIds = allIds.filter((id) => !readIds.has(id));

      if (unreadIds.length > 0) {
        const reads = unreadIds.map((id) => ({
          user_id: user.id,
          notification_event_id: id,
        }));

        const { error } = await supabase
          .from("notification_reads")
          .upsert(reads, { onConflict: "user_id,notification_event_id" });

        if (error) {
          console.error("Error marking all as read:", error);
          return NextResponse.json(
            { error: "Failed to mark notifications as read" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ data: { success: true, count: unreadIds.length } });
    } else if (notification_ids?.length) {
      // Mark specific notifications as read
      const reads = notification_ids.map((id: string) => ({
        user_id: user.id,
        notification_event_id: id,
      }));

      const { error } = await supabase
        .from("notification_reads")
        .upsert(reads, { onConflict: "user_id,notification_event_id" });

      if (error) {
        console.error("Error marking as read:", error);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: { success: true } });
    }

    return NextResponse.json(
      { error: "Invalid request - provide notification_ids or mark_all" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in mark read API:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
