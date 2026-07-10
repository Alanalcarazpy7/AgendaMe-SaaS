import Link from "next/link";
import { ChevronLeft, ChevronRight, DatabaseZap, FileClock } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerAuditoriaPaginada } from "@/lib/admin/queries/auditoria";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaHora } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { AuditoriaFiltros } from "@/components/admin/auditoria/auditoria-filtros";
import { AuditoriaDetalleDialog } from "@/components/admin/auditoria/auditoria-detalle-dialog";
import { AdminEmptyState, AdminMetricPill, AdminPageHeader, AdminTableShell } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    accion?: string;
    tabla?: string;
    desde?: string;
    hasta?: string;
    pagina?: string;
  }>;
};

export default async function AdminAuditoriaPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};

  const resultado = await obtenerAuditoriaPaginada({
    accion: params.accion,
    tabla: params.tabla,
    desde: params.desde,
    hasta: params.hasta,
    pagina: params.pagina ? Number(params.pagina) : 1,
    porPagina: 50,
  });

  function buildPageHref(pagina: number) {
    const usp = new URLSearchParams();
    if (params.accion) usp.set("accion", params.accion);
    if (params.tabla) usp.set("tabla", params.tabla);
    if (params.desde) usp.set("desde", params.desde);
    if (params.hasta) usp.set("hasta", params.hasta);
    if (pagina > 1) usp.set("pagina", String(pagina));
    const qs = usp.toString();
    return qs ? `/admin/auditoria?${qs}` : "/admin/auditoria";
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Trazabilidad"
        title="Auditoria"
        description="Registro solo lectura de acciones administrativas. Usalo para entender que cambio, cuando y desde donde."
        metrics={
          <>
            <AdminMetricPill label="Registros filtrados" value={formatearNumero(resultado.total)} icon={FileClock} />
            <AdminMetricPill label="Pagina actual" value={`${resultado.pagina}/${resultado.totalPaginas}`} icon={DatabaseZap} />
          </>
        }
      />

      <div className="rounded-[1.5rem] border border-border/75 bg-card/85 p-3 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:bg-card/75 dark:ring-white/5">
        <AuditoriaFiltros />
      </div>

      {resultado.filas.length === 0 ? (
        <AdminEmptyState title="Sin auditoria" description="No hay registros con estos filtros." />
      ) : (
        <AdminTableShell
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {formatearNumero(resultado.total)} registro{resultado.total === 1 ? "" : "s"} - pagina {resultado.pagina} de {resultado.totalPaginas}
              </p>
              <nav className="flex items-center gap-1" aria-label="Paginacion">
                <Link
                  href={buildPageHref(Math.max(1, resultado.pagina - 1))}
                  aria-disabled={resultado.pagina <= 1}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-2 font-bold ${
                    resultado.pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Anterior
                </Link>
                <Link
                  href={buildPageHref(Math.min(resultado.totalPaginas, resultado.pagina + 1))}
                  aria-disabled={resultado.pagina >= resultado.totalPaginas}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-2 font-bold ${
                    resultado.pagina >= resultado.totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"
                  }`}
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </nav>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Accion</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Tabla</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultado.filas.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/35">
                  <TableCell className="text-xs">{formatearFechaHora(r.created_at)}</TableCell>
                  <TableCell className="text-xs font-bold">{r.accion}</TableCell>
                  <TableCell className="max-w-40 truncate text-xs">{r.negocios?.nombre ?? "-"}</TableCell>
                  <TableCell className="text-xs">{r.tabla_afectada ?? "-"}</TableCell>
                  <TableCell className="text-xs">{r.origen ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <AuditoriaDetalleDialog registro={r} />
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
