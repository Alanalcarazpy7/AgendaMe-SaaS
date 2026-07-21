"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Busqueda instantanea con debounce, mismo patron que negocios-filtros.tsx.
 * Antes era un <form> nativo dentro de un Server Component: solo buscaba al
 * presionar Enter (submit GET con reload completo de la pagina).
 */
export function PagosBuscador() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const actualizar = useCallback(
    (valor: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor) params.set("q", valor);
      else params.delete("q");
      params.delete("pagina");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const actual = searchParams.get("q") ?? "";
    if (q === actual) return;

    const timer = setTimeout(() => actualizar(q), 350);
    return () => clearTimeout(timer);
  }, [q, searchParams, actualizar]);

  return (
    <form
      className="relative w-full lg:w-80"
      onSubmit={(e) => {
        e.preventDefault();
        actualizar(q);
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar negocio, plan o metodo..."
        className="h-10 rounded-2xl bg-background/70 pl-9"
        aria-label="Buscar pagos"
      />
    </form>
  );
}
