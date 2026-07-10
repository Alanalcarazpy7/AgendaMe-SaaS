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
  "h-10 rounded-2xl border border-border/80 bg-background/70 px-3 text-sm font-semibold outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

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
    <div className="rounded-[1.5rem] border border-border/75 bg-card/85 p-3 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/75 dark:ring-white/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <form
          className="relative w-full lg:w-80"
          onSubmit={(e) => {
            e.preventDefault();
            actualizar({ q: q || null });
          }}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => actualizar({ q: q || null })}
            placeholder="Buscar por nombre, email o slug..."
            className="h-10 rounded-2xl border-border/80 bg-background/70 pl-9 shadow-none"
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
          <option value="7">Vence en 7 dias</option>
          <option value="15">Vence en 15 dias</option>
          <option value="30">Vence en 30 dias</option>
          <option value="vencidas">Vencidas</option>
        </select>

        <select
          className={selectClass}
          defaultValue={searchParams.get("orden") ?? "recientes"}
          onChange={(e) => actualizar({ orden: e.target.value || null })}
          aria-label="Ordenar"
        >
          <option value="recientes">Mas recientes</option>
          <option value="nombre">Nombre (A-Z)</option>
          <option value="vencimiento">Vencimiento mas proximo</option>
        </select>

        <Button asChild variant="outline" size="sm" className="h-10 rounded-2xl lg:ml-auto">
          <a href={exportUrl}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar
          </a>
        </Button>
      </div>
    </div>
  );
}
