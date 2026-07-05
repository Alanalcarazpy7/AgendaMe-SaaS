import { redirect } from "next/navigation";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { RecordatoriosPanel } from "@/components/recordatorios/recordatorios-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { requirePermission, applySucursalScope } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

type CitaRaw = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  seguimiento_token: string | null;
  sucursal_id: string | null;
  clientes: Relacion<{
    nombre_completo: string;
    telefono: string | null;
    email?: string | null;
  }>;
  servicios: Relacion<{
    nombre: string;
  }>;
  empleados: Relacion<{
    nombre: string;
  }>;
  sucursales: Relacion<{
    id: string;
    nombre: string;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function hoyAsuncion() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function sumarDias(fecha: string, dias: number) {
  const date = new Date(`${fecha}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dias);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function RecordatoriosPage() {
  const access = await requireDashboardAccess();

  if (access.scope === "sucursal" && access.rol === "empleado_sucursal") {
    redirect("/dashboard/sin-permiso");
  }

if (!access.puedeUsarRecordatorios) {
    return (
      <PremiumFeaturePage
        titulo="Recordatorios"
        descripcion="Reducí ausencias enviando recordatorios a tus clientes antes de sus citas."
        desde={
          access.scope === "global"
            ? "Plan Profesional"
            : "Plan Empresarial para usuarios de sucursal"
        }
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  requirePermission(access, "puedeUsarRecordatorios");

  const supabase = createServiceRoleClient();

  const desde = hoyAsuncion();
  const hasta = sumarDias(desde, 7);

  let query = supabase
    .from("citas")
    .select(
      `
      id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      seguimiento_token,
      sucursal_id,
      clientes (
        nombre_completo,
        telefono,
        email
      ),
      servicios (
        nombre
      ),
      empleados (
        nombre
      ),
      sucursales (
        id,
        nombre
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .in("estado", ["pendiente", "confirmada"])
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  query = applySucursalScope(query, access);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const citas = ((data ?? []) as CitaRaw[]).map((cita) => {
    const sucursal = obtenerObjeto(cita.sucursales);

    return {
      id: cita.id,
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin,
      estado: cita.estado,
      seguimiento_token: cita.seguimiento_token,
      sucursal_id: cita.sucursal_id,
      sucursal,
      cliente: obtenerObjeto(cita.clientes),
      servicio: obtenerObjeto(cita.servicios),
      empleado: obtenerObjeto(cita.empleados),
    };
  });

  const sucursalesMap = new Map<string, { id: string; nombre: string }>();

  for (const cita of citas) {
    if (cita.sucursal?.id) {
      sucursalesMap.set(cita.sucursal.id, cita.sucursal);
    }
  }

  return (
    <RecordatoriosPanel
      citas={citas}
      scope={access.scope}
      sucursalNombre={access.sucursalNombre}
      sucursales={Array.from(sucursalesMap.values())}
    />
  );
}