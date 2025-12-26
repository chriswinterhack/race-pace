import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/races/[raceId]/discussions/[discussionId]/replies - Add a reply
export async function POST(
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

  // Check if user is registered for this race
  const { data: isRegistered } = await supabase.rpc("is_registered_for_race", {
    check_user_id: user.id,
    check_race_id: raceId,
  });

  if (!isRegistered) {
    return NextResponse.json(
      { error: "You must add this race to your plans to reply" },
      { status: 403 }
    );
  }

  // Verify discussion exists and belongs to this race
  const { data: discussion } = await supabase
    .from("race_discussions")
    .select("id")
    .eq("id", discussionId)
    .eq("race_id", raceId)
    .single();

  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  // Parse body
  const body = await request.json();
  const { body: content } = body;

  // Validate
  if (!content || typeof content !== "string" || content.length < 1 || content.length > 5000) {
    return NextResponse.json(
      { error: "Reply must be between 1 and 5,000 characters" },
      { status: 400 }
    );
  }

  // Create reply
  const { data: reply, error } = await supabase
    .from("race_discussion_replies")
    .insert({
      discussion_id: discussionId,
      user_id: user.id,
      body: content.trim(),
    })
    .select(`
      id,
      body,
      created_at,
      user_id,
      user:users!race_discussion_replies_user_id_fkey_public (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: reply }, { status: 201 });
}

// DELETE /api/races/[raceId]/discussions/[discussionId]/replies?replyId=xxx - Delete own reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string; discussionId: string }> }
) {
  const { discussionId } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get reply ID from query params
  const { searchParams } = new URL(request.url);
  const replyId = searchParams.get("replyId");

  if (!replyId) {
    return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });
  }

  // Delete reply (RLS will ensure ownership)
  const { error } = await supabase
    .from("race_discussion_replies")
    .delete()
    .eq("id", replyId)
    .eq("discussion_id", discussionId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
