import { MonitorCog, Palette, ShieldCheck, UserRoundCog } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerPerfilPropietario } from "@/lib/admin/queries/perfil-propietario";
import { PerfilPropietarioForm } from "@/components/admin/configuracion/perfil-propietario-form";
import { AdminMetricPill, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminConfiguracionPage() {
  const owner = await requirePlatformOwner();
  const perfil = await obtenerPerfilPropietario(owner.id, owner.email);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Preferencias del panel"
        title="Configuracion"
        description="Ajusta tu identidad visual, tema y preferencias personales del entorno privado."
        metrics={
          <>
            <AdminMetricPill label="Tema actual" value={perfil.tema} icon={Palette} />
            <AdminMetricPill label="Perfil" value={perfil.nombre ? "Completo" : "Pendiente"} icon={UserRoundCog} />
            <AdminMetricPill label="Sesion" value="Protegida" icon={ShieldCheck} tone="success" />
            <AdminMetricPill label="Vista" value="Responsive" icon={MonitorCog} />
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <PerfilPropietarioForm perfil={perfil} />

        <div className="grid gap-4">
          <AdminPanel
            title="Buenas practicas"
            description="Pequenas reglas para mantener el panel claro cuando lo uses todos los dias."
          >
            <div className="grid gap-3 text-sm text-muted-foreground">
              <p className="rounded-2xl border bg-background/60 p-3">
                Usa un nombre corto para que la barra lateral y los toasts se lean sin ruido.
              </p>
              <p className="rounded-2xl border bg-background/60 p-3">
                Si trabajas de noche, guarda el tema oscuro; si alternas equipos, deja Sistema.
              </p>
              <p className="rounded-2xl border bg-background/60 p-3">
                La foto o logo ayuda a reconocer rapido que estas dentro del entorno correcto.
              </p>
            </div>
          </AdminPanel>

          <AdminPanel title="Seguridad" description="Controles recomendados para operar cambios sensibles.">
            <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
              Tu sesion se valida en servidor antes de abrir cualquier ruta privada. Si algo falla, el panel redirige sin exponer datos.
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
