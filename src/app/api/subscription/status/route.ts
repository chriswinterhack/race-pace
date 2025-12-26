import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscription/check";

// GET /api/subscription/status - Get current user's subscription status
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptionStatus = await checkSubscription(supabase, user.id);

    // Get additional subscription details if premium
    let subscriptionDetails = null;
    if (subscriptionStatus.isPremium) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subscription) {
        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          isLifetime: subscription.is_lifetime,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
      }
    }

    return NextResponse.json({
      data: {
        isPremium: subscriptionStatus.isPremium,
        status: subscriptionStatus.status,
        expiresAt: subscriptionStatus.expiresAt,
        isLifetime: subscriptionStatus.isLifetime,
        subscription: subscriptionDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
