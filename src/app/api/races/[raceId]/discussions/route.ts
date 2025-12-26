import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotificationEvent } from "@/lib/notifications/create-event";

type DiscussionCategory = "general" | "gear" | "logistics" | "training" | "strategy";

const VALID_CATEGORIES: DiscussionCategory[] = ["general", "gear", "logistics", "training", "strategy"];

// GET /api/races/[raceId]/discussions - List discussions for a race
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const { raceId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is registered for this race
  const { data: isRegistered } = await supabase.rpc("is_registered_for_race", {
    check_user_id: user.id,
    check_race_id: raceId,
  });

  if (!isRegistered) {
    return NextResponse.json(
      { error: "You must add this race to your plans to view discussions", registered: false },
      { status: 403 }
    );
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as DiscussionCategory | null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build query
  let query = supabase
    .from("race_discussions")
    .select(`
      id,
      category,
      title,
      body,
      is_pinned,
      reply_count,
      last_activity_at,
      created_at,
      user:users!race_discussions_user_id_fkey_public (
        id,
        name,
        avatar_url
      )
    `)
    .eq("race_id", raceId)
    .order("is_pinned", { ascending: false })
    .order("last_activity_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq("category", category);
  }

  const { data: discussions, error } = await query;

  if (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get total count for pagination
  let countQuery = supabase
    .from("race_discussions")
    .select("id", { count: "exact", head: true })
    .eq("race_id", raceId);

  if (category && VALID_CATEGORIES.includes(category)) {
    countQuery = countQuery.eq("category", category);
  }

  const { count: totalCount } = await countQuery;

  return NextResponse.json({
    data: discussions,
    pagination: {
      total: totalCount || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (totalCount || 0),
    },
    registered: true,
  });
}

// POST /api/races/[raceId]/discussions - Create a new discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const { raceId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is registered for this race
  const { data: isRegistered } = await supabase.rpc("is_registered_for_race", {
    check_user_id: user.id,
    check_race_id: raceId,
  });

  if (!isRegistered) {
    return NextResponse.json(
      { error: "You must add this race to your plans to post discussions" },
      { status: 403 }
    );
  }

  // Parse body
  const body = await request.json();
  const { category, title, body: content } = body;

  // Validate
  if (!title || typeof title !== "string" || title.length < 3 || title.length > 200) {
    return NextResponse.json(
      { error: "Title must be between 3 and 200 characters" },
      { status: 400 }
    );
  }

  if (!content || typeof content !== "string" || content.length < 10 || content.length > 10000) {
    return NextResponse.json(
      { error: "Content must be between 10 and 10,000 characters" },
      { status: 400 }
    );
  }

  const discussionCategory = VALID_CATEGORIES.includes(category) ? category : "general";

  // Create discussion
  const { data: discussion, error } = await supabase
    .from("race_discussions")
    .insert({
      race_id: raceId,
      user_id: user.id,
      category: discussionCategory,
      title: title.trim(),
      body: content.trim(),
    })
    .select(`
      id,
      category,
      title,
      body,
      is_pinned,
      reply_count,
      last_activity_at,
      created_at,
      user:users!race_discussions_user_id_fkey_public (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error("Error creating discussion:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notification event for the new discussion
  try {
    // Get race name and user name for notification
    const [raceResult, userResult] = await Promise.all([
      supabase.from("races").select("name").eq("id", raceId).single(),
      supabase.from("users").select("name").eq("id", user.id).single(),
    ]);

    const raceName = raceResult.data?.name || "a race";
    const userName = userResult.data?.name || "Someone";

    await createNotificationEvent(supabase, {
      type: "discussion_post",
      actor_id: user.id,
      race_id: raceId,
      discussion_id: discussion.id,
      title: `${userName} started a discussion in ${raceName}`,
      body: title.trim(),
    });
  } catch (notifError) {
    // Log but don't fail the request if notification creation fails
    console.error("Error creating notification:", notifError);
  }

  return NextResponse.json({ data: discussion }, { status: 201 });
}
