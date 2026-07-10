"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const selectClass =
  "h-8 rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function UsuariosFiltros() {
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
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

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
          placeholder="Buscar por nombre o email…"
          className="pl-8"
          aria-label="Buscar usuarios"
        />
      </form>

      <select
        className={selectClass}
        defaultValue={searchParams.get("rol") ?? ""}
        onChange={(e) => actualizar({ rol: e.target.value || null })}
        aria-label="Filtrar por rol global"
      >
        <option value="">Todos los roles</option>
        <option value="usuario">usuario</option>
        <option value="super_admin">super_admin</option>
      </select>

      <select
        className={selectClass}
        defaultValue={searchParams.get("negocio") ?? ""}
        onChange={(e) => actualizar({ negocio: e.target.value || null })}
        aria-label="Filtrar por negocio"
      >
        <option value="">Con o sin negocio</option>
        <option value="con">Con negocio/sucursal</option>
        <option value="sin">Sin negocio/sucursal</option>
      </select>
    </div>
  );
}
