import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  // Verify admin authorization
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { editionId, year, isActive } = body;

    if (!editionId) {
      return NextResponse.json({ error: "Edition ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("race_editions")
      .update({
        year,
        is_active: isActive,
      })
      .eq("id", editionId);

    if (error) {
      console.error("Error updating edition:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in editions API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
