// Stripe price configuration for FinalClimb
// Update these with actual Stripe price IDs from the dashboard

export const STRIPE_PRICES = {
  // Annual subscription: $29/year
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL || "price_1Sic5hKcrwIOdDuN9s92B73P",
    amount: 2900, // in cents
    currency: "usd",
    interval: "year" as const,
    name: "FinalClimb Premium",
    description: "Annual subscription - unlimited race plans, Garmin sync, exports",
  },

  // Lifetime purchase: $79 one-time (coming soon)
  lifetime: {
    priceId: process.env.STRIPE_PRICE_LIFETIME || "", // Not yet configured
    amount: 7900, // in cents
    currency: "usd",
    interval: null, // one-time
    name: "FinalClimb Lifetime",
    description: "One-time purchase - all premium features forever",
    enabled: false, // Enable when lifetime price is created in Stripe
  },
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;

// Feature definitions for marketing/display
export const PREMIUM_FEATURES = [
  {
    name: "Unlimited Race Plans",
    description: "Create detailed pacing strategies for any race",
    icon: "map",
  },
  {
    name: "Garmin Sync",
    description: "View your plan on your Garmin device during races",
    icon: "watch",
  },
  {
    name: "PDF & Sticker Exports",
    description: "Print top tube stickers and race day reference sheets",
    icon: "download",
  },
  {
    name: "Gear Inventory",
    description: "Track your bikes, equipment, and race-day setups",
    icon: "bike",
  },
  {
    name: "Packing Checklists",
    description: "Never forget essential gear with smart checklists",
    icon: "checklist",
  },
  {
    name: "Community Discussions",
    description: "Post and engage in race-specific discussions",
    icon: "messages",
  },
] as const;

// Free tier features for comparison
export const FREE_FEATURES = [
  {
    name: "Browse All Races",
    description: "Explore race details, courses, and aid stations",
    included: true,
  },
  {
    name: "View Community Gear",
    description: "See what other athletes are using",
    included: true,
  },
  {
    name: "Read Discussions",
    description: "Learn from race-specific community threads",
    included: true,
  },
  {
    name: "Create Race Plans",
    description: "Build personalized pacing strategies",
    included: false,
  },
  {
    name: "Garmin Sync",
    description: "Access plans on your device",
    included: false,
  },
  {
    name: "Export Tools",
    description: "PDF plans and top tube stickers",
    included: false,
  },
] as const;

// Features that require premium (used for gating)
export const PREMIUM_GATED_FEATURES = [
  "create_race_plan",
  "save_race_plan",
  "garmin_sync",
  "export_pdf",
  "export_sticker",
  "gear_inventory",
  "packing_checklist",
  "post_discussion",
  "share_gear_setup",
  "athlete_profile_edit",
] as const;

export type GatedFeature = (typeof PREMIUM_GATED_FEATURES)[number];

// Feature display names for modals
export const FEATURE_DISPLAY_NAMES: Record<GatedFeature, string> = {
  create_race_plan: "Create Race Plan",
  save_race_plan: "Save Race Plan",
  garmin_sync: "Sync to Garmin",
  export_pdf: "Export PDF",
  export_sticker: "Export Top Tube Sticker",
  gear_inventory: "Gear Inventory",
  packing_checklist: "Packing Checklist",
  post_discussion: "Post in Discussions",
  share_gear_setup: "Share Gear Setup",
  athlete_profile_edit: "Edit Athlete Profile",
};
