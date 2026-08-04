"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, ImageOff, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { AprobarPagoDialog, RechazarPagoDialog, ResumenPago, type PagoRef } from "@/components/admin/pagos/pago-acciones";
import { PagoComprobanteDialog } from "@/components/admin/pagos/pago-comprobante-dialog";
import { EditarPagoDialog, type PlanParaEdicionPago } from "@/components/admin/pagos/editar-pago-dialog";

type Props = {
  pago: PagoRef & {
    fecha: string | null;
    metodo: string | null;
    notasCliente: string | null;
    comprobanteUrl: string | null;
  };
  planes: PlanParaEdicionPago[];
};

export function PagoPendienteCard({ pago, planes }: Props) {
  const [previewError, setPreviewError] = useState(false);
  const comprobanteHref = pago.comprobanteUrl ? `/api/admin/pagos/${pago.id}/comprobante` : null;

  return (
    <article className="flex flex-col gap-3.5 rounded-[1.5rem] border border-border/75 bg-card/90 p-4 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:bg-card/80 dark:ring-white/5">
      <div className="flex items-start gap-3">
        {comprobanteHref && !previewError ? (
          <a
            href={comprobanteHref}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30"
            title="Abrir comprobante en tamaño completo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- viene de un Route Handler protegido, no de next/image */}
            <img
              src={comprobanteHref}
              alt={`Comprobante de ${pago.negocioNombre ?? "negocio"}`}
              className="h-16 w-16 object-cover"
              onError={() => setPreviewError(true)}
            />
          </a>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/30 text-muted-foreground">
            <ImageOff className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/negocios/${pago.negocioId}`}
              className="truncate text-sm font-black hover:text-primary"
            >
              {pago.negocioNombre ?? "Negocio"}
            </Link>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Clock3 className="h-3 w-3" />
              Pendiente
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatearFechaCorta(pago.fecha)} · {pago.metodo ?? "sin método"}
          </p>
        </div>
      </div>

      <ResumenPago pago={pago} />

      {pago.notasCliente && (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/25 p-2.5 text-xs leading-5 text-muted-foreground">
          <ReceiptText className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
          {pago.notasCliente}
        </p>
      )}

      <div className="mt-1 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
        <PagoComprobanteDialog pagoId={pago.id} comprobanteUrl={pago.comprobanteUrl} />
        <EditarPagoDialog pago={pago} planes={planes} />
        <RechazarPagoDialog pago={pago} />
        <AprobarPagoDialog pago={pago} />
      </div>
    </article>
  );
}
