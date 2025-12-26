import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for public activity feed
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ActivityItem {
  type: "discussion" | "gear_share";
  id?: string;
  title?: string;
  category?: string;
  race_id: string;
  race_name: string;
  race_slug: string;
  user_name: string;
  user_avatar?: string | null;
  created_at: string;
}

export async function GET() {
  try {
    // Fetch recent discussions and gear shares in parallel
    const [discussionsResult, gearSharesResult] = await Promise.all([
      // Recent discussions with race info
      supabaseAdmin
        .from("race_discussions")
        .select(`
          id,
          title,
          category,
          created_at,
          race:races!inner (
            id,
            name,
            slug
          ),
          user:users!race_discussions_user_id_fkey_public (
            name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent public gear shares with race info
      supabaseAdmin
        .from("race_gear_selections")
        .select(`
          id,
          created_at,
          user:users!race_gear_selections_user_id_fkey (
            name,
            avatar_url
          ),
          race_distance:race_distances!inner (
            race_edition:race_editions!inner (
              race:races!inner (
                id,
                name,
                slug
              )
            )
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const activities: ActivityItem[] = [];

    // Process discussions
    if (discussionsResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      discussionsResult.data.forEach((d: any) => {
        if (d.race) {
          activities.push({
            type: "discussion",
            id: d.id,
            title: d.title,
            category: d.category,
            race_id: d.race.id,
            race_name: d.race.name,
            race_slug: d.race.slug,
            user_name: d.user?.name || "Anonymous",
            user_avatar: d.user?.avatar_url,
            created_at: d.created_at,
          });
        }
      });
    }

    // Process gear shares
    if (gearSharesResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gearSharesResult.data.forEach((g: any) => {
        const race = g.race_distance?.race_edition?.race;
        if (race) {
          activities.push({
            type: "gear_share",
            id: g.id,
            race_id: race.id,
            race_name: race.name,
            race_slug: race.slug,
            user_name: g.user?.name || "Anonymous",
            user_avatar: g.user?.avatar_url,
            created_at: g.created_at,
          });
        }
      });
    }

    // Sort by created_at descending and take top 15
    activities.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      activities: activities.slice(0, 15),
    });
  } catch (error) {
    console.error("Error fetching community activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch community activity" },
      { status: 500 }
    );
  }
}
