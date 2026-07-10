import Link from "next/link";
import { Wallet, CheckCircle2, XCircle, Clock3, Download } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerTodosPagos } from "@/lib/admin/queries/pagos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { AprobarPagoDialog, RechazarPagoDialog } from "@/components/admin/pagos/pago-acciones";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EstadoFiltro = "todos" | "pendiente" | "aprobado" | "rechazado";

function badgeEstadoPago(estado: string) {
  if (estado === "aprobado") return <Badge variant="default">Aprobado</Badge>;
  if (estado === "rechazado") return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

type PageProps = {
  searchParams?: Promise<{ estado?: string; q?: string }>;
};

export default async function AdminPagosPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const estadoFiltro = (["pendiente", "aprobado", "rechazado"].includes(params.estado ?? "")
    ? params.estado
    : "todos") as EstadoFiltro;
  const q = (params.q ?? "").trim().toLowerCase();

  const pagos = await obtenerTodosPagos(500);

  const pendientes = pagos.filter((p) => p.estado === "pendiente");
  const aprobados = pagos.filter((p) => p.estado === "aprobado");
  const cobradoTotal = aprobados.reduce((acc, p) => acc + p.monto_gs, 0);
  const ticketPromedio = aprobados.length > 0 ? Math.round(cobradoTotal / aprobados.length) : 0;

  let filas = pagos;
  if (estadoFiltro !== "todos") filas = filas.filter((p) => p.estado === estadoFiltro);
  if (q) {
    filas = filas.filter(
      (p) =>
        (p.negocios?.nombre ?? "").toLowerCase().includes(q) ||
        (p.metodo ?? "").toLowerCase().includes(q) ||
        (p.planes_saas?.nombre ?? "").toLowerCase().includes(q)
    );
  }

  const tabs: { key: EstadoFiltro; label: string; cantidad: number }[] = [
    { key: "todos", label: "Todos", cantidad: pagos.length },
    { key: "pendiente", label: "Pendientes", cantidad: pendientes.length },
    { key: "aprobado", label: "Aprobados", cantidad: aprobados.length },
    { key: "rechazado", label: "Rechazados", cantidad: pagos.filter((p) => p.estado === "rechazado").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pagos</h1>
          <p className="text-sm text-muted-foreground">Pagos manuales de todos los negocios (últimos {pagos.length}).</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/pagos/exportar${estadoFiltro !== "todos" ? `?estado=${estadoFiltro}` : ""}`}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar
          </a>
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Cobrado (aprobados)" value={formatearGuaranies(cobradoTotal)} icon={Wallet} tone="success" />
        <KpiCard label="Ticket promedio" value={formatearGuaranies(ticketPromedio)} icon={CheckCircle2} />
        <KpiCard
          label="Pendientes"
          value={formatearNumero(pendientes.length)}
          icon={Clock3}
          tone={pendientes.length > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Rechazados"
          value={formatearNumero(pagos.filter((p) => p.estado === "rechazado").length)}
          icon={XCircle}
        />
      </section>

      <nav className="flex flex-wrap gap-2" aria-label="Filtro de pagos">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "todos" ? "/admin/pagos" : `/admin/pagos?estado=${t.key}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              estadoFiltro === t.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {t.label} ({t.cantidad})
          </Link>
        ))}
      </nav>

      {filas.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          No hay pagos que coincidan con este filtro.
        </div>
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell className="max-w-40 truncate">
                    <Link href={`/admin/negocios/${pago.negocio_id}`} className="font-medium hover:underline">
                      {pago.negocios?.nombre ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{pago.planes_saas?.nombre ?? "—"}</TableCell>
                  <TableCell className="text-xs font-medium">{formatearGuaranies(pago.monto_gs)}</TableCell>
                  <TableCell className="text-xs">{pago.metodo ?? "—"}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(pago.fecha_pago ?? pago.created_at)}</TableCell>
                  <TableCell>{badgeEstadoPago(pago.estado)}</TableCell>
                  <TableCell className="text-right">
                    {pago.estado === "pendiente" ? (
                      <div className="flex justify-end gap-2">
                        <AprobarPagoDialog pago={{ id: pago.id, negocioId: pago.negocio_id, negocioNombre: pago.negocios?.nombre }} />
                        <RechazarPagoDialog pago={{ id: pago.id, negocioId: pago.negocio_id, negocioNombre: pago.negocios?.nombre }} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {pago.estado === "aprobado" ? formatearFechaCorta(pago.aprobado_at) : formatearFechaCorta(pago.rechazado_at)}
                      </span>
                    )}
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
