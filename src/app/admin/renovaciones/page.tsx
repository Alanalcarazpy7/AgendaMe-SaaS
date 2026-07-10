import Link from "next/link";
import { AlertTriangle, Ban, CalendarClock } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminTableShell } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRenovacionesPage() {
  await requirePlatformOwner();

  const negocios = await obtenerNegociosResumen();

  const vencidas = negocios.filter(
    (n) => n.suscripcion_estado === "activa" && typeof n.dias_para_vencer === "number" && n.dias_para_vencer < 0
  );
  const proximas30 = negocios
    .filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 30)
    .sort((a, b) => (a.dias_para_vencer ?? 0) - (b.dias_para_vencer ?? 0));
  const proximas7 = proximas30.filter((n) => (n.dias_para_vencer ?? 99) <= 7);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Agenda comercial"
        title="Renovaciones"
        description="Negocios que necesitan seguimiento por vencimiento cercano o suscripcion vencida pendiente de marcar."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Vencen en 7 dias" value={formatearNumero(proximas7.length)} icon={AlertTriangle} tone={proximas7.length > 0 ? "warning" : "default"} />
        <KpiCard label="Vencen en 30 dias" value={formatearNumero(proximas30.length)} icon={CalendarClock} tone={proximas30.length > 0 ? "warning" : "default"} />
        <KpiCard label="Vencidas por marcar" value={formatearNumero(vencidas.length)} icon={Ban} tone={vencidas.length > 0 ? "danger" : "default"} />
      </section>

      <AdminPanel title="Proximos 30 dias" description="Ordenado por urgencia para actuar primero donde queda menos tiempo.">
        {proximas30.length === 0 ? (
          <AdminEmptyState title="Sin vencimientos proximos" description="No hay vencimientos en los proximos 30 dias." />
        ) : (
          <AdminTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Dias restantes</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximas30.map((n) => (
                  <TableRow key={n.negocio_id} className="hover:bg-muted/35">
                    <TableCell className="max-w-48 truncate font-bold">{n.nombre}</TableCell>
                    <TableCell className="text-xs">{n.plan_nombre ?? "Sin plan"}</TableCell>
                    <TableCell className="text-xs">{formatearFechaCorta(n.fecha_vencimiento)}</TableCell>
                    <TableCell>
                      <Badge variant={(n.dias_para_vencer ?? 99) <= 7 ? "destructive" : "secondary"}>
                        {n.dias_para_vencer}d
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/negocios/${n.negocio_id}`}
                        className="inline-flex h-8 items-center rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        Renovar
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableShell>
        )}
      </AdminPanel>

      <AdminPanel
        title="Vencidas"
        description="Casos donde el vencimiento ya paso pero la base aun figura activa. Gestiona cada caso desde el detalle."
      >
        {vencidas.length === 0 ? (
          <AdminEmptyState title="Sin vencidas pendientes" description="No hay suscripciones vencidas pendientes de revisar." />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {vencidas.map((n) => (
              <li key={n.negocio_id} className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-bold">{n.nombre}</span>
                  <Badge variant="destructive">Vencida</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Vencio el {formatearFechaCorta(n.fecha_vencimiento)}</p>
                <Link href={`/admin/negocios/${n.negocio_id}`} className="mt-3 inline-flex text-xs font-bold text-primary hover:underline">
                  Gestionar detalle
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
