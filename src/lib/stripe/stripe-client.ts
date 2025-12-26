import { loadStripe, Stripe } from "@stripe/stripe-js";

// Client-side Stripe.js initialization
// Use this for Stripe Elements and checkout redirects

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

// Helper to redirect to Stripe Checkout
// Note: redirectToCheckout was deprecated, use session.url redirect instead
export async function redirectToCheckoutUrl(url: string): Promise<void> {
  window.location.href = url;
}
