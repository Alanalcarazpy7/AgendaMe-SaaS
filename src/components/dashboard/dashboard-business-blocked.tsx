import Link from "next/link";
import { AlertTriangle, CalendarOff, MessageCircle, ShieldAlert } from "lucide-react";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";
import type { BlockedBusinessContext } from "@/lib/dashboard/access-context";

type Props = {
  context: BlockedBusinessContext;
};

function formatearFecha(fecha: string | null) {
  if (!fecha) return null;

  try {
    return new Intl.DateTimeFormat("es-PY", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Asuncion",
    }).format(new Date(fecha));
  } catch {
    return fecha;
  }
}

function puedeVerMotivoAdministrativo(context: BlockedBusinessContext) {
  return context.rol === "admin_global" || context.rol === "gerente_sucursal";
}

export function DashboardBusinessBlocked({ context }: Props) {
  const mostrarMotivoReal = puedeVerMotivoAdministrativo(context);
  const fechaBloqueo = formatearFecha(context.negocio.bloqueado_at);
  const motivoReal =
    context.negocio.motivo_bloqueo?.trim() ||
    "AgendaMe no recibio un motivo detallado para este bloqueo.";
  const motivoVisible = mostrarMotivoReal
    ? motivoReal
    : "Tu acceso esta temporalmente restringido. Contacta al responsable del negocio o a soporte de AgendaMe para revisar el estado.";
  const soporteHref = buildWhatsappUrl(
    mostrarMotivoReal
      ? `Hola, quiero revisar el bloqueo del negocio ${context.negocio.nombre}. Motivo mostrado: ${motivoReal}`
      : `Hola, necesito ayuda para revisar mi acceso al negocio ${context.negocio.nombre}.`
  );

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border bg-card shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-primary" />

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-700 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4" />
            {mostrarMotivoReal
              ? "Negocio bloqueado temporalmente"
              : "Acceso temporalmente no disponible"}
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-balance sm:text-4xl">
            {mostrarMotivoReal
              ? `${context.negocio.nombre} esta en pausa administrativa`
              : "No podemos abrir este panel ahora"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {mostrarMotivoReal
              ? "El dashboard queda visible para que sepas que cuenta estas usando, pero las herramientas operativas estan pausadas hasta resolver el bloqueo con AgendaMe."
              : "Tu usuario no puede usar las herramientas operativas en este momento. Si necesitas entrar, contacta al responsable del negocio o a soporte de AgendaMe."}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.35rem] border bg-background/70 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {mostrarMotivoReal ? "Motivo informado" : "Informacion del acceso"}
              </p>
              <p className="mt-3 text-sm font-semibold leading-6">{motivoVisible}</p>
            </div>

            <div className="rounded-[1.35rem] border bg-background/70 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                <CalendarOff className="h-4 w-4 text-primary" />
                Estado del acceso
              </p>
              <p className="mt-3 text-sm font-semibold leading-6">
                {mostrarMotivoReal
                  ? fechaBloqueo
                    ? `Bloqueado desde ${fechaBloqueo}.`
                    : "Bloqueado hasta que AgendaMe lo revise."
                  : "En revision por el responsable de la cuenta."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={soporteHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              <MessageCircle className="h-4 w-4" />
              Contactar soporte
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl border bg-background px-5 text-sm font-black transition hover:bg-muted"
            >
              Cambiar cuenta
            </Link>
          </div>
        </div>

        <aside className="border-t bg-[radial-gradient(circle_at_35%_20%,rgb(251_191_36/0.26),transparent_34%),linear-gradient(145deg,var(--muted),var(--background))] p-5 lg:border-l lg:border-t-0">
          <div className="rounded-[1.4rem] border bg-background/75 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              Que pasa ahora
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              {mostrarMotivoReal ? (
                <>
                  <p>Las citas, reservas, clientes y configuraciones no se eliminan.</p>
                  <p>El acceso vuelve cuando el propietario de AgendaMe desbloquea el negocio.</p>
                  <p>Si el bloqueo fue por pago pendiente, envia el comprobante o contacta soporte.</p>
                </>
              ) : (
                <>
                  <p>Tu cuenta queda protegida mientras se revisa el acceso.</p>
                  <p>No necesitas hacer cambios desde tu usuario.</p>
                  <p>El responsable del negocio o soporte puede darte mas informacion.</p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
