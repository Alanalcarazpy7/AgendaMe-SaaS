import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgendaMe",
    short_name: "AgendaMe",
    description:
      "Reservas, citas y clientes organizados en un solo lugar para negocios de Paraguay.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#0b1120",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
