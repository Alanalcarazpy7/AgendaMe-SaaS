import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Payload = {
  empleadoId?: string;
  sucursalId?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function GET() {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarSucursales) {
      return NextResponse.json(
        { error: "No tenés permiso para gestionar empleados por sucursal." },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("empleados")
      .select(
        `
        id,
        nombre,
        email,
        telefono,
        estado,
        sucursal_id,
        sucursales (
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .order("nombre", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ empleados: data ?? [] });
  } catch (error) {
    console.error("Error listando empleados por sucursal:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los empleados." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarSucursales) {
      return NextResponse.json(
        { error: "No tenés permiso para asignar empleados a sucursales." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const empleadoId = limpiar(body.empleadoId);
    const sucursalId = limpiar(body.sucursalId);

    if (!empleadoId) {
      return NextResponse.json(
        { error: "Falta el empleado." },
        { status: 400 }
      );
    }

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Seleccioná una sucursal." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("id")
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (empleadoError) throw new Error(empleadoError.message);

    if (!empleado) {
      return NextResponse.json(
        { error: "Empleado no encontrado." },
        { status: 404 }
      );
    }

    const { data: sucursal, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id")
      .eq("id", sucursalId)
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursal) {
      return NextResponse.json(
        { error: "Sucursal no encontrada o inactiva." },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("empleados")
      .update({
        sucursal_id: sucursalId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Empleado asignado a la sucursal correctamente.",
    });
  } catch (error) {
    console.error("Error asignando empleado a sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo asignar el empleado." },
      { status: 500 }
    );
  }
}