import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bagSchema } from "@/lib/validations/gear";

// GET /api/gear/inventory/bags/[id] - Get a single bag
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_bags")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: "Bag not found" }, { status: 404 });
  }

  return NextResponse.json({ data, error: null });
}

// PUT /api/gear/inventory/bags/[id] - Update a bag
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = bagSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      data: null,
      error: validation.error.issues[0]?.message || "Invalid input"
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_bags")
    .update(validation.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to update bag" }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// DELETE /api/gear/inventory/bags/[id] - Delete a bag
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_bags")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to delete bag" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true }, error: null });
}
