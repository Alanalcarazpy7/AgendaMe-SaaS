import "server-only";

import type { PlanPublico } from "./planes-shared";

const PLANES_PUBLICOS_TIMEOUT_MS = 8_000;

export async function getPlanesPublicos(): Promise<PlanPublico[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Error obteniendo planes publicos: faltan variables de Supabase.");
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLANES_PUBLICOS_TIMEOUT_MS);

  try {
    const url = new URL("/rest/v1/vista_planes_publicos", supabaseUrl);
    url.searchParams.set("select", "*");
    url.searchParams.set("order", "orden.asc");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    if (!response.ok) {
      const detalle = await response.text().catch(() => "");
      console.error(
        "Error obteniendo planes publicos:",
        response.status,
        response.statusText,
        detalle
      );
      return [];
    }

    const data = (await response.json()) as PlanPublico[] | null;

    return data ?? [];
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("Error obteniendo planes publicos:", mensaje);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
