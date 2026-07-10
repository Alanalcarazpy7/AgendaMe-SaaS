import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, UserCheck, Users, UserX } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerUsuariosPlataforma } from "@/lib/admin/queries/usuarios";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta, formatearFechaHora } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { UsuariosFiltros } from "@/components/admin/usuarios/usuarios-filtros";
import type { UsuarioPlataforma } from "@/lib/admin/queries/usuarios";
import { AdminEmptyState, AdminMetricPill, AdminPageHeader, AdminTableShell } from "@/components/admin/admin-ui";
import { SincronizarPerfilButton } from "@/components/admin/usuarios/sincronizar-perfil-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{ q?: string; rol?: string; negocio?: string; pagina?: string }>;
};

function aplicarFiltros(usuarios: UsuarioPlataforma[], params: { q?: string; rol?: string; negocio?: string }) {
  let filas = usuarios;

  if (params.q) {
    const q = params.q.trim().toLowerCase();
    filas = filas.filter((u) => (u.email ?? "").toLowerCase().includes(q) || (u.nombre ?? "").toLowerCase().includes(q));
  }

  if (params.rol) filas = filas.filter((u) => u.rolGlobal === params.rol);

  if (params.negocio === "con") {
    filas = filas.filter((u) => u.negocios.length > 0 || u.sucursales.length > 0);
  } else if (params.negocio === "sin") {
    filas = filas.filter((u) => u.negocios.length === 0 && u.sucursales.length === 0);
  }

  return filas;
}

function buildHref(params: { q?: string; rol?: string; negocio?: string }, pagina: number) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.rol) usp.set("rol", params.rol);
  if (params.negocio) usp.set("negocio", params.negocio);
  if (pagina > 1) usp.set("pagina", String(pagina));
  const qs = usp.toString();
  return qs ? `/admin/usuarios?${qs}` : "/admin/usuarios";
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const paginaActual = Math.max(1, Number(params.pagina ?? 1) || 1);
  const porPagina = 25;

  const usuarios = await obtenerUsuariosPlataforma();
  const filtradas = aplicarFiltros(usuarios, params);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const pagina = Math.min(paginaActual, totalPaginas);
  const filas = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const conNegocio = usuarios.filter((u) => u.negocios.length > 0 || u.sucursales.length > 0).length;
  const sinPerfil = usuarios.filter((u) => !u.perfilCompleto).length;
  const superAdmins = usuarios.filter((u) => u.rolGlobal === "super_admin").length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Accesos y perfiles"
        title="Usuarios"
        description="Cuentas registradas, perfiles incompletos y accesos a negocios o sucursales."
        metrics={
          <>
            <AdminMetricPill label="Usuarios" value={formatearNumero(usuarios.length)} icon={Users} />
            <AdminMetricPill label="Con negocio" value={formatearNumero(conNegocio)} icon={Building2} tone="success" />
            <AdminMetricPill label="Sin perfil" value={formatearNumero(sinPerfil)} icon={UserX} tone={sinPerfil > 0 ? "warning" : "default"} />
            <AdminMetricPill label="Propietarios globales" value={formatearNumero(superAdmins)} icon={UserCheck} />
          </>
        }
      />

      <div className="rounded-[1.5rem] border border-border/75 bg-card/85 p-3 shadow-[0_14px_42px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:bg-card/75 dark:ring-white/5">
        <UsuariosFiltros />
      </div>

      {filas.length === 0 ? (
        <AdminEmptyState title="Sin usuarios" description="No hay usuarios que coincidan con los filtros aplicados." />
      ) : (
        <AdminTableShell
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {formatearNumero(filtradas.length)} usuario{filtradas.length === 1 ? "" : "s"} - pagina {pagina} de {totalPaginas}
              </p>
              <nav className="flex gap-2" aria-label="Paginacion">
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref(params, pagina - 1)}>
                  <ChevronLeft className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                  Anterior
                </Link>
                <Link className={`rounded-xl border px-3 py-2 font-bold ${pagina >= totalPaginas ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={buildHref(params, pagina + 1)}>
                  Siguiente
                  <ChevronRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </nav>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Ultimo acceso</TableHead>
                <TableHead>Rol global</TableHead>
                <TableHead>Negocio / Sucursal</TableHead>
                <TableHead>Perfil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/35">
                  <TableCell className="max-w-56">
                    <p className="truncate font-bold">{u.nombre ?? "Sin nombre"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email ?? "-"}</p>
                  </TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(u.creadoEn)}</TableCell>
                  <TableCell className="text-xs">{u.ultimoAcceso ? formatearFechaHora(u.ultimoAcceso) : "Nunca"}</TableCell>
                  <TableCell>
                    {u.rolGlobal === "super_admin" ? <Badge>super_admin</Badge> : <Badge variant="outline">{u.rolGlobal ?? "-"}</Badge>}
                  </TableCell>
                  <TableCell className="max-w-72 text-xs">
                    {u.negocios.length === 0 && u.sucursales.length === 0 ? (
                      <span className="text-muted-foreground">Sin acceso a negocios</span>
                    ) : (
                      <div className="grid gap-0.5">
                        {u.negocios.map((n) => (
                          <span key={n.negocioId} className="truncate">
                            {n.negocioNombre} / {n.rol} {!n.activo && "(inactivo)"}
                          </span>
                        ))}
                        {u.sucursales.map((s) => (
                          <span key={s.sucursalId} className="truncate">
                            {s.negocioNombre} / {s.sucursalNombre} / {s.rol} {!s.activo && "(inactivo)"}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.perfilCompleto ? (
                      <Badge>Completo</Badge>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Incompleto</Badge>
                        <SincronizarPerfilButton usuarioId={u.id} email={u.email} nombre={u.nombre} />
                      </div>
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
