"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  alternarActivoMedioPagoAction,
  eliminarMedioPagoAction,
} from "@/lib/admin/actions/medios-pago";
import type { MedioPagoPlataforma } from "@/lib/admin/queries/medios-pago";
import { MedioPagoDialog } from "@/components/admin/medios-pago/medio-pago-dialog";
import { AdminPanel } from "@/components/admin/admin-ui";

type Props = {
  medios: MedioPagoPlataforma[];
};

const ICONO_POR_TIPO: Record<string, typeof Building2> = {
  transferencia: Building2,
  billetera: Smartphone,
  qr: QrCode,
  otro: Wallet,
};

type AccionConfirmar = "ocultar" | "eliminar";

function ConfirmarAccionDialog({
  medio,
  accion,
  onOpenChange,
  onConfirmado,
}: {
  medio: MedioPagoPlataforma | null;
  accion: AccionConfirmar | null;
  onOpenChange: (open: boolean) => void;
  onConfirmado: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (!medio || !accion) return;

    startTransition(async () => {
      const result =
        accion === "eliminar"
          ? await eliminarMedioPagoAction(medio.id)
          : await alternarActivoMedioPagoAction(medio.id, false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(accion === "eliminar" ? "Medio de pago eliminado." : "Medio de pago ocultado.");
      onConfirmado();
      router.refresh();
    });
  }

  const esEliminar = accion === "eliminar";

  return (
    <Dialog open={Boolean(medio && accion)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="pt-2">
            {esEliminar ? "¿Eliminar este medio de pago?" : "¿Ocultar este medio de pago?"}
          </DialogTitle>
          <DialogDescription>
            {esEliminar ? (
              <>
                <strong>{medio?.nombre}</strong> se va a borrar del todo, junto con su logo y QR. Esta acción
                no se puede deshacer.
              </>
            ) : (
              <>
                <strong>{medio?.nombre}</strong> dejará de verse en /dashboard/planes hasta que lo vuelvas a
                mostrar. No se borra nada.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={esEliminar ? "destructive" : "default"}
            onClick={confirmar}
            disabled={pending}
          >
            {pending ? "Confirmando..." : esEliminar ? "Sí, eliminar" : "Sí, ocultar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MedioPagoCard({
  medio,
  onPedirConfirmacion,
}: {
  medio: MedioPagoPlataforma;
  onPedirConfirmacion: (medio: MedioPagoPlataforma, accion: AccionConfirmar) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icono = ICONO_POR_TIPO[medio.tipo] ?? Wallet;

  function mostrar() {
    startTransition(async () => {
      const result = await alternarActivoMedioPagoAction(medio.id, true);
      if (result.ok) {
        toast.success("Medio de pago visible de nuevo.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-background/60">
      <div className="flex items-center gap-4 border-b border-border/60 bg-muted/20 p-4">
        {medio.logo_url ? (
          <Image
            src={medio.logo_url}
            alt={medio.nombre}
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 shrink-0 rounded-2xl border bg-white object-contain p-2 shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icono className="h-7 w-7" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black">{medio.nombre}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {medio.activo ? (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Eye className="h-3 w-3" />
                Visible
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <EyeOff className="h-3 w-3" />
                Oculto
              </Badge>
            )}
            {medio.qr_url && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <QrCode className="h-3 w-3" />
                Con QR
              </Badge>
            )}
          </div>
        </div>
      </div>

      <dl className="grid gap-2.5 p-4 text-sm">
        {medio.titular && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-xs font-semibold text-muted-foreground">Titular</dt>
            <dd className="min-w-0 truncate text-right font-semibold">{medio.titular}</dd>
          </div>
        )}
        {medio.identificador_principal && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-xs font-semibold text-muted-foreground">
              {medio.alias_tipo || "Alias"}
            </dt>
            <dd className="min-w-0 truncate text-right font-black">{medio.identificador_principal}</dd>
          </div>
        )}
        {medio.banco && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-xs font-semibold text-muted-foreground">Banco</dt>
            <dd className="min-w-0 truncate text-right font-semibold">{medio.banco}</dd>
          </div>
        )}
      </dl>

      {medio.qr_url && (
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-3">
          <Image
            src={medio.qr_url}
            alt={`QR de ${medio.nombre}`}
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 shrink-0 rounded-lg border bg-white object-contain p-1"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Así lo ve el negocio en /dashboard/planes. Si no se ve bien acá, tampoco se va a ver bien ahí.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 p-3">
        <MedioPagoDialog medio={medio} siguienteOrden={medio.orden} />
        {medio.activo ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => onPedirConfirmacion(medio, "ocultar")}
          >
            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            Ocultar
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={mostrar}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Mostrar
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => onPedirConfirmacion(medio, "eliminar")}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar
        </Button>
      </div>
    </article>
  );
}

export function MediosPagoPanel({ medios }: Props) {
  const siguienteOrden = medios.length > 0 ? Math.max(...medios.map((m) => m.orden)) + 10 : 10;
  const [confirmar, setConfirmar] = useState<{
    medio: MedioPagoPlataforma;
    accion: AccionConfirmar;
  } | null>(null);

  return (
    <AdminPanel
      title="Medios de pago"
      description="Lo que ve cada negocio en /dashboard/planes antes de pagar o renovar. Podés tener varios activos a la vez."
      action={<MedioPagoDialog siguienteOrden={siguienteOrden} />}
    >
      {medios.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-background/60 p-5 text-center text-sm text-muted-foreground">
          Todavía no cargaste ningún medio de pago. Los negocios no van a ver dónde transferir hasta que agregues al menos uno.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {medios.map((medio) => (
            <MedioPagoCard
              key={medio.id}
              medio={medio}
              onPedirConfirmacion={(m, accion) => setConfirmar({ medio: m, accion })}
            />
          ))}
        </div>
      )}

      <ConfirmarAccionDialog
        medio={confirmar?.medio ?? null}
        accion={confirmar?.accion ?? null}
        onOpenChange={(openValue) => {
          if (!openValue) setConfirmar(null);
        }}
        onConfirmado={() => setConfirmar(null)}
      />
    </AdminPanel>
  );
}
