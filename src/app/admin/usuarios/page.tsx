import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerUsuariosPlataforma } from "@/lib/admin/queries/usuarios";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta, formatearFechaHora } from "@/lib/admin/formatters/date";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { UsuariosFiltros } from "@/components/admin/usuarios/usuarios-filtros";
import { Users, UserCheck, UserX, Building2 } from "lucide-react";
import type { UsuarioPlataforma } from "@/lib/admin/queries/usuarios";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{ q?: string; rol?: string; negocio?: string }>;
};

function aplicarFiltros(usuarios: UsuarioPlataforma[], params: { q?: string; rol?: string; negocio?: string }) {
  let filas = usuarios;

  if (params.q) {
    const q = params.q.trim().toLowerCase();
    filas = filas.filter(
      (u) => (u.email ?? "").toLowerCase().includes(q) || (u.nombre ?? "").toLowerCase().includes(q)
    );
  }

  if (params.rol) {
    filas = filas.filter((u) => u.rolGlobal === params.rol);
  }

  if (params.negocio === "con") {
    filas = filas.filter((u) => u.negocios.length > 0 || u.sucursales.length > 0);
  } else if (params.negocio === "sin") {
    filas = filas.filter((u) => u.negocios.length === 0 && u.sucursales.length === 0);
  }

  return filas;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};

  const usuarios = await obtenerUsuariosPlataforma();
  const filas = aplicarFiltros(usuarios, params);

  const conNegocio = usuarios.filter((u) => u.negocios.length > 0 || u.sucursales.length > 0).length;
  const sinPerfil = usuarios.filter((u) => !u.perfilCompleto).length;
  const superAdmins = usuarios.filter((u) => u.rolGlobal === "super_admin").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {usuarios.length} cuentas registradas (auth.users + perfiles_usuario + accesos).
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Usuarios totales" value={formatearNumero(usuarios.length)} icon={Users} />
        <KpiCard label="Con negocio/sucursal" value={formatearNumero(conNegocio)} icon={Building2} tone="success" />
        <KpiCard
          label="Sin perfil"
          value={formatearNumero(sinPerfil)}
          icon={UserX}
          tone={sinPerfil > 0 ? "warning" : "default"}
        />
        <KpiCard label="Super admins" value={formatearNumero(superAdmins)} icon={UserCheck} tone="success" />
      </section>

      <UsuariosFiltros />

      {filas.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          No hay usuarios que coincidan con los filtros aplicados.
        </div>
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Rol global</TableHead>
                <TableHead>Negocio / Sucursal</TableHead>
                <TableHead>Perfil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="max-w-56">
                    <p className="truncate font-medium">{u.nombre ?? "Sin nombre"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(u.creadoEn)}</TableCell>
                  <TableCell className="text-xs">
                    {u.ultimoAcceso ? formatearFechaHora(u.ultimoAcceso) : "Nunca"}
                  </TableCell>
                  <TableCell>
                    {u.rolGlobal === "super_admin" ? (
                      <Badge variant="default">super_admin</Badge>
                    ) : (
                      <Badge variant="outline">{u.rolGlobal ?? "—"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-56 text-xs">
                    {u.negocios.length === 0 && u.sucursales.length === 0 ? (
                      <span className="text-muted-foreground">Sin acceso a negocios</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {u.negocios.map((n) => (
                          <span key={n.negocioId} className="truncate">
                            {n.negocioNombre} · {n.rol} {!n.activo && "(inactivo)"}
                          </span>
                        ))}
                        {u.sucursales.map((s) => (
                          <span key={s.sucursalId} className="truncate">
                            {s.negocioNombre} / {s.sucursalNombre} · {s.rol} {!s.activo && "(inactivo)"}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.perfilCompleto ? (
                      <Badge variant="default">Completo</Badge>
                    ) : (
                      <Badge variant="secondary">Incompleto</Badge>
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
