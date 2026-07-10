"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PlanOpcion = { clave: string; nombre: string };

type Props = {
  planes: PlanOpcion[];
};

const selectClass =
  "h-8 rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function NegociosFiltros({ planes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
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

  const exportUrl = `/api/admin/negocios/exportar?${searchParams.toString()}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative w-full sm:w-64"
        onSubmit={(e) => {
          e.preventDefault();
          actualizar({ q: q || null });
        }}
      >
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => actualizar({ q: q || null })}
          placeholder="Buscar por nombre, email, slug…"
          className="pl-8"
          aria-label="Buscar negocios"
        />
      </form>

      <select
        className={selectClass}
        defaultValue={searchParams.get("plan") ?? ""}
        onChange={(e) => actualizar({ plan: e.target.value || null })}
        aria-label="Filtrar por plan"
      >
        <option value="">Todos los planes</option>
        {planes.map((p) => (
          <option key={p.clave} value={p.clave}>
            {p.nombre}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        defaultValue={searchParams.get("estado") ?? ""}
        onChange={(e) => actualizar({ estado: e.target.value || null })}
        aria-label="Filtrar por estado"
      >
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="bloqueado">Bloqueado</option>
      </select>

      <select
        className={selectClass}
        defaultValue={searchParams.get("vencimiento") ?? ""}
        onChange={(e) => actualizar({ vencimiento: e.target.value || null })}
        aria-label="Filtrar por vencimiento"
      >
        <option value="">Cualquier vencimiento</option>
        <option value="7">Vence en 7 días</option>
        <option value="15">Vence en 15 días</option>
        <option value="30">Vence en 30 días</option>
        <option value="vencidas">Vencidas</option>
      </select>

      <select
        className={selectClass}
        defaultValue={searchParams.get("orden") ?? "recientes"}
        onChange={(e) => actualizar({ orden: e.target.value || null })}
        aria-label="Ordenar"
      >
        <option value="recientes">Más recientes</option>
        <option value="nombre">Nombre (A-Z)</option>
        <option value="vencimiento">Vencimiento más próximo</option>
      </select>

      <Button asChild variant="outline" size="sm" className="sm:ml-auto">
        <a href={exportUrl}>
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Exportar
        </a>
      </Button>
    </div>
  );
}
