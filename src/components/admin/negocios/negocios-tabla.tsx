import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { NegocioResumenRow } from "@/lib/admin/types/negocio";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { AdminEmptyState } from "@/components/admin/admin-ui";

type Props = {
  filas: NegocioResumenRow[];
  pagina: number;
  totalPaginas: number;
  total: number;
  buildPageHref: (pagina: number) => string;
};

function badgeEstado(estado: string) {
  if (estado === "activo") return <Badge variant="default">Activo</Badge>;
  if (estado === "bloqueado") return <Badge variant="destructive">Bloqueado</Badge>;
  return <Badge variant="outline">{estado}</Badge>;
}

function badgeVencimiento(dias: number | null) {
  if (dias === null) return <span className="text-muted-foreground">-</span>;
  if (dias < 0) return <Badge variant="destructive">Vencida ({Math.abs(dias)}d)</Badge>;
  if (dias <= 7) return <Badge variant="destructive">{dias}d</Badge>;
  if (dias <= 30) return <Badge variant="secondary">{dias}d</Badge>;
  return <span>{dias}d</span>;
}

function usoLimite(usado: number | null | undefined, limite: number | null | undefined) {
  const u = usado ?? 0;
  if (limite === null || limite === undefined) return `${formatearNumero(u)} / sin limite`;
  const sobreLimite = u > limite;
  return (
    <span className={sobreLimite ? "font-semibold text-destructive" : undefined}>
      {formatearNumero(u)} / {formatearNumero(limite)}
    </span>
  );
}

export function NegociosTabla({ filas, pagina, totalPaginas, total, buildPageHref }: Props) {
  if (filas.length === 0) {
    return (
      <AdminEmptyState
        title="Sin resultados"
        description="No hay negocios que coincidan con los filtros aplicados. Proba ajustar la busqueda o limpiar filtros."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:ring-white/5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Citas/mes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((n) => (
                <TableRow key={n.negocio_id} className="hover:bg-muted/35">
                  <TableCell className="max-w-52">
                    <p className="truncate font-semibold">{n.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.slug ?? "-"}</p>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <p className="truncate text-xs">{n.email ?? "-"}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.telefono ?? "-"}</p>
                  </TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(n.created_at)}</TableCell>
                  <TableCell>{badgeEstado(n.estado)}</TableCell>
                  <TableCell className="text-xs font-semibold">{n.plan_nombre ?? "Sin plan"}</TableCell>
                  <TableCell className="text-xs">{badgeVencimiento(n.dias_para_vencer)}</TableCell>
                  <TableCell className="text-xs">{usoLimite(n.citas_usadas_mes_actual, n.limite_citas_mensuales)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/negocios/${n.negocio_id}`}
                      className="inline-flex h-8 items-center rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      Ver detalle
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {formatearNumero(total)} negocio{total === 1 ? "" : "s"} - pagina {pagina} de {totalPaginas}
        </p>

        <nav className="flex items-center gap-1" aria-label="Paginacion">
          <Link
            href={buildPageHref(Math.max(1, pagina - 1))}
            aria-disabled={pagina <= 1}
            className={`flex h-9 items-center gap-1 rounded-xl border px-3 font-semibold ${
              pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Anterior
          </Link>
          <Link
            href={buildPageHref(Math.min(totalPaginas, pagina + 1))}
            aria-disabled={pagina >= totalPaginas}
            className={`flex h-9 items-center gap-1 rounded-xl border px-3 font-semibold ${
              pagina >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"
            }`}
          >
            Siguiente
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </div>
  );
}
