import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Payload = {
  id?: string;
  sucursal_id?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function validarRol(rol: string) {
  return [
    "gerente_sucursal",
    "recepcionista_sucursal",
    "empleado_sucursal",
  ].includes(rol);
}

export async function GET() {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarSucursales) {
      return NextResponse.json(
        { error: "No tenés permiso para gestionar accesos de sucursales." },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("sucursal_usuarios")
      .select(
        `
        id,
        sucursal_id,
        email,
        rol,
        activo,
        created_at,
        sucursales (
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ accesos: data ?? [] });
  } catch (error) {
    console.error("Error listando accesos de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los accesos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarSucursales) {
      return NextResponse.json(
        { error: "No tenés permiso para gestionar accesos de sucursales." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const sucursalId = limpiar(body.sucursal_id);
    const email = limpiar(body.email).toLowerCase();
    const rol = limpiar(body.rol);

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Seleccioná una sucursal." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ingresá un email válido." },
        { status: 400 }
      );
    }

    if (!validarRol(rol)) {
      return NextResponse.json(
        { error: "Rol inválido." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: sucursal, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id")
      .eq("id", sucursalId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursal) {
      return NextResponse.json(
        { error: "Sucursal no encontrada." },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("sucursal_usuarios").insert({
      negocio_id: access.negocio.id,
      sucursal_id: sucursalId,
      email,
      rol,
      activo: true,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Acceso creado correctamente.",
    });
  } catch (error) {
    console.error("Error creando acceso de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo crear el acceso." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarSucursales) {
      return NextResponse.json(
        { error: "No tenés permiso para gestionar accesos de sucursales." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const id = limpiar(body.id);
    const sucursalId = limpiar(body.sucursal_id);
    const email = limpiar(body.email).toLowerCase();
    const rol = limpiar(body.rol);
    const activo = body.activo !== false;

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del acceso." },
        { status: 400 }
      );
    }

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Seleccioná una sucursal." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ingresá un email válido." },
        { status: 400 }
      );
    }

    if (!validarRol(rol)) {
      return NextResponse.json(
        { error: "Rol inválido." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("sucursal_usuarios")
      .update({
        sucursal_id: sucursalId,
        email,
        rol,
        activo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("negocio_id", access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Acceso actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error actualizando acceso de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el acceso." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarSucursales) {
      return NextResponse.json(
        { error: "No tenés permiso para gestionar accesos de sucursales." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;
    const id = limpiar(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del acceso." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("sucursal_usuarios")
      .update({
        activo: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("negocio_id", access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Acceso desactivado correctamente.",
    });
  } catch (error) {
    console.error("Error desactivando acceso de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo desactivar el acceso." },
      { status: 500 }
    );
  }
}