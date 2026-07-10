import Link from "next/link";
import { CalendarClock, CheckCircle2, InfinityIcon, ShieldAlert } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import type { NegocioResumenRow } from "@/lib/admin/types/negocio";
import { AdminEmptyState, AdminMetricPill, AdminPageHeader, AdminTableShell } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Vista = "activas" | "vencen7" | "vencen15" | "vencen30" | "vencidas" | "sin_vencimiento" | "todas";

const VISTAS: { key: Vista; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "activas", label: "Activas" },
  { key: "vencen7", label: "7 dias" },
  { key: "vencen15", label: "15 dias" },
  { key: "vencen30", label: "30 dias" },
  { key: "vencidas", label: "Vencidas" },
  { key: "sin_vencimiento", label: "Sin vencimiento" },
];

function filtrarPorVista(negocios: NegocioResumenRow[], vista: Vista): NegocioResumenRow[] {
  switch (vista) {
    case "activas":
      return negocios.filter((n) => n.suscripcion_estado === "activa");
    case "vencen7":
      return negocios.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 7);
    case "vencen15":
      return negocios.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 15);
    case "vencen30":
      return negocios.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 30);
    case "vencidas":
      return negocios.filter(
        (n) => n.suscripcion_estado === "vencida" || (typeof n.dias_para_vencer === "number" && n.dias_para_vencer < 0)
      );
    case "sin_vencimiento":
      return negocios.filter((n) => !n.fecha_vencimiento);
    default:
      return negocios;
  }
}

function badgeEstado(n: NegocioResumenRow) {
  if (n.suscripcion_estado === "activa" && typeof n.dias_para_vencer === "number" && n.dias_para_vencer < 0) {
    return <Badge variant="destructive">Vencida por marcar</Badge>;
  }
  if (n.suscripcion_estado === "activa") return <Badge>Activa</Badge>;
  if (n.suscripcion_estado === "vencida") return <Badge variant="destructive">Vencida</Badge>;
  return <Badge variant="outline">{n.suscripcion_estado ?? "Sin suscripcion"}</Badge>;
}

type PageProps = {
  searchParams?: Promise<{ vista?: string; pagina?: string }>;
};

function buildHref(vista: Vista, pagina?: number) {
  const usp = new URLSearchParams();
  if (vista !== "todas") usp.set("vista", vista);
  if (pagina && pagina > 1) usp.set("pagina", String(pagina));
  const qs = usp.toString();
  return qs ? `/admin/suscripciones?${qs}` : "/admin/suscripciones";
}

export default async function AdminSuscripcionesPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const vista = (VISTAS.some((v) => v.key === params.vista) ? params.vista : "todas") as Vista;
  const paginaActual = Math.max(1, Number(params.pagina ?? 1) || 1);
  const porPagina = 25;

  const negocios = await obtenerNegociosResumen();
  const vencidas = filtrarPorVista(negocios, "vencidas").length;
  const vencen7 = filtrarPorVista(negocios, "vencen7").length;
  const sinVencimiento = filtrarPorVista(negocios, "sin_vencimiento").length;

  const filtradas = filtrarPorVista(negocios, vista).sort((a, b) => {
    const da = a.dias_para_vencer ?? Number.POSITIVE_INFINITY;
    const db = b.dias_para_vencer ?? Number.POSITIVE_INFINITY;
    return da - db;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const pagina = Math.min(paginaActual, totalPaginas);
  const filas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Ciclos activos"
        title="Suscripciones"
        description="Controla vencimientos, estados y pagos recientes por negocio sin revisar cada detalle uno por uno."
        metrics={
          <>
            <AdminMetricPill label="Todas" value={formatearNumero(negocios.length)} icon={CalendarClock} />
            <AdminMetricPill label="Activas" value={formatearNumero(filtrarPorVista(negocios, "activas").length)} icon={CheckCircle2} tone="success" />
            <AdminMetricPill label="Vencen en 7 dias" value={formatearNumero(vencen7)} icon={ShieldAlert} tone={vencen7 > 0 ? "warning" : "default"} />
            <AdminMetricPill label="Vencidas" value={formatearNumero(vencidas)} icon={ShieldAlert} tone={vencidas > 0 ? "danger" : "default"} />
            <AdminMetricPill label="Sin vencimiento" value={formatearNumero(sinVencimiento)} icon={InfinityIcon} />
          </>
        }
      />

      <nav className="flex flex-wrap gap-2 rounded-[1.5rem] border border-border/75 bg-card/85 p-3 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:bg-card/75 dark:ring-white/5" aria-label="Filtro de suscripciones">
        {VISTAS.map((v) => {
          const cantidad = v.key === "todas" ? negocios.length : filtrarPorVista(negocios, v.key).length;
          const activo = vista === v.key;
          return (
            <Link
              key={v.key}
              href={buildHref(v.key)}
              className={`inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-bold transition ${
                activo
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-border/80 bg-background/70 hover:bg-muted"
              }`}
            >
              {v.label} ({cantidad})
            </Link>
          );
        })}
      </nav>

      {filas.length === 0 ? (
        <AdminEmptyState title="Sin suscripciones" description="No hay negocios en esta vista." />
      ) : (
        <AdminTableShell
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {formatearNumero(filtradas.length)} registro{filtradas.length === 1 ? "" : "s"} - pagina {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref(vista, pagina - 1)}>
                  Anterior
                </Link>
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref(vista, pagina + 1)}>
                  Siguiente
                </Link>
              </div>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ultimo pago</TableHead>
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((n) => (
                <TableRow key={n.negocio_id} className="hover:bg-muted/35">
                  <TableCell className="max-w-48 truncate font-bold">{n.nombre}</TableCell>
                  <TableCell className="text-xs">{n.plan_nombre ?? "Sin plan"}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(n.fecha_inicio)}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(n.fecha_vencimiento)}</TableCell>
                  <TableCell className="text-xs">{n.dias_para_vencer ?? "-"}</TableCell>
                  <TableCell>{badgeEstado(n)}</TableCell>
                  <TableCell className="text-xs">
                    {n.ultimo_pago_estado ?? "-"} / {formatearFechaCorta(n.ultimo_pago_fecha)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/negocios/${n.negocio_id}`}
                      className="inline-flex h-8 items-center rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                    >
                      Gestionar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      )}
    </div>
  );
}
