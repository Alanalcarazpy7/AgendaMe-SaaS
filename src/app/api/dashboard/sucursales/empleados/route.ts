import { NextResponse } from "next/server";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

async function requireAdminEmpresarial() {
  const access = await resolveDashboardAccess();

  if (!access.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No autenticado o sin acceso." },
        { status: 401 }
      ),
    };
  }

  if (!access.puedeGestionarSucursales || !access.puedeVerTodo) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Solo el admin empresarial puede asignar empleados a sucursales." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access,
  };
}

export async function GET() {
  try {
    const guard = await requireAdminEmpresarial();

    if (!guard.ok) return guard.response;

    const supabase = createServiceRoleClient();

    const [{ data: empleados, error: empleadosError }, { data: sucursales, error: sucursalesError }] =
      await Promise.all([
        supabase
          .from("empleados")
          .select("id, nombre, email, telefono, estado, sucursal_id")
          .eq("negocio_id", guard.access.negocio.id)
          .order("nombre", { ascending: true }),

        supabase
          .from("sucursales")
          .select("id, nombre, estado, es_principal")
          .eq("negocio_id", guard.access.negocio.id)
          .order("es_principal", { ascending: false })
          .order("created_at", { ascending: true }),
      ]);

    if (empleadosError) throw new Error(empleadosError.message);
    if (sucursalesError) throw new Error(sucursalesError.message);

    return NextResponse.json({
      empleados: empleados ?? [],
      sucursales: sucursales ?? [],
    });
  } catch (error) {
    console.error("Error listando empleados por sucursal:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudieron cargar los empleados.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireAdminEmpresarial();

    if (!guard.ok) return guard.response;

    const body = await request.json();

    const empleadoId = limpiar(
      body.empleado_id ?? body.empleadoId ?? body.id
    );

    const sucursalId = limpiar(
      body.sucursal_id ?? body.sucursalId
    );

    if (!empleadoId) {
      return NextResponse.json(
        { error: "Falta el empleado." },
        { status: 400 }
      );
    }

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Falta la sucursal." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("id, negocio_id")
      .eq("id", empleadoId)
      .eq("negocio_id", guard.access.negocio.id)
      .maybeSingle();

    if (empleadoError) throw new Error(empleadoError.message);

    if (!empleado) {
      return NextResponse.json(
        { error: "El empleado no existe o no pertenece a este negocio." },
        { status: 404 }
      );
    }

    const { data: sucursal, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id, negocio_id, estado")
      .eq("id", sucursalId)
      .eq("negocio_id", guard.access.negocio.id)
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursal) {
      return NextResponse.json(
        { error: "La sucursal no existe o no pertenece a este negocio." },
        { status: 404 }
      );
    }

    if (sucursal.estado !== "activo") {
      return NextResponse.json(
        { error: "No podés asignar empleados a una sucursal inactiva." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("empleados")
      .update({
        sucursal_id: sucursalId,
      })
      .eq("id", empleadoId)
      .eq("negocio_id", guard.access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Empleado asignado correctamente.",
    });
  } catch (error) {
    console.error("Error asignando empleado a sucursal:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo asignar el empleado a la sucursal.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}