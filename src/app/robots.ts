import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thefinalclimb.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/login",
          "/signup",
          "/invite/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
