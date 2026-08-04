import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/admin",
        "/admin/",
        "/api/",
        "/auth/",
        "/login",
        "/onboarding/",
        "/invitacion/",
        "/reserva/",
        "/sin-acceso",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
