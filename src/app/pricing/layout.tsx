import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Premium Race Planning Features",
  description:
    "Unlock premium features including Garmin integration, PDF race plans, top tube stickers, unlimited races, and community gear insights. Annual and lifetime plans available.",
  openGraph: {
    title: "FinalClimb Pricing - Premium Race Planning Features",
    description:
      "Unlock premium features including Garmin integration, PDF race plans, top tube stickers, unlimited races, and community gear insights.",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
