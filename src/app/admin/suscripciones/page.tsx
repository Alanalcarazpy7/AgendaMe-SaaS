import Link from "next/link";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import type { NegocioResumenRow } from "@/lib/admin/types/negocio";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Vista = "activas" | "vencen7" | "vencen15" | "vencen30" | "vencidas" | "sin_vencimiento" | "todas";

const VISTAS: { key: Vista; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "activas", label: "Activas" },
  { key: "vencen7", label: "Vencen en 7 días" },
  { key: "vencen15", label: "Vencen en 15 días" },
  { key: "vencen30", label: "Vencen en 30 días" },
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
    return <Badge variant="destructive">Vencida (pendiente de marcar)</Badge>;
  }
  if (n.suscripcion_estado === "activa") return <Badge variant="default">Activa</Badge>;
  if (n.suscripcion_estado === "vencida") return <Badge variant="destructive">Vencida</Badge>;
  return <Badge variant="outline">{n.suscripcion_estado ?? "Sin suscripción"}</Badge>;
}

type PageProps = {
  searchParams?: Promise<{ vista?: string }>;
};

export default async function AdminSuscripcionesPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const vista = (VISTAS.some((v) => v.key === params.vista) ? params.vista : "todas") as Vista;

  const negocios = await obtenerNegociosResumen();
  const filas = filtrarPorVista(negocios, vista).sort((a, b) => {
    const da = a.dias_para_vencer ?? Number.POSITIVE_INFINITY;
    const db = b.dias_para_vencer ?? Number.POSITIVE_INFINITY;
    return da - db;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Suscripciones</h1>
        <p className="text-sm text-muted-foreground">Estado de suscripción por negocio, según el ciclo vigente.</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filtro de suscripciones">
        {VISTAS.map((v) => {
          const cantidad = v.key === "todas" ? negocios.length : filtrarPorVista(negocios, v.key).length;
          const activo = vista === v.key;
          return (
            <Link
              key={v.key}
              href={v.key === "todas" ? "/admin/suscripciones" : `/admin/suscripciones?vista=${v.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activo ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {v.label} ({cantidad})
            </Link>
          );
        })}
      </nav>

      {filas.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          No hay negocios en esta vista.
        </div>
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Días restantes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último pago</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((n) => (
                <TableRow key={n.negocio_id}>
                  <TableCell className="max-w-48 truncate font-medium">{n.nombre}</TableCell>
                  <TableCell className="text-xs">{n.plan_nombre ?? "Sin plan"}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(n.fecha_inicio)}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(n.fecha_vencimiento)}</TableCell>
                  <TableCell className="text-xs">{n.dias_para_vencer ?? "—"}</TableCell>
                  <TableCell>{badgeEstado(n)}</TableCell>
                  <TableCell className="text-xs">
                    {n.ultimo_pago_estado ?? "—"} · {formatearFechaCorta(n.ultimo_pago_fecha)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/negocios/${n.negocio_id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Gestionar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
