import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { filtrarYPaginarNegocios, type NegociosFiltro } from "@/lib/admin/negocios-table";
import { NegociosFiltros } from "@/components/admin/negocios/negocios-filtros";
import { NegociosTabla } from "@/components/admin/negocios/negocios-tabla";

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
      <div>
        <h1 className="text-xl font-bold tracking-tight">Negocios</h1>
        <p className="text-sm text-muted-foreground">
          {negocios.length} negocios registrados en la plataforma.
        </p>
      </div>

      <NegociosFiltros planes={planes.map((p) => ({ clave: p.clave, nombre: p.nombre }))} />

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
