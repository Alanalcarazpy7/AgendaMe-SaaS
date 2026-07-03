"use client";

import { ArrowUpRight, CheckCircle2, Crown, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LimitType = "citas" | "empleados" | "servicios" | "clientes";

type PlanLimitModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  limitType: LimitType;
  used: number;
  limit: number;
};

const textos: Record<LimitType, { titulo: string; descripcion: string; beneficio: string }> = {
  citas: {
    titulo: "Llegaste al límite de citas",
    descripcion: "Tu plan actual ya alcanzó el máximo de citas mensuales permitidas.",
    beneficio: "Con un plan superior podés seguir agendando sin cortar la operación de tu negocio.",
  },
  empleados: {
    titulo: "Llegaste al límite de empleados",
    descripcion: "Tu plan actual ya alcanzó el máximo de empleados activos permitidos.",
    beneficio: "Subí de plan para agregar más profesionales, turnos y disponibilidad.",
  },
  servicios: {
    titulo: "Llegaste al límite de servicios",
    descripcion: "Tu plan actual ya alcanzó el máximo de servicios activos permitidos.",
    beneficio: "Con un plan superior podés cargar más servicios y vender mejor tu agenda.",
  },
  clientes: {
    titulo: "Llegaste al límite de clientes",
    descripcion: "Tu plan actual ya alcanzó el máximo de clientes activos permitidos.",
    beneficio: "Si tu negocio ya tiene muchos clientes, un plan superior te permite seguir creciendo sin restricciones.",
  },
};

function getWhatsappUrl(limitType: string, planName: string) {
  const phone = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;

  const message = encodeURIComponent(
    `Hola, quiero mejorar mi plan de AgendaMe. Actualmente tengo el plan ${planName} y llegué al límite de ${limitType}.`
  );

  if (!phone) return "#";

  return `https://wa.me/${phone}?text=${message}`;
}

export function PlanLimitModal({
  open,
  onOpenChange,
  planName,
  limitType,
  used,
  limit,
}: PlanLimitModalProps) {
  if (!open) return null;

  const texto = textos[limitType];
  const whatsappUrl = getWhatsappUrl(limitType, planName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-background shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-6 py-7 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Crown className="h-6 w-6" />
          </div>

          <p className="text-sm text-white/70">AgendaMe</p>
          <h2 className="mt-1 text-2xl font-bold">{texto.titulo}</h2>
          <p className="mt-2 text-sm text-white/75">{texto.descripcion}</p>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan actual</p>
                <p className="text-lg font-bold">{planName}</p>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">Uso actual</p>
                <p className="text-lg font-bold">
                  {used} / {limit}
                </p>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full rounded-full bg-red-500" />
            </div>

            <p className="mt-3 text-sm text-red-600">
              Ya no podés crear más {limitType} con este plan.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm text-muted-foreground">{texto.beneficio}</p>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Te ayudamos a elegir el plan correcto según el tamaño de tu negocio.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contactar por WhatsApp
              </a>

            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Ver después
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}