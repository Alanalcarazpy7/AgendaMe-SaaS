import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const revalidate = 3600;

const RUTAS_ESTATICAS = ["", "/planes", "/login", "/registro", "/terminos", "/privacidad"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const ahora = new Date();

  const estaticas: MetadataRoute.Sitemap = RUTAS_ESTATICAS.map((ruta) => ({
    url: `${siteUrl}${ruta}`,
    lastModified: ahora,
    changeFrequency: ruta === "" ? "weekly" : "monthly",
    priority: ruta === "" ? 1 : 0.6,
  }));

  const admin = createServiceRoleClient();
  const { data: negocios } = await admin
    .from("negocios")
    .select("slug")
    .eq("estado", "activo")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(2000);

  const reservas: MetadataRoute.Sitemap = (negocios ?? [])
    .filter((n): n is { slug: string } => Boolean(n.slug))
    .map((n) => ({
      url: `${siteUrl}/reservar/${encodeURIComponent(n.slug)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...estaticas, ...reservas];
}
