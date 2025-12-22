import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tireSchema } from "@/lib/validations/gear";

// GET /api/gear/inventory/tires - List user's tires
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_tires")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST /api/gear/inventory/tires - Create a new tire
export async function POST(request: Request) {
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
    .insert({
      user_id: user.id,
      ...validation.data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
}
