"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const selectClass =
  "h-8 rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

const TABLAS = [
  "suscripciones",
  "negocios",
  "pagos_manuales",
  "notas_admin_negocio",
  "planes_saas",
  "sucursal_invitaciones",
];

export function AuditoriaFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [accion, setAccion] = useState(searchParams.get("accion") ?? "");
  const [, startTransition] = useTransition();

  const actualizar = useCallback(
    (cambios: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(cambios)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("pagina");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="w-full sm:w-56"
        onSubmit={(e) => {
          e.preventDefault();
          actualizar({ accion: accion || null });
        }}
      >
        <Input
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          onBlur={() => actualizar({ accion: accion || null })}
          placeholder="Buscar por acción…"
          aria-label="Buscar por acción"
        />
      </form>

      <select
        className={selectClass}
        defaultValue={searchParams.get("tabla") ?? ""}
        onChange={(e) => actualizar({ tabla: e.target.value || null })}
        aria-label="Filtrar por tabla"
      >
        <option value="">Todas las tablas</option>
        {TABLAS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <Input
        type="date"
        defaultValue={searchParams.get("desde") ?? ""}
        onChange={(e) => actualizar({ desde: e.target.value ? new Date(e.target.value).toISOString() : null })}
        className="w-fit"
        aria-label="Desde"
      />
      <Input
        type="date"
        defaultValue={searchParams.get("hasta") ?? ""}
        onChange={(e) => actualizar({ hasta: e.target.value ? new Date(e.target.value).toISOString() : null })}
        className="w-fit"
        aria-label="Hasta"
      />
    </div>
  );
}
