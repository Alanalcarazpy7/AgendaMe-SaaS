import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerPerfilPropietario } from "@/lib/admin/queries/perfil-propietario";
import { PerfilPropietarioForm } from "@/components/admin/configuracion/perfil-propietario-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminConfiguracionPage() {
  const owner = await requirePlatformOwner();
  const perfil = await obtenerPerfilPropietario(owner.id, owner.email);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Preferencias personales del propietario: nombre, foto y tema del panel.
        </p>
      </div>

      <PerfilPropietarioForm perfil={perfil} />
    </div>
  );
}
