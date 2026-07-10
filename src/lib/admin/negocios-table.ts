import type { NegocioResumenRow } from "@/lib/admin/types/negocio";

export type NegociosFiltro = {
  q?: string;
  plan?: string;
  estado?: string;
  vencimiento?: "7" | "15" | "30" | "vencidas" | "";
  orden?: "recientes" | "nombre" | "vencimiento";
  pagina?: number;
  porPagina?: number;
};

export type NegociosFiltradosResult = {
  filas: NegocioResumenRow[];
  total: number;
  totalPaginas: number;
  pagina: number;
  porPagina: number;
};

export function aplicarFiltrosNegocios(negocios: NegocioResumenRow[], filtro: NegociosFiltro): NegocioResumenRow[] {
  let filas = negocios;

  if (filtro.q) {
    const q = filtro.q.trim().toLowerCase();
    filas = filas.filter(
      (n) =>
        n.nombre.toLowerCase().includes(q) ||
        (n.email ?? "").toLowerCase().includes(q) ||
        (n.slug ?? "").toLowerCase().includes(q) ||
        (n.telefono ?? "").toLowerCase().includes(q)
    );
  }

  if (filtro.plan) {
    filas = filas.filter((n) => n.plan_clave === filtro.plan);
  }

  if (filtro.estado) {
    filas = filas.filter((n) => n.estado === filtro.estado);
  }

  if (filtro.vencimiento === "7") {
    filas = filas.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 7);
  } else if (filtro.vencimiento === "15") {
    filas = filas.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 15);
  } else if (filtro.vencimiento === "30") {
    filas = filas.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 30);
  } else if (filtro.vencimiento === "vencidas") {
    filas = filas.filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer < 0);
  }

  const orden = filtro.orden ?? "recientes";

  return [...filas].sort((a, b) => {
    if (orden === "nombre") return a.nombre.localeCompare(b.nombre, "es");
    if (orden === "vencimiento") {
      const da = a.dias_para_vencer ?? Number.POSITIVE_INFINITY;
      const db = b.dias_para_vencer ?? Number.POSITIVE_INFINITY;
      return da - db;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function paginar<T>(filas: T[], pagina = 1, porPagina = 20): { filas: T[]; total: number; totalPaginas: number; pagina: number; porPagina: number } {
  const total = filas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaSegura = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaSegura - 1) * porPagina;

  return {
    filas: filas.slice(inicio, inicio + porPagina),
    total,
    totalPaginas,
    pagina: paginaSegura,
    porPagina,
  };
}

export function filtrarYPaginarNegocios(negocios: NegocioResumenRow[], filtro: NegociosFiltro): NegociosFiltradosResult {
  const filtradas = aplicarFiltrosNegocios(negocios, filtro);
  return paginar(filtradas, filtro.pagina, filtro.porPagina ?? 20);
}
