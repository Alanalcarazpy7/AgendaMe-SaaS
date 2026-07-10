import Link from "next/link";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerInvitaciones, estadoEfectivoInvitacion } from "@/lib/admin/queries/invitaciones";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { InvitacionRevocarBoton } from "@/components/admin/invitaciones/invitacion-revocar-boton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function badgeEstado(estado: string) {
  if (estado === "pendiente") return <Badge variant="secondary">Pendiente</Badge>;
  if (estado === "aceptada") return <Badge variant="default">Aceptada</Badge>;
  if (estado === "revocada") return <Badge variant="outline">Revocada</Badge>;
  if (estado === "expirada") return <Badge variant="destructive">Expirada</Badge>;
  return <Badge variant="outline">{estado}</Badge>;
}

type PageProps = {
  searchParams?: Promise<{ estado?: string }>;
};

export default async function AdminInvitacionesPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};

  const invitaciones = await obtenerInvitaciones(500);
  const conEstadoEfectivo = invitaciones.map((inv) => ({ ...inv, estadoEfectivo: estadoEfectivoInvitacion(inv) }));

  const filtroEstado = params.estado ?? "";
  const filas = filtroEstado ? conEstadoEfectivo.filter((i) => i.estadoEfectivo === filtroEstado) : conEstadoEfectivo;

  const tabs = [
    { key: "", label: "Todas", cantidad: conEstadoEfectivo.length },
    { key: "pendiente", label: "Pendientes", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "pendiente").length },
    { key: "aceptada", label: "Aceptadas", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "aceptada").length },
    { key: "expirada", label: "Expiradas", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "expirada").length },
    { key: "revocada", label: "Revocadas", cantidad: conEstadoEfectivo.filter((i) => i.estadoEfectivo === "revocada").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Invitaciones</h1>
        <p className="text-sm text-muted-foreground">
          Invitaciones de acceso a sucursales de todos los negocios. No se muestran tokens.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Filtro de invitaciones">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/invitaciones?estado=${t.key}` : "/admin/invitaciones"}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filtroEstado === t.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {t.label} ({t.cantidad})
          </Link>
        ))}
      </nav>

      {filas.length === 0 ? (
        <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          No hay invitaciones en este filtro.
        </div>
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Negocio / Sucursal</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviada</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="max-w-48 truncate text-xs">{inv.email}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs">
                    {inv.negocios?.nombre ?? "—"} / {inv.sucursales?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">{inv.rol}</TableCell>
                  <TableCell>{badgeEstado(inv.estadoEfectivo)}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(inv.created_at)}</TableCell>
                  <TableCell className="text-xs">{formatearFechaCorta(inv.expires_at)}</TableCell>
                  <TableCell className="text-right">
                    {inv.estadoEfectivo === "pendiente" ? (
                      <InvitacionRevocarBoton invitacionId={inv.id} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
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
