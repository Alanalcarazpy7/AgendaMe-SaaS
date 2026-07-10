import Link from "next/link";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { CalendarClock, AlertTriangle, Ban } from "lucide-react";

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
      <div>
        <h1 className="text-xl font-bold tracking-tight">Renovaciones</h1>
        <p className="text-sm text-muted-foreground">
          Negocios que necesitan atención por vencimiento próximo o ya vencido.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Vencen en 7 días"
          value={formatearNumero(proximas7.length)}
          icon={AlertTriangle}
          tone={proximas7.length > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Vencen en 30 días"
          value={formatearNumero(proximas30.length)}
          icon={CalendarClock}
          tone={proximas30.length > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Vencidas (pendientes de marcar)"
          value={formatearNumero(vencidas.length)}
          icon={Ban}
          tone={vencidas.length > 0 ? "danger" : "default"}
        />
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Próximos 30 días</h2>
        {proximas30.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No hay vencimientos en los próximos 30 días.</p>
        ) : (
          <div className="mt-3 rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Días restantes</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximas30.map((n) => (
                  <TableRow key={n.negocio_id}>
                    <TableCell className="max-w-48 truncate font-medium">{n.nombre}</TableCell>
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
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Renovar / extender
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Vencidas</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Suscripciones marcadas &quot;activa&quot; en base cuyo vencimiento ya pasó. No se ejecuta
          marcar_suscripciones_vencidas() automáticamente: gestioná cada caso desde el detalle del negocio.
        </p>
        {vencidas.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No hay suscripciones vencidas pendientes.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {vencidas.map((n) => (
              <li key={n.negocio_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <span className="font-medium">{n.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  Venció el {formatearFechaCorta(n.fecha_vencimiento)}
                </span>
                <Link href={`/admin/negocios/${n.negocio_id}`} className="text-xs font-medium text-primary hover:underline">
                  Gestionar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
