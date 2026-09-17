import type { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gadys-shop.vercel.app";
  const supabase = createSupabaseAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true);

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/produits/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/produits`, changeFrequency: "daily", priority: 0.9 },
    ...productUrls
  ];
}
