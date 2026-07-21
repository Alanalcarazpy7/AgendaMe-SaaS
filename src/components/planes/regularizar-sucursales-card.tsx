"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

type SucursalRegularizacion = {
  id: string;
  nombre: string;
  direccion: string | null;
  es_principal: boolean;
};

type Props = {
  sucursales: SucursalRegularizacion[];
  limite: number;
};

export function RegularizarSucursalesCard({ sucursales, limite }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const principal = sucursales.find((sucursal) => sucursal.es_principal) ?? null;
  const secundarias = sucursales.filter((sucursal) => !sucursal.es_principal);
  const excedente = Math.max(0, sucursales.length - limite);

  async function desactivarSucursal(sucursal: SucursalRegularizacion) {
    try {
      setLoadingId(sucursal.id);

      const response = await fetch("/api/dashboard/planes/regularizar-sucursales", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sucursalId: sucursal.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo desactivar la sucursal.";
        toast.error("No se pudo desactivar la sucursal", { description: message });
        return;
      }

      toast.success("Sucursal desactivada", {
        description: "Los datos históricos se conservan y ya no cuenta como activa.",
      });
      router.refresh();
    } catch {
      toast.error("No se pudo desactivar la sucursal");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-amber-500/25 bg-[linear-gradient(135deg,rgb(245_158_11/0.12),rgb(6_182_212/0.06))] p-5 shadow-sm ring-1 ring-amber-500/10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">Regularizar sucursales activas</p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Este plan permite {limite} sucursal activa. Para quitar la advertencia,
              desactivá {excedente === 1 ? "una sucursal secundaria" : `${excedente} sucursales secundarias`}.
              No se borran citas, empleados ni historial.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-background/75 px-4 py-3 text-sm">
          <p className="font-black tabular-nums">
            {sucursales.length} / {limite}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">activas ahora</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {principal ? (
          <article className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{principal.nombre}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {principal.direccion || "Sucursal principal"}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Siempre activa
                </div>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </article>
        ) : null}

        {secundarias.map((sucursal) => (
          <article key={sucursal.id} className="rounded-2xl border bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{sucursal.nombre}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {sucursal.direccion || "Sucursal secundaria"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => desactivarSucursal(sucursal)}
              disabled={loadingId === sucursal.id}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-2xl border bg-background px-4 text-sm font-black transition hover:bg-muted disabled:opacity-60"
            >
              {loadingId === sucursal.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Desactivar secundaria
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
