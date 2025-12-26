"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mountain,
  Check,
  Zap,
  Crown,
  ChevronRight,
  Shield,
  CreditCard,
  Map,
  Watch,
  Download,
  Bike,
  CheckSquare,
  MessageCircle,
} from "lucide-react";
import { STRIPE_PRICES, PREMIUM_FEATURES, FREE_FEATURES } from "@/lib/stripe/prices";
import { useSubscription } from "@/hooks/useSubscription";

export default function PricingPage() {
  const { isPremium, isLoading, data } = useSubscription();
  const [selectedPlan] = useState<"annual" | "lifetime">("annual");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceKey: "annual" | "lifetime") => {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceKey,
          successUrl: `${window.location.origin}/dashboard/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsRedirecting(false);
    }
  };

  const featureIcons: Record<string, React.ReactNode> = {
    map: <Map className="h-5 w-5" />,
    watch: <Watch className="h-5 w-5" />,
    download: <Download className="h-5 w-5" />,
    bike: <Bike className="h-5 w-5" />,
    checklist: <CheckSquare className="h-5 w-5" />,
    messages: <MessageCircle className="h-5 w-5" />,
  };

  return (
    <>
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-navy-950/80 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Mountain className="h-7 w-7 text-brand-sky-400" />
              <span className="text-xl font-heading font-bold text-white tracking-tight">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-brand-navy-900 bg-brand-sky-400 hover:bg-brand-sky-300 px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-brand-navy-950 via-brand-navy-900 to-brand-navy-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-4">
              Simple, Transparent{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-sky-400 to-emerald-400">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Unlock your race potential for less than a gel pack per month. Full access
              to all features with no hidden costs.
            </p>
          </div>

          {/* Already Premium Notice */}
          {!isLoading && isPremium && (
            <div className="mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Crown className="h-5 w-5" />
                <span className="font-semibold">
                  {data?.isLifetime ? "Lifetime Member" : "Premium Member"}
                </span>
              </div>
              <p className="mt-1 text-emerald-300/70 text-sm">
                You already have full access to all features.{" "}
                <Link
                  href="/dashboard/settings/billing"
                  className="underline hover:no-underline"
                >
                  Manage your subscription
                </Link>
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-red-400">
              {error}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {/* Annual Plan */}
            <div
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                selectedPlan === "annual"
                  ? "bg-gradient-to-br from-brand-sky-500/20 to-brand-sky-600/10 border-2 border-brand-sky-500 shadow-lg shadow-brand-sky-500/20"
                  : "bg-white/5 border border-white/10 hover:border-white/20"
              }`}
            >
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-brand-sky-500 text-white text-sm font-semibold shadow-lg">
                  <Zap className="h-4 w-4" />
                  Most Popular
                </span>
              </div>

              <div className="pt-4">
                <h2 className="text-2xl font-heading font-bold text-white">
                  {STRIPE_PRICES.annual.name}
                </h2>
                <p className="mt-2 text-white/60 text-sm">
                  {STRIPE_PRICES.annual.description}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-heading font-bold text-white">
                    ${STRIPE_PRICES.annual.amount / 100}
                  </span>
                  <span className="text-white/60">/year</span>
                </div>
                <p className="mt-1 text-brand-sky-400 text-sm font-medium">
                  Less than $2.50/month
                </p>

                <button
                  onClick={() => handleCheckout("annual")}
                  disabled={isRedirecting || (isPremium && !data?.isLifetime)}
                  className="mt-8 w-full py-4 rounded-xl bg-brand-sky-500 hover:bg-brand-sky-400 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRedirecting ? (
                    "Redirecting..."
                  ) : isPremium ? (
                    "Current Plan"
                  ) : (
                    <>
                      Get Started <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lifetime Plan */}
            <div
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                selectedPlan === "lifetime"
                  ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500 shadow-lg shadow-amber-500/20"
                  : "bg-white/5 border border-white/10 hover:border-white/20"
              }`}
            >
              {/* Best Value Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500 text-white text-sm font-semibold shadow-lg">
                  <Crown className="h-4 w-4" />
                  Best Value
                </span>
              </div>

              <div className="pt-4">
                <h2 className="text-2xl font-heading font-bold text-white">
                  {STRIPE_PRICES.lifetime.name}
                </h2>
                <p className="mt-2 text-white/60 text-sm">
                  {STRIPE_PRICES.lifetime.description}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-heading font-bold text-white">
                    ${STRIPE_PRICES.lifetime.amount / 100}
                  </span>
                  <span className="text-white/60">one-time</span>
                </div>
                <p className="mt-1 text-amber-400 text-sm font-medium">
                  Pay once, access forever
                </p>

                <button
                  onClick={() => handleCheckout("lifetime")}
                  disabled={isRedirecting || (isPremium && data?.isLifetime)}
                  className="mt-8 w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRedirecting ? (
                    "Redirecting..."
                  ) : data?.isLifetime ? (
                    "Current Plan"
                  ) : (
                    <>
                      Get Lifetime Access <Crown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-heading font-bold text-white">
                What&apos;s Included
              </h2>
            </div>

            <div className="divide-y divide-white/5">
              {/* Free Features */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                  Free Access
                </h3>
                <div className="space-y-3">
                  {FREE_FEATURES.filter((f) => f.included).map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-white/80">{feature.name}</span>
                      <span className="text-white/40 text-sm hidden sm:block">
                        — {feature.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Features */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-brand-sky-400 uppercase tracking-wider mb-4">
                  Premium Features
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {PREMIUM_FEATURES.map((feature) => (
                    <div
                      key={feature.name}
                      className="flex items-start gap-3 p-4 rounded-xl bg-brand-sky-500/5 border border-brand-sky-500/10"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-sky-500/10 flex items-center justify-center text-brand-sky-400">
                        {featureIcons[feature.icon]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {feature.name}
                        </h4>
                        <p className="text-sm text-white/50 mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Secure payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              <span>No hidden fees</span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-heading font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                {
                  q: "Can I try before I buy?",
                  a: "Yes! You can browse all races, view community gear setups, and read discussions completely free. Premium is required to create race plans and access advanced features.",
                },
                {
                  q: "What happens when my subscription ends?",
                  a: "You'll still have access to view your existing race plans, but you won't be able to create new ones or use premium features until you renew.",
                },
                {
                  q: "Is lifetime really forever?",
                  a: "Yes! Lifetime members get permanent access to all current and future premium features. Pay once, use forever.",
                },
                {
                  q: "Do you offer refunds?",
                  a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-white/5 border border-white/10"
                >
                  <h3 className="font-semibold text-white">{faq.q}</h3>
                  <p className="mt-2 text-white/60 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-navy-950 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-5 w-5 text-brand-sky-400" />
              <span className="font-heading font-bold text-white">
                Final<span className="text-brand-sky-400">Climb</span>
              </span>
            </Link>
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} FinalClimb. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
