import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tireSchema } from "@/lib/validations/gear";

// GET /api/gear/inventory/tires/[id] - Get a single tire
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
    .from("user_tires")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: "Tire not found" }, { status: 404 });
  }

  return NextResponse.json({ data, error: null });
}

// PUT /api/gear/inventory/tires/[id] - Update a tire
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

  // Ensure width_value is a number (handle string values from form)
  if (typeof body.width_value === "string") {
    body.width_value = parseFloat(body.width_value);
  }

  const validation = tireSchema.safeParse(body);

  if (!validation.success) {
    const errors = validation.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    return NextResponse.json({
      data: null,
      error: errors || "Invalid input"
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_tires")
    .update(validation.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to update tire" }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// DELETE /api/gear/inventory/tires/[id] - Delete a tire
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
    .from("user_tires")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ data: null, error: "Failed to delete tire" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true }, error: null });
}
