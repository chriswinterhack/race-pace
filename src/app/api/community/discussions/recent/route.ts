import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS for public discussion previews
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch recent discussions with race info (preview only - no body)
    const { data: discussions, error } = await supabaseAdmin
      .from("race_discussions")
      .select(`
        id,
        title,
        category,
        reply_count,
        is_pinned,
        last_activity_at,
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
      .order("last_activity_at", { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Transform to public preview format (no body content)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const previews = discussions?.map((d: any) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      reply_count: d.reply_count,
      is_pinned: d.is_pinned,
      last_activity_at: d.last_activity_at,
      created_at: d.created_at,
      race: {
        id: d.race?.id,
        name: d.race?.name,
        slug: d.race?.slug,
      },
      user: {
        name: d.user?.name || "Anonymous",
        avatar_url: d.user?.avatar_url,
      },
    })) || [];

    return NextResponse.json({
      discussions: previews,
    });
  } catch (error) {
    console.error("Error fetching recent discussions:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent discussions" },
      { status: 500 }
    );
  }
}
