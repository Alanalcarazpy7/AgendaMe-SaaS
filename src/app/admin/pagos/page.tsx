import Link from "next/link";
import { CheckCircle2, Clock3, Download, ReceiptText, Wallet, XCircle } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerTodosPagos } from "@/lib/admin/queries/pagos";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { AprobarPagoDialog, RechazarPagoDialog } from "@/components/admin/pagos/pago-acciones";
import { PagoComprobanteDialog } from "@/components/admin/pagos/pago-comprobante-dialog";
import { PagosBuscador } from "@/components/admin/pagos/pagos-buscador";
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminTableShell } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EstadoFiltro = "todos" | "pendiente" | "aprobado" | "rechazado";

function badgeEstadoPago(estado: string) {
  if (estado === "aprobado") return <Badge>Aprobado</Badge>;
  if (estado === "rechazado") return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

type PageProps = {
  searchParams?: Promise<{ estado?: string; q?: string; pagina?: string }>;
};

function buildHref(params: { estado?: string; q?: string }, pagina?: number) {
  const usp = new URLSearchParams();
  if (params.estado && params.estado !== "todos") usp.set("estado", params.estado);
  if (params.q) usp.set("q", params.q);
  if (pagina && pagina > 1) usp.set("pagina", String(pagina));
  const qs = usp.toString();
  return qs ? `/admin/pagos?${qs}` : "/admin/pagos";
}

export default async function AdminPagosPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const estadoFiltro = (["pendiente", "aprobado", "rechazado"].includes(params.estado ?? "")
    ? params.estado
    : "todos") as EstadoFiltro;
  const q = (params.q ?? "").trim().toLowerCase();
  const paginaActual = Math.max(1, Number(params.pagina ?? 1) || 1);
  const porPagina = 25;

  const [pagos, negocios] = await Promise.all([obtenerTodosPagos(500), obtenerNegociosResumen()]);
  const vencimientoPorNegocio = new Map(negocios.map((n) => [n.negocio_id, n.fecha_vencimiento]));

  const pendientes = pagos.filter((p) => p.estado === "pendiente");
  const aprobados = pagos.filter((p) => p.estado === "aprobado");
  const rechazados = pagos.filter((p) => p.estado === "rechazado");
  const cobradoTotal = aprobados.reduce((acc, p) => acc + p.monto_gs, 0);
  const ticketPromedio = aprobados.length > 0 ? Math.round(cobradoTotal / aprobados.length) : 0;

  let filtradas = pagos;
  if (estadoFiltro !== "todos") filtradas = filtradas.filter((p) => p.estado === estadoFiltro);
  if (q) {
    filtradas = filtradas.filter(
      (p) =>
        (p.negocios?.nombre ?? "").toLowerCase().includes(q) ||
        (p.metodo ?? "").toLowerCase().includes(q) ||
        (p.planes_saas?.nombre ?? "").toLowerCase().includes(q)
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const pagina = Math.min(paginaActual, totalPaginas);
  const filas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const tabs: { key: EstadoFiltro; label: string; cantidad: number }[] = [
    { key: "todos", label: "Todos", cantidad: pagos.length },
    { key: "pendiente", label: "Pendientes", cantidad: pendientes.length },
    { key: "aprobado", label: "Aprobados", cantidad: aprobados.length },
    { key: "rechazado", label: "Rechazados", cantidad: rechazados.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Caja y renovaciones"
        title="Pagos"
        description="Gestiona pagos manuales, aprobaciones y rechazos con contexto suficiente para no perder trazabilidad."
        actions={
          <Button asChild variant="outline" size="sm" className="h-10 rounded-2xl">
            <a href={`/api/admin/pagos/exportar${estadoFiltro !== "todos" ? `?estado=${estadoFiltro}` : ""}`}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Exportar
            </a>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Cobrado" value={formatearGuaranies(cobradoTotal)} icon={Wallet} tone="success" />
        <KpiCard label="Ticket promedio" value={formatearGuaranies(ticketPromedio)} icon={CheckCircle2} />
        <KpiCard label="Pendientes" value={formatearNumero(pendientes.length)} icon={Clock3} tone={pendientes.length > 0 ? "warning" : "default"} />
        <KpiCard label="Rechazados" value={formatearNumero(rechazados.length)} icon={XCircle} />
      </section>

      <AdminPanel
        title="Como funciona pagos"
        description="El panel trabaja con pagos manuales: transferencia, efectivo, tarjeta u otro cobro que vos confirmas."
        action={<ReceiptText className="h-5 w-5 text-primary" aria-hidden="true" />}
      >
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <p className="font-black">1. Registrar</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Lo podes cargar vos desde el negocio o recibirlo desde el dashboard del negocio con comprobante adjunto.
              Queda pendiente y no renueva todavia.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <p className="font-black">2. Aprobar</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Confirma el cobro y actualiza el vencimiento de la suscripcion con la fecha que indiques.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <p className="font-black">3. Rechazar</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Mantiene el historial, pero no modifica la suscripcion ni suma ingresos cobrados.
            </p>
          </div>
        </div>
      </AdminPanel>

      <div className="rounded-[1.5rem] border border-border/75 bg-card/85 p-3 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:bg-card/75 dark:ring-white/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap gap-2" aria-label="Filtro de pagos">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={buildHref({ estado: t.key, q: params.q })}
                className={`inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-bold transition ${
                  estadoFiltro === t.key
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border/80 bg-background/70 hover:bg-muted"
                }`}
              >
                {t.label} ({t.cantidad})
              </Link>
            ))}
          </nav>

          <PagosBuscador />
        </div>
      </div>

      {filas.length === 0 ? (
        <AdminEmptyState title="Sin pagos" description="No hay pagos que coincidan con el filtro actual." />
      ) : (
        <AdminTableShell
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {formatearNumero(filtradas.length)} pago{filtradas.length === 1 ? "" : "s"} - pagina {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref({ estado: estadoFiltro, q: params.q }, pagina - 1)}>
                  Anterior
                </Link>
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref({ estado: estadoFiltro, q: params.q }, pagina + 1)}>
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
                  <TableHead>Monto</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Observacion</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((pago) => (
                <TableRow key={pago.id} className="hover:bg-muted/35">
                  <TableCell className="max-w-44 truncate">
                    <Link href={`/admin/negocios/${pago.negocio_id}`} className="font-bold hover:text-primary">
                      {pago.negocios?.nombre ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{pago.planes_saas?.nombre ?? "-"}</TableCell>
                  <TableCell className="text-xs font-bold">{formatearGuaranies(pago.monto_gs)}</TableCell>
                  <TableCell className="text-xs">{pago.metodo ?? "-"}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(pago.fecha_pago ?? pago.created_at)}</TableCell>
                  <TableCell>{badgeEstadoPago(pago.estado)}</TableCell>
                  <TableCell className="max-w-64 text-xs text-muted-foreground">
                    {pago.estado === "rechazado" && pago.notas_admin ? (
                      <span className="font-semibold text-destructive">{pago.notas_admin}</span>
                    ) : pago.notas_cliente ? (
                      <span className="line-clamp-2">{pago.notas_cliente}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <PagoComprobanteDialog pagoId={pago.id} comprobanteUrl={pago.comprobante_url} />
                  </TableCell>
                  <TableCell className="text-right">
                    {pago.estado === "pendiente" ? (
                      <div className="flex justify-end gap-2">
                        <AprobarPagoDialog
                          pago={{
                            id: pago.id,
                            negocioId: pago.negocio_id,
                            negocioNombre: pago.negocios?.nombre,
                            fechaPago: pago.fecha_pago,
                            periodoFin: pago.periodo_fin,
                            cicloFacturacion: pago.ciclo_facturacion,
                            fechaVencimientoActual: vencimientoPorNegocio.get(pago.negocio_id),
                          }}
                        />
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
        </AdminTableShell>
      )}
    </div>
  );
}
