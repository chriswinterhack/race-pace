import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DEV ONLY: Seed a test notification
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find another user to be the "actor" (not current user, so notifications show)
  const { data: otherUser } = await supabase
    .from("users")
    .select("id, name")
    .neq("id", user.id)
    .limit(1)
    .single();

  // Use other user as actor, or fall back to current user
  const actorId = otherUser?.id || user.id;
  const actorName = otherUser?.name || "Another athlete";

  // Get a race the user has added (or any race)
  const { data: userPlan } = await supabase
    .from("race_plans")
    .select(`
      race_distance:race_distances!inner(
        race_edition:race_editions!inner(
          race:races!inner(id, name, slug)
        )
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const race = (userPlan?.race_distance as any)?.race_edition?.race;

  if (!race) {
    // Just get any race
    const { data: anyRace } = await supabase
      .from("races")
      .select("id, name, slug")
      .limit(1)
      .single();

    if (!anyRace) {
      return NextResponse.json({ error: "No races found" }, { status: 404 });
    }

    // Insert notification for new race
    const { data: notification, error } = await supabase
      .from("notification_events")
      .insert({
        type: "new_race",
        actor_id: actorId,
        race_id: anyRace.id,
        title: `New race added: ${anyRace.name}`,
        body: "Check out the course details and start planning!",
        metadata: { slug: anyRace.slug },
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: notification });
  }

  // Create a few sample notifications
  const sampleNotifications = [
    {
      type: "discussion_post" as const,
      actor_id: actorId,
      race_id: race.id,
      title: `${actorName} started a discussion in ${race.name}`,
      body: "What tire pressure are you all running for the gravel sections?",
      metadata: { slug: race.slug },
    },
    {
      type: "gear_share" as const,
      actor_id: actorId,
      race_id: race.id,
      title: `${actorName} shared their gear setup for ${race.name}`,
      body: "100 mile distance",
      metadata: { slug: race.slug },
    },
    {
      type: "discussion_reply" as const,
      actor_id: actorId,
      race_id: race.id,
      title: `${actorName} replied to "Tire pressure tips" in ${race.name}`,
      body: "I'm running 32 psi front, 34 rear on 40c tires. Works great for the mixed terrain!",
      metadata: { slug: race.slug },
    },
  ];

  const { data: notifications, error } = await supabase
    .from("notification_events")
    .insert(sampleNotifications)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: notifications, count: notifications.length });
}
