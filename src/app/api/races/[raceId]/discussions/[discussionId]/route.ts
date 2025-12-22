import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/races/[raceId]/discussions/[discussionId] - Get discussion with replies
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ raceId: string; discussionId: string }> }
) {
  const { raceId, discussionId } = await params;
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
      { error: "You must add this race to your plans to view discussions" },
      { status: 403 }
    );
  }

  // Get discussion
  const { data: discussion, error: discussionError } = await supabase
    .from("race_discussions")
    .select(`
      id,
      race_id,
      category,
      title,
      body,
      is_pinned,
      reply_count,
      last_activity_at,
      created_at,
      user_id,
      user:users!race_discussions_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("id", discussionId)
    .eq("race_id", raceId)
    .single();

  if (discussionError) {
    if (discussionError.code === "PGRST116") {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }
    console.error("Error fetching discussion:", discussionError);
    return NextResponse.json({ error: discussionError.message }, { status: 500 });
  }

  // Get replies
  const { data: replies, error: repliesError } = await supabase
    .from("race_discussion_replies")
    .select(`
      id,
      body,
      created_at,
      user_id,
      user:users!race_discussion_replies_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });

  if (repliesError) {
    console.error("Error fetching replies:", repliesError);
    return NextResponse.json({ error: repliesError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      ...discussion,
      replies: replies || [],
      isAuthor: discussion.user_id === user.id,
    },
  });
}

// DELETE /api/races/[raceId]/discussions/[discussionId] - Delete own discussion
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ raceId: string; discussionId: string }> }
) {
  const { raceId, discussionId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership and delete
  const { error } = await supabase
    .from("race_discussions")
    .delete()
    .eq("id", discussionId)
    .eq("race_id", raceId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting discussion:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/races/[raceId]/discussions/[discussionId] - Update own discussion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string; discussionId: string }> }
) {
  const { raceId, discussionId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, body: content } = body;

  // Validate
  if (title !== undefined && (typeof title !== "string" || title.length < 3 || title.length > 200)) {
    return NextResponse.json(
      { error: "Title must be between 3 and 200 characters" },
      { status: 400 }
    );
  }

  if (content !== undefined && (typeof content !== "string" || content.length < 10 || content.length > 10000)) {
    return NextResponse.json(
      { error: "Content must be between 10 and 10,000 characters" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title) updates.title = title.trim();
  if (content) updates.body = content.trim();

  const { data: discussion, error } = await supabase
    .from("race_discussions")
    .update(updates)
    .eq("id", discussionId)
    .eq("race_id", raceId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating discussion:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: discussion });
}
