interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Pre-built schema generators
export function OrganizationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FinalClimb",
    url: "https://thefinalclimb.com",
    logo: "https://thefinalclimb.com/logo.png",
    description:
      "Race planning platform for gravel cycling, mountain biking, and ultra-endurance events. Build personalized race execution plans with power targets, pacing, nutrition, and Garmin integration.",
    sameAs: [
      "https://twitter.com/finalclimbapp",
      "https://instagram.com/finalclimbapp",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@thefinalclimb.com",
    },
  };

  return <JsonLd data={data} />;
}

export function WebSiteSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FinalClimb",
    url: "https://thefinalclimb.com",
    description:
      "Build personalized race execution plans with power targets, pacing strategy, nutrition timing, and Garmin integration for gravel and MTB racing.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://thefinalclimb.com/dashboard/races?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLd data={data} />;
}

export function SoftwareApplicationSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FinalClimb",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    description:
      "Race planning platform for gravel cycling, mountain biking, and ultra-endurance events. Features include power targets, pacing strategy, nutrition timing, Garmin integration, and crew logistics.",
    offers: [
      {
        "@type": "Offer",
        name: "Annual Premium",
        price: "29.99",
        priceCurrency: "USD",
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        "@type": "Offer",
        name: "Lifetime Premium",
        price: "99.99",
        priceCurrency: "USD",
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
    ],
    featureList: [
      "Personalized race pacing",
      "Power target calculations",
      "Nutrition timing plans",
      "Garmin Connect integration",
      "Top tube sticker generator",
      "PDF race plan export",
      "Crew logistics planning",
      "Community gear insights",
    ],
  };

  return <JsonLd data={data} />;
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

export function EventSchema({
  name,
  description,
  startDate,
  location,
  url,
  image,
}: {
  name: string;
  description: string;
  startDate: string;
  location: string;
  url: string;
  image?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    description,
    startDate,
    location: {
      "@type": "Place",
      name: location,
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
      },
    },
    url,
    ...(image && { image }),
    organizer: {
      "@type": "Organization",
      name: "FinalClimb",
      url: "https://thefinalclimb.com",
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
  };

  return <JsonLd data={data} />;
}
