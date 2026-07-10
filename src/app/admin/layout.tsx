import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerPerfilPropietario } from "@/lib/admin/queries/perfil-propietario";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Autoriza antes de renderizar cualquier dato. No revela información
  // interna a quien no sea el propietario (ver requirePlatformOwner()).
  const owner = await requirePlatformOwner();
  const perfil = await obtenerPerfilPropietario(owner.id, owner.email);

  return (
    <AdminShell ownerEmail={owner.email} tema={perfil.tema} colorAcento={perfil.colorAcento}>
      {children}
    </AdminShell>
  );
}
