import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde cualquier dispositivo de
  // la red local (ej. celular) sin depender de la IP exacta, que cambia
  // segun la asignacion DHCP del router. El comodin cubre cualquier
  // direccion 192.168.0.x; si el router asigna otro rango (ej. 192.168.1.x),
  // hay que ajustar este patron. Sin efecto en produccion (Next.js ignora
  // esta opcion fuera de `next dev`).
  allowedDevOrigins: ["192.168.0.*", "localhost", "127.0.0.1"],
  turbopack: {
    root: path.join(__dirname),
  },
};

const canUploadSentrySourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
);

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  sourcemaps: {
    disable: !canUploadSentrySourceMaps,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
