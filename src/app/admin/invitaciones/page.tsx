import Link from "next/link";
import { MailCheck, MailWarning, Send, TimerOff } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerInvitaciones, estadoEfectivoInvitacion } from "@/lib/admin/queries/invitaciones";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { InvitacionRevocarBoton } from "@/components/admin/invitaciones/invitacion-revocar-boton";
import { AdminEmptyState, AdminMetricPill, AdminPageHeader, AdminTableShell } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function badgeEstado(estado: string) {
  if (estado === "pendiente") return <Badge variant="secondary">Pendiente</Badge>;
  if (estado === "aceptada") return <Badge>Aceptada</Badge>;
  if (estado === "revocada") return <Badge variant="outline">Revocada</Badge>;
  if (estado === "expirada") return <Badge variant="destructive">Expirada</Badge>;
  return <Badge variant="outline">{estado}</Badge>;
}

type PageProps = {
  searchParams?: Promise<{ estado?: string; pagina?: string }>;
};

function buildHref(estado: string, pagina?: number) {
  const usp = new URLSearchParams();
  if (estado) usp.set("estado", estado);
  if (pagina && pagina > 1) usp.set("pagina", String(pagina));
  const qs = usp.toString();
  return qs ? `/admin/invitaciones?${qs}` : "/admin/invitaciones";
}

export default async function AdminInvitacionesPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const paginaActual = Math.max(1, Number(params.pagina ?? 1) || 1);
  const porPagina = 25;

  const invitaciones = await obtenerInvitaciones(500);
  const conEstadoEfectivo = invitaciones.map((inv) => ({ ...inv, estadoEfectivo: estadoEfectivoInvitacion(inv) }));

  const filtroEstado = params.estado ?? "";
  const filtradas = filtroEstado ? conEstadoEfectivo.filter((i) => i.estadoEfectivo === filtroEstado) : conEstadoEfectivo;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const pagina = Math.min(paginaActual, totalPaginas);
  const filas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const tabs = [
    { key: "", label: "Todas", cantidad: conEstadoEfectivo.length },
    { key: "pendiente", label: "Pendientes", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "pendiente").length },
    { key: "aceptada", label: "Aceptadas", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "aceptada").length },
    { key: "expirada", label: "Expiradas", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "expirada").length },
    { key: "revocada", label: "Revocadas", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "revocada").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Accesos enviados"
        title="Invitaciones"
        description="Control de invitaciones a sucursales. No se muestran tokens ni enlaces sensibles."
        metrics={
          <>
            <AdminMetricPill label="Enviadas" value={formatearNumero(conEstadoEfectivo.length)} icon={Send} />
            <AdminMetricPill label="Pendientes" value={formatearNumero(tabs[1].cantidad)} icon={MailWarning} tone={tabs[1].cantidad > 0 ? "warning" : "default"} />
            <AdminMetricPill label="Aceptadas" value={formatearNumero(tabs[2].cantidad)} icon={MailCheck} tone="success" />
            <AdminMetricPill label="Expiradas" value={formatearNumero(tabs[3].cantidad)} icon={TimerOff} tone={tabs[3].cantidad > 0 ? "danger" : "default"} />
          </>
        }
      />

      <nav className="flex flex-wrap gap-2 rounded-[1.5rem] border border-border/75 bg-card/85 p-3 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:bg-card/75 dark:ring-white/5" aria-label="Filtro de invitaciones">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={buildHref(t.key)}
            className={`inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-bold transition ${
              filtroEstado === t.key
                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-border/80 bg-background/70 hover:bg-muted"
            }`}
          >
            {t.label} ({t.cantidad})
          </Link>
        ))}
      </nav>

      {filas.length === 0 ? (
        <AdminEmptyState title="Sin invitaciones" description="No hay invitaciones en este filtro." />
      ) : (
        <AdminTableShell
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {formatearNumero(filtradas.length)} invitacion{filtradas.length === 1 ? "" : "es"} - pagina {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref(filtroEstado, pagina - 1)}>
                  Anterior
                </Link>
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref(filtroEstado, pagina + 1)}>
                  Siguiente
                </Link>
              </div>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Negocio / Sucursal</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviada</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/35">
                  <TableCell className="max-w-52 truncate text-xs font-bold">{inv.email}</TableCell>
                  <TableCell className="max-w-56 truncate text-xs">
                    {inv.negocios?.nombre ?? "-"} / {inv.sucursales?.nombre ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs">{inv.rol}</TableCell>
                  <TableCell>{badgeEstado(inv.estadoEfectivo)}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(inv.created_at)}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(inv.expires_at)}</TableCell>
                  <TableCell className="text-right">
                    {inv.estadoEfectivo === "pendiente" ? (
                      <InvitacionRevocarBoton invitacionId={inv.id} />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
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
