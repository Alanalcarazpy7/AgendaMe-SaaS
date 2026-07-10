import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerAuditoriaPaginada } from "@/lib/admin/queries/auditoria";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaHora } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { AuditoriaFiltros } from "@/components/admin/auditoria/auditoria-filtros";
import { AuditoriaDetalleDialog } from "@/components/admin/auditoria/auditoria-detalle-dialog";

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
      <div>
        <h1 className="text-xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Solo lectura. Registro de acciones administrativas sobre la plataforma.
        </p>
      </div>

      <AuditoriaFiltros />

      {resultado.filas.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          No hay registros de auditoría con estos filtros.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.filas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{formatearFechaHora(r.created_at)}</TableCell>
                    <TableCell className="text-xs font-medium">{r.accion}</TableCell>
                    <TableCell className="max-w-40 truncate text-xs">{r.negocios?.nombre ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.tabla_afectada ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.origen ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <AuditoriaDetalleDialog registro={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>
              {formatearNumero(resultado.total)} registro{resultado.total === 1 ? "" : "s"} · página{" "}
              {resultado.pagina} de {resultado.totalPaginas}
            </p>
            <nav className="flex items-center gap-1" aria-label="Paginación">
              <Link
                href={buildPageHref(Math.max(1, resultado.pagina - 1))}
                aria-disabled={resultado.pagina <= 1}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                  resultado.pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Anterior
              </Link>
              <Link
                href={buildPageHref(Math.min(resultado.totalPaginas, resultado.pagina + 1))}
                aria-disabled={resultado.pagina >= resultado.totalPaginas}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                  resultado.pagina >= resultado.totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"
                }`}
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
