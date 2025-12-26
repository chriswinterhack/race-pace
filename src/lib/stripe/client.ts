import Stripe from "stripe";
import { SupabaseClient } from "@supabase/supabase-js";

// Server-side Stripe client
// Use this in API routes and server components

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Helper to get or create a Stripe customer for a user
export async function getOrCreateStripeCustomer(
  supabaseAdmin: SupabaseClient,
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if customer already exists
  const { data: existingCustomer } = await supabaseAdmin
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Store mapping in database
  await supabaseAdmin.from("stripe_customers").insert({
    user_id: userId,
    stripe_customer_id: customer.id,
  }).select();

  return customer.id;
}

// Type-safe helper for subscription status
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}
