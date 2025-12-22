import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clothingSchema } from "@/lib/validations/gear";

// GET /api/gear/inventory/clothing - List user's clothing
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_clothing")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST /api/gear/inventory/clothing - Create a new clothing item
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = clothingSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({
      data: null,
      error: validation.error.issues[0]?.message || "Invalid input"
    }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_clothing")
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
