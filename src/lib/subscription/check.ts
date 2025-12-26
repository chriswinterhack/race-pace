import { SupabaseClient } from "@supabase/supabase-js";

// Server-side subscription check utility
// Use this in API routes and server components

export type SubscriptionCheckResult = {
  isPremium: boolean;
  status: "active" | "inactive" | "past_due" | "canceled";
  expiresAt?: string;
  isLifetime?: boolean;
};

export async function checkSubscription(
  supabase: SupabaseClient,
  userId?: string
): Promise<SubscriptionCheckResult> {
  // If no userId provided, get current user
  let targetUserId = userId;

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { isPremium: false, status: "inactive" };
    }
    targetUserId = user.id;
  }

  // Check user's subscription status in users table
  const { data: userData, error } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", targetUserId)
    .single();

  if (error || !userData) {
    return { isPremium: false, status: "inactive" };
  }

  const status = userData.subscription_status as SubscriptionCheckResult["status"];
  const isPremium = status === "active";

  // If premium, get more details from subscriptions table
  if (isPremium) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("current_period_end, is_lifetime")
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return {
      isPremium: true,
      status: "active",
      expiresAt: subscription?.current_period_end || undefined,
      isLifetime: subscription?.is_lifetime || false,
    };
  }

  return { isPremium, status };
}

// Throws an error if user doesn't have premium
// Use in API routes that require premium access
export async function requirePremium(
  supabase: SupabaseClient
): Promise<{ userId: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await checkSubscription(supabase, user.id);

  if (!result.isPremium) {
    throw new Error("Premium subscription required");
  }

  return { userId: user.id };
}
