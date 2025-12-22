import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { repairKitSchema } from "@/lib/validations/gear";

// GET /api/gear/inventory/repair-kits/[id] - Get a single repair kit
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
    .from("user_repair_kits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: "Repair kit not found" }, { status: 404 });
  }

  return NextResponse.json({ data, error: null });
}

// PUT /api/gear/inventory/repair-kits/[id] - Update a repair kit
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
  const validation = repairKitSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      data: null,
      error: validation.error.issues[0]?.message || "Invalid input"
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_repair_kits")
    .update(validation.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to update repair kit" }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// DELETE /api/gear/inventory/repair-kits/[id] - Delete a repair kit
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
    .from("user_repair_kits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to delete repair kit" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true }, error: null });
}
