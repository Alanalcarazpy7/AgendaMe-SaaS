"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatearFechaHora } from "@/lib/admin/formatters/date";
import type { NotaAdminNegocioRow } from "@/lib/admin/queries/negocio-detalle";
import { agregarNotaAction } from "@/lib/admin/actions/negocios";

type Props = {
  negocioId: string;
  notas: NotaAdminNegocioRow[];
};

export function NegocioNotasPanel({ negocioId, notas }: Props) {
  const [nota, setNota] = useState("");
  const [pending, startTransition] = useTransition();

  function agregar() {
    startTransition(async () => {
      const result = await agregarNotaAction({ negocioId, nota });
      if (result.ok) {
        toast.success("Nota agregada.");
        if (result.auditWarning) toast.warning(result.auditWarning);
        setNota("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Notas internas</h2>

      <div className="flex flex-col gap-2">
        <Textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota visible solo para el propietario de la plataforma..."
        />
        <Button
          type="button"
          size="sm"
          className="self-end"
          onClick={agregar}
          disabled={pending || nota.trim().length === 0}
        >
          {pending ? "Guardando..." : "Agregar nota"}
        </Button>
      </div>

      {notas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay notas para este negocio.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notas.map((n) => (
            <li key={n.id} className="rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.nota}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatearFechaHora(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
