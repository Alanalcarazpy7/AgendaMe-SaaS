import { Ban, Building2, CalendarClock, Filter, Sparkles } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { filtrarYPaginarNegocios, type NegociosFiltro } from "@/lib/admin/negocios-table";
import { NegociosFiltros } from "@/components/admin/negocios/negocios-filtros";
import { NegociosTabla } from "@/components/admin/negocios/negocios-tabla";
import { AdminMetricPill, AdminPageHeader } from "@/components/admin/admin-ui";
import { formatearNumero } from "@/lib/admin/formatters/currency";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    plan?: string;
    estado?: string;
    vencimiento?: string;
    orden?: string;
    pagina?: string;
  }>;
};

export default async function AdminNegociosPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};

  const [negocios, planes] = await Promise.all([obtenerNegociosResumen(), obtenerPlanes()]);

  const filtro: NegociosFiltro = {
    q: params.q,
    plan: params.plan,
    estado: params.estado,
    vencimiento: (params.vencimiento as NegociosFiltro["vencimiento"]) ?? "",
    orden: (params.orden as NegociosFiltro["orden"]) ?? "recientes",
    pagina: params.pagina ? Number(params.pagina) : 1,
    porPagina: 20,
  };

  const resultado = filtrarYPaginarNegocios(negocios, filtro);
  const activos = negocios.filter((n) => n.estado === "activo").length;
  const bloqueados = negocios.filter((n) => n.estado === "bloqueado").length;
  const vencen30 = negocios.filter(
    (n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 30
  ).length;

  function buildPageHref(pagina: number) {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.plan) usp.set("plan", params.plan);
    if (params.estado) usp.set("estado", params.estado);
    if (params.vencimiento) usp.set("vencimiento", params.vencimiento);
    if (params.orden) usp.set("orden", params.orden);
    if (pagina > 1) usp.set("pagina", String(pagina));
    const qs = usp.toString();
    return qs ? `/admin/negocios?${qs}` : "/admin/negocios";
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Gestion comercial"
        title="Negocios"
        description="Busca, filtra y entra al detalle de cada negocio sin navegar de mas. La tabla esta preparada para muchos registros con paginacion."
        metrics={
          <>
            <AdminMetricPill label="Registrados" value={formatearNumero(negocios.length)} icon={Building2} />
            <AdminMetricPill label="Activos" value={formatearNumero(activos)} icon={Sparkles} tone="success" />
            <AdminMetricPill
              label="Bloqueados"
              value={formatearNumero(bloqueados)}
              icon={Ban}
              tone={bloqueados > 0 ? "danger" : "default"}
            />
            <AdminMetricPill
              label="Vencen en 30 dias"
              value={formatearNumero(vencen30)}
              icon={CalendarClock}
              tone={vencen30 > 0 ? "warning" : "default"}
            />
          </>
        }
      />

      <NegociosFiltros planes={planes.map((p) => ({ clave: p.clave, nombre: p.nombre }))} />

      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
        Mostrando {formatearNumero(resultado.total)} resultado{resultado.total === 1 ? "" : "s"} con los filtros actuales.
      </div>

      <NegociosTabla
        filas={resultado.filas}
        pagina={resultado.pagina}
        totalPaginas={resultado.totalPaginas}
        total={resultado.total}
        buildPageHref={buildPageHref}
      />
    </div>
  );
}
