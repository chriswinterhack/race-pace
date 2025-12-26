import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe/client";
import { STRIPE_PRICES, PriceKey } from "@/lib/stripe/prices";

// Admin client for database operations
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { priceKey, successUrl, cancelUrl } = body as {
      priceKey: PriceKey;
      successUrl?: string;
      cancelUrl?: string;
    };

    // Validate price key
    if (!priceKey || !STRIPE_PRICES[priceKey]) {
      return NextResponse.json(
        { error: "Invalid price selection" },
        { status: 400 }
      );
    }

    const priceConfig = STRIPE_PRICES[priceKey];

    // Check if price ID is configured
    if (
      !priceConfig.priceId ||
      priceConfig.priceId.includes("placeholder")
    ) {
      return NextResponse.json(
        { error: "Payment system not yet configured. Please try again later." },
        { status: 503 }
      );
    }

    // Get user name for customer record
    const { data: userData } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .single();

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      supabaseAdmin,
      user.id,
      user.email || userData?.email || "",
      userData?.name || undefined
    );

    // Build success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const defaultSuccessUrl = `${baseUrl}/dashboard/settings/billing?success=true`;
    const defaultCancelUrl = `${baseUrl}/pricing?canceled=true`;

    // Create Stripe Checkout session
    const isLifetime = priceKey === "lifetime";

    // Build base session config
    const baseConfig = {
      customer: customerId,
      line_items: [
        {
          price: priceConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        user_id: user.id,
        price_key: priceKey,
        is_lifetime: isLifetime.toString(),
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto" as const,
    };

    // Create session based on type
    const stripe = getStripe();
    let session;
    if (isLifetime) {
      // One-time payment for lifetime
      session = await stripe.checkout.sessions.create({
        ...baseConfig,
        mode: "payment",
        payment_intent_data: {
          metadata: {
            user_id: user.id,
            is_lifetime: "true",
          },
        },
      });
    } else {
      // Subscription for annual
      session = await stripe.checkout.sessions.create({
        ...baseConfig,
        mode: "subscription",
        subscription_data: {
          metadata: {
            user_id: user.id,
          },
        },
      });
    }

    return NextResponse.json({
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
