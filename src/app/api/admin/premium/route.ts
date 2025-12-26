import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import { z } from "zod";

const grantSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  action: z.enum(["grant", "extend", "revoke"]),
  days: z.number().min(1).max(36500).optional(), // Required for grant/extend
  notes: z.string().max(500).optional(),
  source: z.enum(["admin_grant", "promo", "beta_tester", "partner"]).default("admin_grant"),
});

// POST - Grant, extend, or revoke comped premium
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const validation = grantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { userId, action, days, notes, source } = validation.data;

    if ((action === "grant" || action === "extend") && !days) {
      return NextResponse.json(
        { error: "Days required for grant/extend action" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === "revoke") {
      // Deactivate all comped subscriptions for this user
      const { error: revokeError } = await supabase
        .from("comped_subscriptions")
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: auth.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (revokeError) {
        console.error("Failed to revoke premium:", revokeError);
        return NextResponse.json(
          { error: "Failed to revoke premium" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "revoked",
        userId,
      });
    }

    if (action === "extend") {
      // Get current active comped subscription
      const { data: currentSub } = await supabase
        .from("comped_subscriptions")
        .select("id, expires_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .single();

      if (!currentSub) {
        return NextResponse.json(
          { error: "No active comped subscription to extend. Use 'grant' instead." },
          { status: 400 }
        );
      }

      // Extend from current expiration
      const newExpiration = new Date(currentSub.expires_at);
      newExpiration.setDate(newExpiration.getDate() + (days || 365));

      const { data: updatedSub, error: updateError } = await supabase
        .from("comped_subscriptions")
        .update({
          expires_at: newExpiration.toISOString(),
          notes: notes ? `${notes} (extended by admin)` : "Extended by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSub.id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to extend premium:", updateError);
        return NextResponse.json(
          { error: "Failed to extend premium" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "extended",
        subscription: updatedSub,
      });
    }

    // action === "grant"
    // Deactivate any existing comped subscriptions first
    await supabase
      .from("comped_subscriptions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Create new comped subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (days || 365));

    const { data: newSub, error: insertError } = await supabase
      .from("comped_subscriptions")
      .insert({
        user_id: userId,
        granted_by: auth.userId,
        expires_at: expiresAt.toISOString(),
        source,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to grant premium:", insertError);
      return NextResponse.json(
        { error: "Failed to grant premium" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "granted",
      subscription: newSub,
    });
  } catch (err) {
    console.error("Error managing premium:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get comped subscription status for a user
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all comped subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("comped_subscriptions")
      .select(`
        id,
        starts_at,
        expires_at,
        source,
        source_id,
        is_active,
        notes,
        created_at,
        revoked_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch subscriptions:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    // Find active subscription
    const activeSubscription = subscriptions?.find(
      (s) => s.is_active && new Date(s.expires_at) > new Date()
    );

    return NextResponse.json({
      hasActiveComped: !!activeSubscription,
      activeSubscription,
      history: subscriptions,
    });
  } catch (err) {
    console.error("Error fetching premium status:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
