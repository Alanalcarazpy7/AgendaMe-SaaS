"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Combobox } from "@base-ui/react/combobox";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BadgePlus,
  Brain,
  BriefcaseBusiness,
  CalendarCheck2,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  ExternalLink,
  Flower2,
  GraduationCap,
  Hand,
  HeartPulse,
  LinkIcon,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PawPrint,
  PenTool,
  Phone,
  Scissors,
  Search,
  Shapes,
  Sparkles,
  Store,
  UserRound,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RubroNegocio } from "@/lib/negocios/rubros";
import { cn } from "@/lib/utils";

type Paso = 1 | 2 | 3;
type EstadoSlug = "idle" | "checking" | "available" | "unavailable" | "error";

type OnboardingNegocioFormProps = {
  correoConfirmado?: boolean;
  rubros: RubroNegocio[];
};

type NegocioCreado = {
  nombre: string;
  slug: string;
};

const ICONOS_RUBRO: Record<string, LucideIcon> = {
  scissors: Scissors,
  sparkles: Sparkles,
  "wand-sparkles": WandSparkles,
  hand: Hand,
  "flower-2": Flower2,
  "heart-pulse": HeartPulse,
  "badge-plus": BadgePlus,
  brain: Brain,
  dumbbell: Dumbbell,
  "pen-tool": PenTool,
  "paw-print": PawPrint,
  "graduation-cap": GraduationCap,
  "briefcase-business": BriefcaseBusiness,
  camera: Camera,
  "car-front": CarFront,
  shapes: Shapes,
};

const BENEFICIOS_PANEL: Array<{ icon: LucideIcon; label: string }> = [
  { icon: LinkIcon, label: "Tu enlace" },
  { icon: CalendarCheck2, label: "Calendario" },
  { icon: UserRound, label: "Clientes" },
];

function generarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function FieldFrame({
  icon: Icon,
  invalid = false,
  multiline = false,
  children,
}: {
  icon: LucideIcon;
  invalid?: boolean;
  multiline?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex gap-3 rounded-lg border bg-background px-3 transition-[border-color,box-shadow,background-color] duration-150",
        multiline ? "items-start py-3" : "h-11 items-center",
        invalid
          ? "border-destructive/70 ring-3 ring-destructive/10"
          : "border-border focus-within:border-primary/70 focus-within:bg-card focus-within:ring-3 focus-within:ring-primary/10",
      )}
    >
      <Icon
        className="mt-px size-[17px] shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function OptionalLabel() {
  return <span className="text-xs font-normal text-muted-foreground">Opcional</span>;
}

function RubroCombobox({
  rubros,
  value,
  onChange,
  invalid,
}: {
  rubros: RubroNegocio[];
  value: RubroNegocio | null;
  onChange: (rubro: RubroNegocio | null) => void;
  invalid: boolean;
}) {
  const SelectedIcon = value ? (ICONOS_RUBRO[value.icono] ?? Store) : Store;

  return (
    <Combobox.Root
      items={rubros}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={(item) => item.nombre}
      itemToStringValue={(item) => item.clave}
    >
      <Combobox.InputGroup
        className={cn(
          "group relative flex h-11 items-center rounded-lg border bg-background transition-[border-color,box-shadow,background-color] duration-150 focus-within:bg-card",
          invalid
            ? "border-destructive/70 ring-3 ring-destructive/10"
            : "border-border focus-within:border-primary/70 focus-within:ring-3 focus-within:ring-primary/10",
        )}
      >
        <SelectedIcon
          className="pointer-events-none absolute left-3 size-[17px] text-muted-foreground transition-colors group-focus-within:text-primary"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <Combobox.Input
          id="rubro"
          required
          placeholder="Buscá tu actividad"
          aria-invalid={invalid}
          className="h-full w-full min-w-0 rounded-lg border-0 bg-transparent pr-20 pl-10 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground md:text-sm"
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          {value && (
            <Combobox.Clear
              aria-label="Limpiar rubro"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <X className="size-4" aria-hidden="true" />
            </Combobox.Clear>
          )}
          <Combobox.Trigger
            aria-label="Abrir rubros"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </Combobox.Trigger>
        </div>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
          <Combobox.Popup className="w-[var(--anchor-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl outline-none">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
              <Search className="size-3.5" aria-hidden="true" />
              Escribí para filtrar
            </div>
            <Combobox.Empty className="px-3 py-5 text-center text-sm text-muted-foreground">
              No encontramos ese rubro.
            </Combobox.Empty>
            <Combobox.List className="max-h-60 overflow-y-auto p-1.5">
              {(item: RubroNegocio) => {
                const ItemIcon = ICONOS_RUBRO[item.icono] ?? Store;
                return (
                  <Combobox.Item
                    key={item.id}
                    value={item}
                    className="grid cursor-default grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-md px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <ItemIcon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{item.nombre}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.descripcion}</span>
                    </span>
                    <Combobox.ItemIndicator>
                      <Check className="size-4 text-primary" aria-hidden="true" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                );
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

function Progress({ paso }: { paso: Paso }) {
  const activo = paso === 3 ? 2 : paso;

  return (
    <div className="flex items-center gap-3" aria-label={`Paso ${activo} de 2`}>
      {[1, 2].map((item) => (
        <div key={item} className="flex items-center gap-3 last:flex-1">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full border text-xs font-black",
              item < activo && "border-primary bg-primary text-primary-foreground",
              item === activo && "border-primary bg-primary/10 text-primary ring-3 ring-primary/10",
              item > activo && "border-border text-muted-foreground",
            )}
          >
            {item < activo ? <Check className="size-3.5" aria-hidden="true" /> : item}
          </span>
          <span className={cn("hidden text-xs font-bold sm:inline", item !== activo && "text-muted-foreground")}>
            {item === 1 ? "Tu negocio" : "Reservas"}
          </span>
          {item === 1 && <span className="h-px w-8 bg-border sm:w-14" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#07131f] p-9 text-white lg:flex lg:flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.1) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col">
        <AgendaMeLogo size="md" theme="dark" />

        <div className="my-auto py-8">
          <p className="text-xs font-black text-cyan-300">TU AGENDA EMPIEZA ACÁ</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.04]">
            Menos mensajes.
            <br />
            Más reservas.
          </h1>

          <div className="mt-8 overflow-hidden rounded-lg border border-white/12 bg-white/5 shadow-[0_24px_60px_rgb(0_0_0/0.28)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <span className="text-xs font-bold text-slate-300">Próximos turnos</span>
              <CalendarCheck2 className="size-4 text-cyan-300" aria-hidden="true" />
            </div>
            <div className="space-y-2.5 p-3.5">
              {[
                ["09:00", "Confirmado"],
                ["10:30", "Disponible"],
                ["12:00", "Disponible"],
              ].map(([hora, estado], index) => (
                <div key={hora} className="grid grid-cols-[3.25rem_1fr] items-center gap-3 rounded-md bg-black/15 px-3 py-3">
                  <strong className="text-xs tabular-nums text-white">{hora}</strong>
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={cn("h-1.5 w-10 rounded-full", index === 0 ? "bg-cyan-300" : "bg-white/15")} />
                    {estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Incluido en AgendaMe">
            {BENEFICIOS_PANEL.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-md border border-white/10 bg-black/10 px-2 py-2.5 text-center">
                <Icon className="mx-auto size-4 text-cyan-300" aria-hidden="true" />
                <span className="mt-1.5 block text-[10px] font-bold text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-xs font-semibold text-slate-400">
          <BadgeCheck className="size-4 text-cyan-300" aria-hidden="true" />
          Plan Gratis · Sin tarjeta
        </div>
      </div>
    </aside>
  );
}

function StatusSlug({ estado }: { estado: EstadoSlug }) {
  if (estado === "checking") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
        Comprobando...
      </span>
    );
  }

  if (estado === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        Disponible
      </span>
    );
  }

  if (estado === "unavailable") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
        <AlertCircle className="size-3.5" aria-hidden="true" />
        Ya está en uso
      </span>
    );
  }

  if (estado === "error") {
    return <span className="text-xs text-muted-foreground">Se validará al continuar</span>;
  }

  return <span className="text-xs text-muted-foreground">Será tu enlace para compartir</span>;
}

export function OnboardingNegocioForm({
  correoConfirmado = false,
  rubros,
}: OnboardingNegocioFormProps) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>(1);
  const [intentoContinuar, setIntentoContinuar] = useState(false);
  const [nombreResponsable, setNombreResponsable] = useState("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugPersonalizado, setSlugPersonalizado] = useState(false);
  const [estadoSlug, setEstadoSlug] = useState<EstadoSlug>("idle");
  const [sugerenciasSlug, setSugerenciasSlug] = useState<string[]>([]);
  const [rubro, setRubro] = useState<RubroNegocio | null>(null);
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [negocioCreado, setNegocioCreado] = useState<NegocioCreado | null>(null);

  const responsableInvalido = intentoContinuar && nombreResponsable.trim().length < 2;
  const nombreInvalido = intentoContinuar && nombre.trim().length < 2;
  const rubroInvalido = intentoContinuar && !rubro;
  const rubrosRapidos = (() => {
    const destacados = rubros
      .filter((item) =>
        ["barberia", "estetica-belleza", "salud-bienestar", "servicios-profesionales"].includes(item.clave),
      )
      .slice(0, 4);

    return destacados.length > 0 ? destacados : rubros.slice(0, 4);
  })();

  useEffect(() => {
    if (slug.length < 3) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setEstadoSlug("checking");

      try {
        const response = await fetch(
          `/api/onboarding/negocio?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as {
          disponible?: boolean;
          sugerencias?: string[];
        };

        if (!response.ok) {
          setEstadoSlug("error");
          return;
        }

        setEstadoSlug(data.disponible ? "available" : "unavailable");
        setSugerenciasSlug(data.sugerencias ?? []);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setEstadoSlug("error");
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [slug]);

  function handleNombreChange(value: string) {
    setNombre(value);
    if (!slugPersonalizado) {
      const siguienteSlug = generarSlug(value);
      setSlug(siguienteSlug);
      setEstadoSlug(siguienteSlug.length >= 3 ? "checking" : "idle");
      setSugerenciasSlug([]);
    }
  }

  function handleSlugChange(value: string) {
    const siguienteSlug = generarSlug(value).slice(0, 80);
    setSlugPersonalizado(true);
    setSlug(siguienteSlug);
    setEstadoSlug(siguienteSlug.length >= 3 ? "checking" : "idle");
    setSugerenciasSlug([]);
  }

  function continuar() {
    setIntentoContinuar(true);
    setError(null);

    if (nombreResponsable.trim().length < 2 || nombre.trim().length < 2 || !rubro) {
      setError("Completá los tres campos para continuar.");
      return;
    }

    setIntentoContinuar(false);
    setPaso(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (paso === 1) {
      continuar();
      return;
    }

    if (paso !== 2 || !rubro) return;

    if (slug.length < 3) {
      setError("El enlace debe tener al menos 3 caracteres.");
      return;
    }

    if (estadoSlug === "checking") {
      setError("Esperá mientras comprobamos el enlace.");
      return;
    }

    if (estadoSlug === "unavailable") {
      setError("Elegí un enlace disponible.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/negocio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreResponsable: nombreResponsable.trim(),
          nombre: nombre.trim(),
          slug,
          rubroClave: rubro.clave,
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          descripcion: descripcion.trim(),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        negocio?: NegocioCreado;
      };

      if (!response.ok || !data.negocio) {
        setError(data.error ?? "No se pudo crear el negocio.");
        return;
      }

      setNegocioCreado(data.negocio);
      setPaso(3);
    } catch {
      setError("Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card shadow-[0_30px_90px_rgb(2_8_23/0.18)] ring-1 ring-white/60 dark:ring-white/5 lg:grid lg:min-h-[40rem] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-primary" aria-hidden="true" />
      <BrandPanel />

      <section className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between gap-4">
          <div className="lg:hidden">
            <AgendaMeLogo size="sm" />
          </div>
          <Progress paso={paso} />
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
            <LockKeyhole className="size-3.5 text-primary" aria-hidden="true" />
            Cuenta segura
          </span>
        </div>

        {paso < 3 ? (
          <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-1 flex-col">
            <header>
              <p className="text-xs font-black text-primary">PASO {paso} DE 2</p>
              <h2 className="mt-1.5 text-3xl font-black leading-tight sm:text-4xl">
                {paso === 1 ? "Empecemos por tu negocio" : "Prepará tu enlace de reservas"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {paso === 1
                  ? "Solo necesitamos tres datos para crear tu espacio."
                  : "El contacto y la ubicación son opcionales."}
              </p>
            </header>

            {correoConfirmado && paso === 1 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                Correo confirmado. Tu plan Gratis está listo.
              </div>
            )}

            <div className="mt-6">
              {paso === 1 ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="nombreResponsable">Tu nombre</Label>
                      <FieldFrame icon={UserRound} invalid={responsableInvalido}>
                        <Input
                          id="nombreResponsable"
                          value={nombreResponsable}
                          onChange={(event) => setNombreResponsable(event.target.value)}
                          placeholder="Nombre del responsable"
                          autoComplete="name"
                          required
                          aria-invalid={responsableInvalido}
                          className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                      </FieldFrame>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="nombre">Nombre del negocio</Label>
                      <FieldFrame icon={Store} invalid={nombreInvalido}>
                        <Input
                          id="nombre"
                          value={nombre}
                          onChange={(event) => handleNombreChange(event.target.value)}
                          placeholder="Ej. Estudio Central"
                          autoComplete="organization"
                          required
                          aria-invalid={nombreInvalido}
                          className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                      </FieldFrame>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rubro">¿A qué se dedica?</Label>
                    <RubroCombobox rubros={rubros} value={rubro} onChange={setRubro} invalid={rubroInvalido} />
                    {!rubro && rubros.length > 0 && (
                      <div className="hidden flex-wrap items-center gap-2 pt-1 sm:flex">
                        <span className="text-xs text-muted-foreground">Más elegidos:</span>
                        {rubrosRapidos.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setRubro(item)}
                            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground outline-none transition-[border-color,background-color,color,transform] hover:border-primary/40 hover:bg-primary/8 hover:text-foreground active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/30"
                          >
                            {item.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="slug">Enlace público</Label>
                    <div
                      className={cn(
                        "group flex h-11 items-center rounded-lg border bg-background px-3 transition-[border-color,box-shadow] focus-within:ring-3",
                        estadoSlug === "unavailable"
                          ? "border-destructive/70 focus-within:ring-destructive/10"
                          : "border-border focus-within:border-primary/70 focus-within:ring-primary/10",
                      )}
                    >
                      <LinkIcon className="mr-2 size-[17px] shrink-0 text-primary" aria-hidden="true" />
                      <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">/reservar/</span>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(event) => handleSlugChange(event.target.value)}
                        placeholder="tu-negocio"
                        minLength={3}
                        maxLength={80}
                        required
                        aria-describedby="slug-status"
                        className="h-full min-w-0 border-0 bg-transparent px-1 font-bold shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div id="slug-status" aria-live="polite">
                      <StatusSlug estado={estadoSlug} />
                    </div>
                    {estadoSlug === "unavailable" && sugerenciasSlug.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sugerenciasSlug.map((sugerencia) => (
                          <button
                            key={sugerencia}
                            type="button"
                            onClick={() => {
                              setSlugPersonalizado(true);
                              setSlug(sugerencia);
                              setEstadoSlug("checking");
                              setSugerenciasSlug([]);
                            }}
                            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-bold text-primary outline-none hover:border-primary/40 hover:bg-primary/8 focus-visible:ring-3 focus-visible:ring-ring/30"
                          >
                            {sugerencia}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="telefono" className="flex w-full justify-between">
                        WhatsApp <OptionalLabel />
                      </Label>
                      <FieldFrame icon={Phone}>
                        <Input
                          id="telefono"
                          value={telefono}
                          onChange={(event) => setTelefono(event.target.value.slice(0, 40))}
                          placeholder="0981 234 567"
                          inputMode="tel"
                          autoComplete="tel"
                          className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                      </FieldFrame>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="direccion" className="flex w-full justify-between">
                        Ubicación <OptionalLabel />
                      </Label>
                      <FieldFrame icon={MapPin}>
                        <Input
                          id="direccion"
                          value={direccion}
                          onChange={(event) => setDireccion(event.target.value.slice(0, 180))}
                          placeholder="Ciudad o dirección"
                          autoComplete="street-address"
                          className="h-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                      </FieldFrame>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="descripcion" className="flex w-full justify-between">
                      Descripción <OptionalLabel />
                    </Label>
                    <FieldFrame icon={BriefcaseBusiness} multiline>
                      <Textarea
                        id="descripcion"
                        value={descripcion}
                        onChange={(event) => setDescripcion(event.target.value.slice(0, 280))}
                        placeholder="Contá brevemente qué ofrecés"
                        rows={2}
                        maxLength={280}
                        className="min-h-12 resize-none border-0 bg-transparent px-1 py-0.5 leading-6 shadow-none focus-visible:ring-0"
                      />
                    </FieldFrame>
                  </div>
                </div>
              )}
            </div>

            <div aria-live="polite" className="mt-4">
              {error && (
                <Alert variant="destructive" className="rounded-lg border-destructive/25 bg-destructive/8 py-2">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm font-medium text-destructive">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="mt-auto flex items-center gap-3 pt-5">
              {paso === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPaso(1);
                    setError(null);
                  }}
                  disabled={loading}
                  className="h-11 rounded-lg px-4 active:scale-[0.98]"
                >
                  <ArrowLeft className="size-4" />
                  Atrás
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-11 flex-1 rounded-lg font-bold shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Creando...
                  </>
                ) : paso === 1 ? (
                  <>
                    Continuar
                    <ArrowRight className="size-4" />
                  </>
                ) : (
                  <>
                    Crear mi negocio
                    <CalendarCheck2 className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-1 flex-col justify-center py-8">
            <span className="flex size-12 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Check className="size-6" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-black text-emerald-600 dark:text-emerald-300">NEGOCIO CREADO</p>
            <h2 className="mt-2 max-w-lg text-3xl font-black leading-tight">
              {negocioCreado?.nombre} ya tiene su agenda.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Ahora podés cargar servicios y horarios desde tu panel.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
                className="h-11 rounded-lg px-5 font-bold active:scale-[0.98]"
              >
                Entrar al panel
                <ArrowRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/reservar/${negocioCreado?.slug ?? slug}`, "_blank", "noopener,noreferrer")}
                className="h-11 rounded-lg px-5 active:scale-[0.98]"
              >
                Ver enlace público
                <ExternalLink className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
