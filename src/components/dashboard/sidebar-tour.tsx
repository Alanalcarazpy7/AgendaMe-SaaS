"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, LayoutGrid, PartyPopper, X } from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { getVisibleNavItems, type NavKey } from "@/components/dashboard/dashboard-sidebar";
import { getBottomNavItems } from "@/components/dashboard/dashboard-mobile-bottom-nav";
import { Button } from "@/components/ui/button";

const DESCRIPCIONES: Record<NavKey, string> = {
  inicio: "Tu resumen del día: citas de hoy, pendientes y actividad de la semana, todo de un vistazo.",
  reservas: "Acá revisás las reservas que tus clientes hacen solos desde tu link público.",
  citas: "El calendario completo de tu negocio. Confirmá, reprogramá o cancelá citas.",
  clientes: "Cada cliente que reserva queda guardado acá, con su historial de citas.",
  empleados: "Tu equipo: quién trabaja, qué servicios realiza y su horario.",
  servicios: "Lo que ofrecés: nombre, duración y precio de cada servicio.",
  reportes: "Cómo va tu negocio: citas por estado, actividad semanal y más.",
  exportar: "Descargá tu información en Excel para llevar tus propios registros.",
  recordatorios: "Armá el mensaje de WhatsApp para recordarle la cita a un cliente, listo para enviar.",
  sucursales: "Si tenés más de un local, administralos acá: horarios, empleados y accesos de cada uno.",
  planes: "Tu plan actual y sus límites. Desde acá también subís el comprobante para renovar o cambiar de plan.",
  configuracion: "Los horarios de atención de tu negocio y otros ajustes generales.",
};

type TourStep = {
  targetId: string | null;
  titulo: string;
  descripcion: string;
  requiereDrawer: boolean;
  numero: number | null;
};

type Rect = { top: number; left: number; width: number; height: number };
type ArrowSide = "left" | "top" | "bottom";

type SidebarTourProps = {
  open: boolean;
  onClose: () => void;
  negocioNombre: string;
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  planClave: string;
  onSetDrawerOpen: (open: boolean) => void;
};

const PENDIENTE = "pendiente" as const;

// Devuelve null cuando el paso no tiene objetivo (bienvenida/cierre),
// "pendiente" cuando el objetivo existe pero todavia no tiene una posicion
// real (recien montado, en medio de una transicion CSS), o el rectangulo
// ya asentado.
function medirObjetivo(targetId: string | null): Rect | null | typeof PENDIENTE {
  if (!targetId) return null;

  const el = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
  if (!el) return PENDIENTE;

  el.scrollIntoView({ block: "nearest" });
  const box = el.getBoundingClientRect();

  if (box.width === 0 && box.height === 0) return PENDIENTE;

  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

function rectosIguales(a: Rect, b: Rect) {
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

const GAP = 16;
const ALTURA_CARD_INICIAL = 300;

function calcularPosicion(rect: Rect | null, esMovil: boolean, alturaCard: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect) {
    const cardWidth = Math.min(vw - 24, 360);
    return {
      cardWidth,
      top: Math.max(12, vh / 2 - alturaCard / 2),
      left: Math.max(12, vw / 2 - cardWidth / 2),
      arrow: null as { side: ArrowSide; top: number; left: number } | null,
    };
  }

  if (esMovil) {
    const cardWidth = Math.min(vw - 24, 360);
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - cardWidth / 2, vw - cardWidth - 12));
    const bottom = rect.top + rect.height;
    const espacioAbajo = vh - bottom;
    const espacioArriba = rect.top;
    const colocarAbajo = espacioAbajo >= espacioArriba;
    const alturaDisponible = Math.max(140, (colocarAbajo ? espacioAbajo : espacioArriba) - GAP - 12);
    const alturaCardFinal = Math.min(alturaCard, alturaDisponible);
    const top = colocarAbajo
      ? Math.min(bottom + GAP, vh - alturaCardFinal - 12)
      : Math.max(12, rect.top - alturaCardFinal - GAP);

    const arrowLeft = Math.max(left + 20, Math.min(rect.left + rect.width / 2 - 7, left + cardWidth - 20));

    return {
      cardWidth,
      top,
      left,
      arrow: {
        side: colocarAbajo ? ("top" as const) : ("bottom" as const),
        top: colocarAbajo ? top - 7 : top + alturaCardFinal - 7,
        left: arrowLeft,
      },
    };
  }

  const cardWidth = 336;
  const left = Math.min(rect.left + rect.width + GAP, vw - cardWidth - 12);
  const idealTop = rect.top + rect.height / 2 - alturaCard / 2;
  const top = Math.max(12, Math.min(idealTop, vh - alturaCard - 12));
  const arrowTop = Math.max(top + 20, Math.min(rect.top + rect.height / 2 - 7, top + alturaCard - 20));

  return {
    cardWidth,
    top,
    left,
    arrow: { side: "left" as const, top: arrowTop, left: left - 7 },
  };
}

export function SidebarTour({
  open,
  onClose,
  negocioNombre,
  accessRole,
  accessScope,
  planClave,
  onSetDrawerOpen,
}: SidebarTourProps) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [esMovil, setEsMovil] = useState(false);
  const [alturaCard, setAlturaCard] = useState(ALTURA_CARD_INICIAL);
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const alto = cardRef.current?.offsetHeight;
    if (alto && Math.abs(alto - alturaCard) > 2) {
      setAlturaCard(alto);
    }
  }, [alturaCard, esMovil, open, paso]);

  useEffect(() => {
    function detectar() {
      setEsMovil(window.innerWidth < 1024);
    }

    detectar();
    window.addEventListener("resize", detectar);
    return () => window.removeEventListener("resize", detectar);
  }, []);

  const pasos = useMemo<TourStep[]>(() => {
    const bienvenida: TourStep = {
      targetId: null,
      titulo: `Bienvenido a AgendaMe, ${negocioNombre}`,
      descripcion: esMovil
        ? "Te mostramos rápido para qué sirve cada parte de tu panel. Son unos segundos, y podés volver a verlo cuando quieras."
        : "Te mostramos rápido para qué sirve cada módulo de tu panel. Son unos segundos, y podés volver a verlo cuando quieras.",
      requiereDrawer: false,
      numero: null,
    };

    const cierre: TourStep = {
      targetId: null,
      titulo: "Listo para empezar",
      descripcion:
        "Ya conocés tu panel. Podés volver a ver este recorrido cuando quieras con el botón \"Ver recorrido\".",
      requiereDrawer: false,
      numero: null,
    };

    if (esMovil) {
      const bottomItems = getBottomNavItems(accessRole, accessScope, planClave);
      const todosLosItems = getVisibleNavItems(accessRole, accessScope, planClave);
      const restantes = todosLosItems.filter(
        (item) => !bottomItems.some((bottomItem) => bottomItem.key === item.key)
      );
      let numero = 0;

      const pasosBottom: TourStep[] = bottomItems.map((item) => {
        numero += 1;
        return {
          targetId: `bottom-${item.key}`,
          titulo: item.label,
          descripcion: DESCRIPCIONES[item.key],
          requiereDrawer: false,
          numero,
        };
      });

      const pasoMas: TourStep = {
        targetId: "bottom-mas",
        titulo: "Más",
        descripcion: "Acá encontrás el resto de tus módulos. Te los mostramos a continuación.",
        requiereDrawer: false,
        numero: null,
      };

      const pasosDrawer: TourStep[] = restantes.map((item) => {
        numero += 1;
        return {
          targetId: `drawer-${item.key}`,
          titulo: item.label,
          descripcion: DESCRIPCIONES[item.key],
          requiereDrawer: true,
          numero,
        };
      });

      return [bienvenida, ...pasosBottom, pasoMas, ...pasosDrawer, cierre];
    }

    const modulos: TourStep[] = getVisibleNavItems(accessRole, accessScope, planClave).map(
      (item, index) => ({
        targetId: item.key,
        titulo: item.label,
        descripcion: DESCRIPCIONES[item.key],
        requiereDrawer: false,
        numero: index + 1,
      })
    );

    return [bienvenida, ...modulos, cierre];
  }, [accessRole, accessScope, planClave, negocioNombre, esMovil]);

  const totalModulos = useMemo(
    () => pasos.reduce((max, item) => (item.numero ?? 0) > max ? item.numero ?? max : max, 0),
    [pasos]
  );

  const actual = pasos[Math.min(paso, pasos.length - 1)];
  const esPrimero = paso === 0;
  const esUltimo = paso === pasos.length - 1;

  useEffect(() => {
    if (!open) return;

    if (!esMovil) {
      // Escritorio: el sidebar no anima su apertura, una sola medicion alcanza.
      function recalcularEscritorio() {
        const resultado = medirObjetivo(actual.targetId);
        if (resultado !== PENDIENTE) setRect(resultado);
      }

      const frame = window.requestAnimationFrame(recalcularEscritorio);
      window.addEventListener("resize", recalcularEscritorio);

      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", recalcularEscritorio);
      };
    }

    // Movil: el drawer y la barra inferior pueden estar animando o recien
    // montando, asi que se reintenta hasta que dos lecturas seguidas den el
    // mismo rectangulo (o se agoten los intentos). Nunca se pinta un
    // rectangulo en (0,0): eso solo pasa antes de que el layout se asiente.
    onSetDrawerOpen(actual.requiereDrawer);

    let cancelado = false;
    let anterior: Rect | null = null;
    let timeoutId: number | undefined;

    function intentar(intentosRestantes: number) {
      if (cancelado) return;

      const resultado = medirObjetivo(actual.targetId);

      if (resultado === PENDIENTE) {
        if (intentosRestantes > 0) {
          timeoutId = window.setTimeout(() => intentar(intentosRestantes - 1), 40);
        }
        return;
      }

      setRect(resultado);

      const estable = resultado === null || (anterior !== null && rectosIguales(anterior, resultado));
      anterior = resultado;

      if (!estable && intentosRestantes > 0) {
        timeoutId = window.setTimeout(() => intentar(intentosRestantes - 1), 40);
      }
    }

    intentar(14);

    function alRedimensionar() {
      intentar(4);
    }

    window.addEventListener("resize", alRedimensionar);

    return () => {
      cancelado = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("resize", alRedimensionar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, actual.targetId, actual.requiereDrawer, esMovil]);

  function cerrarTour() {
    setPaso(0);
    onClose();
  }

  if (!open) return null;

  const posicion = calcularPosicion(rect, esMovil, alturaCard);

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Cerrar recorrido"
        onClick={cerrarTour}
        className="absolute inset-0 bg-transparent"
      />

      {rect ? (
        <div
          className="pointer-events-none absolute rounded-2xl transition-all duration-300 ease-[var(--ease-out)]"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow:
              "0 0 0 4px rgba(6,182,212,0.9), 0 0 0 9999px rgba(2,6,23,0.78), 0 0 32px rgba(6,182,212,0.45)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/78" />
      )}

      {posicion.arrow && (
        <div
          className="pointer-events-none absolute z-[1] h-3.5 w-3.5 rotate-45 border border-border/60 bg-popover"
          style={{
            top: posicion.arrow.top,
            left: posicion.arrow.left,
            ...(posicion.arrow.side === "left" ? { borderRight: "none", borderTop: "none" } : {}),
            ...(posicion.arrow.side === "top" ? { borderBottom: "none", borderRight: "none" } : {}),
            ...(posicion.arrow.side === "bottom" ? { borderTop: "none", borderLeft: "none" } : {}),
          }}
        />
      )}

      <div
        ref={cardRef}
        className="absolute rounded-[1.5rem] border bg-popover p-5 text-popover-foreground shadow-2xl shadow-black/30 ring-1 ring-foreground/5 transition-all duration-300 ease-[var(--ease-out)] dark:ring-foreground/10"
        style={{ top: posicion.top, left: posicion.left, width: posicion.cardWidth }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {esUltimo ? (
                <PartyPopper className="h-4 w-4" />
              ) : actual.targetId === "bottom-mas" ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <Compass className="h-4 w-4" />
              )}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {actual.numero != null ? `Paso ${actual.numero} de ${totalModulos}` : "Recorrido guiado"}
            </p>
          </div>
          <button
            type="button"
            onClick={cerrarTour}
            aria-label="Cerrar recorrido"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 text-lg font-bold tracking-tight text-balance">{actual.titulo}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{actual.descripcion}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {pasos.map((paso_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === paso ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            {!esPrimero && (
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setPaso((p) => p - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1"
              onClick={() =>
                esUltimo ? cerrarTour() : setPaso((p) => p + 1)
              }
            >
              {esUltimo ? "Empezar" : "Siguiente"}
              {!esUltimo && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
          <button
            type="button"
            onClick={cerrarTour}
            className="w-full text-center text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Omitir recorrido
          </button>
        </div>
      </div>
    </div>
  );
}
