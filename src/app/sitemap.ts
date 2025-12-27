import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://finalclimbapp.com";
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Fetch all active races for dynamic race pages
  const { data: races } = await supabase
    .from("races")
    .select("slug, updated_at")
    .eq("is_active", true);

  const racePages: MetadataRoute.Sitemap = (races || []).map((race) => ({
    url: `${baseUrl}/dashboard/races/${race.slug}`,
    lastModified: race.updated_at ? new Date(race.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...racePages];
}
