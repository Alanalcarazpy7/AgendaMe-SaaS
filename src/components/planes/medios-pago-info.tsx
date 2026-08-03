"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Building2, Check, Copy, QrCode, Smartphone, Wallet } from "lucide-react";

export type MedioPagoPublico = {
  id: string;
  tipo: string;
  nombre: string;
  titular: string | null;
  banco: string | null;
  identificador_principal: string | null;
  identificador_secundario: string | null;
  alias_tipo: string | null;
  qr_url: string | null;
  logo_url: string | null;
  notas: string | null;
};

const ICONO_POR_TIPO: Record<string, typeof Building2> = {
  transferencia: Building2,
  billetera: Smartphone,
  qr: QrCode,
  otro: Wallet,
};

function CampoCopiable({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      toast.success("Copiado", { description: valor });
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("No se pudo copiar. Copiá el dato manualmente.");
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="flex w-full items-center justify-between gap-2 rounded-xl border bg-background/70 px-3 py-2 text-left transition hover:bg-background"
    >
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-sm font-black">{valor}</span>
      </span>
      {copiado ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

function MedioPagoCard({ medio }: { medio: MedioPagoPublico }) {
  const Icono = ICONO_POR_TIPO[medio.tipo] ?? Wallet;

  return (
    <article className="flex flex-col gap-3 rounded-[1.3rem] border bg-card/70 p-4">
      <div className="flex items-start gap-3">
        {medio.logo_url ? (
          <Image
            src={medio.logo_url}
            alt={medio.nombre}
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 shrink-0 rounded-2xl border bg-white object-contain p-1.5 shadow-sm"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icono className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{medio.nombre}</p>
          {medio.banco && <p className="text-xs text-muted-foreground">{medio.banco}</p>}
        </div>
      </div>

      {medio.titular && (
        <p className="text-xs text-muted-foreground">
          Titular: <span className="font-semibold text-foreground">{medio.titular}</span>
        </p>
      )}

      <div className="grid gap-2">
        {medio.identificador_principal && (
          <CampoCopiable label={medio.alias_tipo || "Alias"} valor={medio.identificador_principal} />
        )}
        {medio.identificador_secundario && (
          <CampoCopiable label="Referencia adicional" valor={medio.identificador_secundario} />
        )}
      </div>

      {medio.qr_url && (
        <div className="flex justify-center rounded-xl border bg-background/70 p-3">
          <Image
            src={medio.qr_url}
            alt={`Código QR de ${medio.nombre}`}
            width={140}
            height={140}
            unoptimized
            className="h-36 w-36 rounded-lg object-cover"
          />
        </div>
      )}

      {medio.notas && (
        <p className="rounded-lg border border-dashed bg-muted/30 p-2 text-xs leading-5 text-muted-foreground">
          {medio.notas}
        </p>
      )}
    </article>
  );
}

export function MediosPagoInfo({ medios }: { medios: MedioPagoPublico[] }) {
  if (medios.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border bg-card shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
      <div className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-cyan-500/10 to-background p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Antes de pagar</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Cómo pagar</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
          Elegí el medio que prefieras, transferí el monto de tu plan y después subí el comprobante
          más abajo para que quede pendiente de aprobación.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {medios.map((medio) => (
          <MedioPagoCard key={medio.id} medio={medio} />
        ))}
      </div>
    </section>
  );
}
