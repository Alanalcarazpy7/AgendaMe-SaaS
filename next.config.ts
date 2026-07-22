import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde cualquier dispositivo de
  // la red local (ej. celular) sin depender de la IP exacta, que cambia
  // segun la asignacion DHCP del router. El comodin cubre cualquier
  // direccion 192.168.0.x; si el router asigna otro rango (ej. 192.168.1.x),
  // hay que ajustar este patron. Sin efecto en produccion (Next.js ignora
  // esta opcion fuera de `next dev`).
  allowedDevOrigins: ["192.168.0.*"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
