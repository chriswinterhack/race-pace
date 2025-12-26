import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/client";
import Stripe from "stripe";

// Admin client for database operations (bypasses RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      console.log(`Duplicate webhook event: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Log the event
    await supabaseAdmin.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
    });

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Handle successful checkout session
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const isLifetime = session.metadata?.is_lifetime === "true";

  if (!userId) {
    console.error("No user_id in checkout session metadata");
    return;
  }

  if (isLifetime) {
    // Handle lifetime purchase
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      stripe_price_id: session.metadata?.price_key || "lifetime",
      status: "active",
      is_lifetime: true,
      current_period_start: new Date().toISOString(),
      current_period_end: null, // Lifetime has no end
    });

    // Update user's subscription status
    await supabaseAdmin
      .from("users")
      .update({ subscription_status: "active" })
      .eq("id", userId);

    // Record payment
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    if (paymentIntentId) {
      await supabaseAdmin.from("payments").insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        amount_cents: session.amount_total || 7900,
        currency: session.currency || "usd",
        status: "succeeded",
        description: "Lifetime subscription purchase",
      });
    }
  }
  // For subscriptions, the subscription.created event handles the rest
}

// Handle subscription created/updated
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    // Try to get user_id from customer
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

    const { data: customerData } = await supabaseAdmin
      .from("stripe_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!customerData) {
      console.error("Could not find user for subscription:", subscription.id);
      return;
    }

    await processSubscription(subscription, customerData.user_id);
  } else {
    await processSubscription(subscription, userId);
  }
}

async function processSubscription(subscription: Stripe.Subscription, userId: string) {
  const priceId = subscription.items.data[0]?.price.id;

  // Safely get period timestamps - handle both number (unix) and Date formats
  const subAny = subscription as unknown as Record<string, unknown>;
  const periodStart = subAny.current_period_start;
  const periodEnd = subAny.current_period_end;

  // Convert to ISO string, handling numbers (unix timestamps) or already-Date values
  const toISOString = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'number') return new Date(value * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  };

  // Upsert subscription record
  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      current_period_start: toISOString(periodStart),
      current_period_end: toISOString(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      is_lifetime: false,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Update user's subscription status based on Stripe status
  const userStatus = mapStripeStatusToUserStatus(subscription.status);
  await supabaseAdmin
    .from("users")
    .update({ subscription_status: userStatus })
    .eq("id", userId);
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const { data: customerData } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!customerData) {
    console.error("Could not find user for deleted subscription:", subscription.id);
    return;
  }

  // Update subscription record
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Check if user has any other active subscriptions or lifetime
  const { data: activeSubscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", customerData.user_id)
    .in("status", ["active", "trialing"])
    .limit(1);

  // If no other active subscriptions, mark user as inactive
  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    await supabaseAdmin
      .from("users")
      .update({ subscription_status: "canceled" })
      .eq("id", customerData.user_id);
  }
}

// Handle successful invoice payment
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const { data: customerData } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!customerData) return;

  // Get payment intent ID - handle different types
  const invoiceAny = invoice as unknown as { payment_intent?: string | { id: string } | null };
  const paymentIntentId = typeof invoiceAny.payment_intent === "string"
    ? invoiceAny.payment_intent
    : invoiceAny.payment_intent?.id || null;

  // Record the payment
  await supabaseAdmin.from("payments").insert({
    user_id: customerData.user_id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    description: invoice.description || "Subscription payment",
  });
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const { data: customerData } = await supabaseAdmin
    .from("stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!customerData) return;

  // Get payment intent ID - handle different types
  const invoiceAny = invoice as unknown as { payment_intent?: string | { id: string } | null };
  const paymentIntentId = typeof invoiceAny.payment_intent === "string"
    ? invoiceAny.payment_intent
    : invoiceAny.payment_intent?.id || null;

  // Record the failed payment
  await supabaseAdmin.from("payments").insert({
    user_id: customerData.user_id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_due,
    currency: invoice.currency,
    status: "failed",
    description: `Failed payment: ${invoice.description || "Subscription renewal"}`,
  });

  // Update user status to past_due
  await supabaseAdmin
    .from("users")
    .update({ subscription_status: "past_due" })
    .eq("id", customerData.user_id);
}

// Map Stripe status to our simplified status
function mapStripeStatusToUserStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "inactive" | "past_due" | "canceled" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}
