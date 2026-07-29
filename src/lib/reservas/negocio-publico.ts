import "server-only";

import { cache } from "react";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type NegocioPublicoReserva = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  telefono: string | null;
  direccion: string | null;
  logo_url: string | null;
  banner_url: string | null;
  color_primario: string | null;
  color_acento: string | null;
};

export const obtenerNegocioPublico = cache(async (slug: string) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("negocios")
    .select(
      "id, nombre, slug, descripcion, telefono, direccion, logo_url, banner_url, color_primario, color_acento",
    )
    .eq("slug", slug)
    .eq("estado", "activo")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return (data as NegocioPublicoReserva | null) ?? null;
});
