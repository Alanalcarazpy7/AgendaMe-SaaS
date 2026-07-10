"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, FileUp, ReceiptText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatGs, type PlanPublico } from "@/lib/planes/planes-shared";

type PagoNegocio = {
  id: string;
  plan_id: string | null;
  monto_gs: number | string | null;
  metodo: string | null;
  estado: string;
  comprobante_url: string | null;
  notas_cliente: string | null;
  notas_admin: string | null;
  created_at: string;
};

type Props = {
  planes: PlanPublico[];
  planActualId: string | null;
  pagos: PagoNegocio[];
};

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock3 }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    icon: Clock3,
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-destructive/10 text-destructive ring-destructive/20",
    icon: XCircle,
  },
};

function fechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Asuncion",
  });
}

export function ComprobantePagoForm({ planes, planActualId, pagos }: Props) {
  const opcionesPlan = useMemo(() => {
    const planesPagables = planes.filter(
      (plan) => Number(plan.precio_mensual_gs ?? 0) > 0 || Number(plan.precio_anual_gs ?? 0) > 0
    );
    return planesPagables.length > 0 ? planesPagables : planes;
  }, [planes]);
  const planInicial =
    opcionesPlan.find((plan) => plan.id === planActualId)?.id ??
    opcionesPlan.find((plan) => plan.clave !== "gratis")?.id ??
    opcionesPlan[0]?.id ??
    "";
  const [planId, setPlanId] = useState(planInicial);
  const [ciclo, setCiclo] = useState<"mensual" | "anual">("mensual");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("transferencia");
  const [notas, setNotas] = useState("");
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const planSeleccionado = useMemo(() => opcionesPlan.find((plan) => plan.id === planId) ?? null, [opcionesPlan, planId]);
  const montoSugerido = planSeleccionado
    ? ciclo === "anual"
      ? Number(planSeleccionado.precio_anual_gs ?? 0)
      : Number(planSeleccionado.precio_mensual_gs ?? 0)
    : 0;

  function usarMontoSugerido() {
    if (montoSugerido > 0) setMonto(String(montoSugerido));
  }

  function enviar() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Adjunta el comprobante");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("planId", planId);
      formData.set("montoGs", monto || String(montoSugerido));
      formData.set("metodo", metodo);
      formData.set("notasCliente", notas);
      formData.set("file", file);

      const response = await fetch("/api/dashboard/pagos/comprobante", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error("No se pudo enviar el comprobante", {
          description: data.error ?? "Revisa el archivo y los datos del pago.",
        });
        return;
      }

      toast.success("Comprobante enviado", {
        description: data.message ?? "Queda pendiente de revision por AgendaMe.",
      });
      setNotas("");
      setFileName("");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border bg-card shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-cyan-500/10 to-background p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Pagos y comprobantes</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Enviar comprobante</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Subi la captura o PDF de tu transferencia. Queda pendiente hasta que AgendaMe lo revise.
              </p>
            </div>
            <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/15 sm:block">
              <ReceiptText className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="plan-pago">Plan a pagar</Label>
              <select
                id="plan-pago"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="h-11 rounded-2xl border border-input bg-background px-3 text-sm font-semibold outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {opcionesPlan.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="metodo-pago">Metodo</Label>
              <select
                id="metodo-pago"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="h-11 rounded-2xl border border-input bg-background px-3 text-sm font-semibold outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Deposito</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Ciclo</Label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
                {(["mensual", "anual"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCiclo(item)}
                    className={`h-9 rounded-xl text-sm font-black transition ${
                      ciclo === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item === "mensual" ? "Mensual" : "Anual"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="monto-pago">Monto abonado</Label>
                {montoSugerido > 0 ? (
                  <button type="button" onClick={usarMontoSugerido} className="text-xs font-bold text-primary hover:underline">
                    Usar {formatGs(montoSugerido)}
                  </button>
                ) : null}
              </div>
              <Input
                id="monto-pago"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                inputMode="numeric"
                placeholder={montoSugerido > 0 ? String(montoSugerido) : "Ej: 50000"}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-[1.3rem] border border-dashed border-primary/35 bg-background/70 p-4 transition hover:bg-background">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary">
                <FileUp className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{fileName || "Seleccionar comprobante"}</span>
                <span className="block text-xs text-muted-foreground">JPG, PNG, WEBP o PDF hasta 5 MB.</span>
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>

            <div className="grid gap-2">
              <Label htmlFor="nota-pago">Nota para AgendaMe (opcional)</Label>
              <Textarea
                id="nota-pago"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: pago anual, transferencia desde otra cuenta, numero de operacion..."
                className="min-h-20 rounded-2xl"
              />
            </div>

            <Button type="button" onClick={enviar} disabled={pending || !planId} className="h-11 rounded-2xl">
              {pending ? "Enviando..." : "Enviar comprobante"}
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Historial reciente</h3>
              <p className="mt-1 text-sm text-muted-foreground">Aprobaciones, pendientes y rechazos quedan visibles aca.</p>
            </div>
          </div>

          {pagos.length === 0 ? (
            <div className="mt-5 rounded-[1.3rem] border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
              Todavia no hay comprobantes cargados para este negocio.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {pagos.slice(0, 5).map((pago) => {
                const config = ESTADO_CONFIG[pago.estado] ?? ESTADO_CONFIG.pendiente;
                const EstadoIcon = config.icon;
                const plan = planes.find((item) => item.id === pago.plan_id);
                return (
                  <article key={pago.id} className="rounded-[1.2rem] border bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{plan?.nombre ?? "Plan no especificado"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {fechaCorta(pago.created_at)} - {pago.metodo ?? "sin metodo"} - {formatGs(pago.monto_gs ?? 0)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-black ring-1 ${config.className}`}>
                        <EstadoIcon className="mr-1.5 h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    </div>

                    {pago.estado === "rechazado" ? (
                      <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                        <div className="flex gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <p>
                            <strong>Motivo:</strong> {pago.notas_admin || "AgendaMe rechazo este comprobante. Volve a subirlo con los datos correctos."}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {pago.comprobante_url ? (
                      <a
                        href={pago.comprobante_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center text-xs font-black text-primary hover:underline"
                      >
                        Abrir comprobante
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
