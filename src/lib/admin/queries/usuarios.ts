import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type UsuarioPlataforma = {
  id: string;
  email: string | null;
  nombre: string | null;
  creadoEn: string | null;
  ultimoAcceso: string | null;
  rolGlobal: string | null;
  tipoCuenta: string | null;
  perfilCompleto: boolean;
  negocios: { negocioId: string; negocioNombre: string; rol: string; activo: boolean }[];
  sucursales: { sucursalId: string; sucursalNombre: string; negocioNombre: string; rol: string; activo: boolean }[];
};

/**
 * Combina auth.users (vía GoTrue admin API, nunca expone hashes/tokens) con
 * perfiles_usuario, negocio_usuarios y sucursal_usuarios. Solo devuelve el
 * DTO seguro que necesita la UI — nunca el objeto crudo de auth.users.
 */
export async function obtenerUsuariosPlataforma(): Promise<UsuarioPlataforma[]> {
  const admin = createServiceRoleClient();

  const authUsers: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[] = [];
  let page = 1;
  const perPage = 200;

  // GoTrue pagina de a perPage; se corta si una página vuelve vacía o
  // parcial, o tras un máximo razonable de páginas como salvaguarda.
  for (let intentos = 0; intentos < 20; intentos++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);

    for (const u of data.users) {
      authUsers.push({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      });
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  type PerfilRow = {
    id: string;
    usuario_id: string | null;
    nombre: string | null;
    nombre_completo: string | null;
    rol_global: string | null;
    tipo_cuenta: string | null;
  };

  const [{ data: perfiles }, { data: negocioUsuarios }, { data: sucursalUsuarios }] = await Promise.all([
    admin.from("perfiles_usuario").select("id, usuario_id, nombre, nombre_completo, rol_global, tipo_cuenta"),
    admin.from("negocio_usuarios").select("usuario_id, negocio_id, rol, activo, negocios(nombre)"),
    admin
      .from("sucursal_usuarios")
      .select("usuario_id, sucursal_id, rol, activo, sucursales(nombre, negocios(nombre))"),
  ]);

  const perfilPorId = new Map<string, PerfilRow>();
  for (const p of (perfiles ?? []) as PerfilRow[]) {
    if (p.id) perfilPorId.set(p.id, p);
    if (p.usuario_id && !perfilPorId.has(p.usuario_id)) perfilPorId.set(p.usuario_id, p);
  }

  return authUsers.map((u) => {
    const perfil = perfilPorId.get(u.id);

    const negocios = (negocioUsuarios ?? [])
      .filter((nu) => nu.usuario_id === u.id)
      .map((nu) => ({
        negocioId: nu.negocio_id as string,
        negocioNombre: (nu.negocios as unknown as { nombre: string } | null)?.nombre ?? "—",
        rol: nu.rol as string,
        activo: Boolean(nu.activo),
      }));

    const sucursales = (sucursalUsuarios ?? [])
      .filter((su) => su.usuario_id === u.id)
      .map((su) => {
        const sucursal = su.sucursales as unknown as { nombre: string; negocios: { nombre: string } | null } | null;
        return {
          sucursalId: su.sucursal_id as string,
          sucursalNombre: sucursal?.nombre ?? "—",
          negocioNombre: sucursal?.negocios?.nombre ?? "—",
          rol: su.rol as string,
          activo: Boolean(su.activo),
        };
      });

    return {
      id: u.id,
      email: u.email,
      nombre: perfil?.nombre ?? perfil?.nombre_completo ?? null,
      creadoEn: u.created_at,
      ultimoAcceso: u.last_sign_in_at,
      rolGlobal: perfil?.rol_global ?? null,
      tipoCuenta: perfil?.tipo_cuenta ?? null,
      perfilCompleto: Boolean(perfil),
      negocios,
      sucursales,
    };
  });
}
