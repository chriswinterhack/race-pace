import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Admin client for bypassing RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Verify user is admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users with subscription data
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        email,
        name,
        subscription_status,
        created_at,
        subscriptions (
          is_lifetime,
          current_period_end,
          cancel_at_period_end,
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscribers:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("Admin subscribers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
