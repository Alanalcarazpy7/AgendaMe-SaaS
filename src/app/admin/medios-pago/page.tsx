import { Eye, ImageIcon, QrCode, Wallet } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerMediosPago } from "@/lib/admin/queries/medios-pago";
import { MediosPagoPanel } from "@/components/admin/medios-pago/medios-pago-panel";
import { AdminMetricPill, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";
import { formatearNumero } from "@/lib/admin/formatters/currency";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMediosPagoPage() {
  await requirePlatformOwner();

  const medios = await obtenerMediosPago();

  const activos = medios.filter((m) => m.activo).length;
  const conQr = medios.filter((m) => m.qr_url).length;
  const conLogo = medios.filter((m) => m.logo_url).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Cobros y monetizacion"
        title="Medios de pago"
        description="Lo que ve cada negocio en /dashboard/planes antes de pagar o renovar su plan: cuentas, alias, billeteras y QR."
        metrics={
          <>
            <AdminMetricPill label="Cargados" value={formatearNumero(medios.length)} icon={Wallet} />
            <AdminMetricPill label="Visibles" value={formatearNumero(activos)} icon={Eye} tone="success" />
            <AdminMetricPill label="Con QR" value={formatearNumero(conQr)} icon={QrCode} />
            <AdminMetricPill label="Con logo" value={formatearNumero(conLogo)} icon={ImageIcon} />
          </>
        }
      />

      <MediosPagoPanel medios={medios} />

      <AdminPanel
        title="Recomendaciones"
        description="Para que el negocio pague sin dudas ni consultas de ida y vuelta."
      >
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p className="rounded-2xl border bg-background/60 p-3">
            Cargá el alias en vez del número de cuenta: es lo único que necesita el negocio para transferir.
          </p>
          <p className="rounded-2xl border bg-background/60 p-3">
            El logo ayuda a reconocer el banco o billetera de un vistazo, sin tener que leer el nombre completo.
          </p>
          <p className="rounded-2xl border bg-background/60 p-3">
            El QR es opcional pero acelera la transferencia desde apps que soportan pago por código.
          </p>
        </div>
      </AdminPanel>
    </div>
  );
}
