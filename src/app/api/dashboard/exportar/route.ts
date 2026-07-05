import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

type ExportData = {
  titulo: string;
  columnas: string[];
  filas: Array<Array<string | number | null>>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function nombreArchivo(base: string) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `${base}-agendame-${fecha}.xlsx`;
}

function precioCita(cita: any) {
  const servicio = obtenerObjeto(cita.servicios) as any;
  const precioCitaValor = Number(cita.precio ?? 0);
  const precioServicioValor = Number(servicio?.precio ?? 0);

  return precioCitaValor > 0 ? precioCitaValor : precioServicioValor;
}

async function validarSucursalFiltro({
  supabase,
  negocioId,
  sucursalId,
}: {
  supabase: any;
  negocioId: string;
  sucursalId: string;
}) {
  if (!sucursalId || sucursalId === "todas") return null;

  const { data, error } = await supabase
    .from("sucursales")
    .select("id")
    .eq("id", sucursalId)
    .eq("negocio_id", negocioId)
    .eq("estado", "activo")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data?.id ?? null;
}

async function obtenerDatosExportacion({
  access,
  tipo,
  desde,
  hasta,
  sucursalFiltro,
}: {
  access: any;
  tipo: string;
  desde: string;
  hasta: string;
  sucursalFiltro: string | null;
}): Promise<ExportData> {
  const supabase = createServiceRoleClient() as any;

  if (tipo === "citas") {
    let query: any = supabase
      .from("citas")
      .select(
        `
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        precio,
        origen,
        sucursales (
          nombre
        ),
        clientes (
          nombre_completo,
          telefono,
          email
        ),
        servicios (
          nombre,
          precio
        ),
        empleados (
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (desde) query = query.gte("fecha", desde);
    if (hasta) query = query.lte("fecha", hasta);
    if (sucursalFiltro) query = query.eq("sucursal_id", sucursalFiltro);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return {
      titulo: "Citas",
      columnas: [
        "Fecha",
        "Hora inicio",
        "Hora fin",
        "Estado",
        "Precio",
        "Origen",
        "Sucursal",
        "Cliente",
        "Teléfono",
        "Email",
        "Servicio",
        "Empleado",
      ],
      filas: (data ?? []).map((cita: any) => {
        const cliente = obtenerObjeto(cita.clientes) as any;
        const servicio = obtenerObjeto(cita.servicios) as any;
        const empleado = obtenerObjeto(cita.empleados) as any;
        const sucursal = obtenerObjeto(cita.sucursales) as any;

        return [
          cita.fecha,
          String(cita.hora_inicio ?? "").slice(0, 5),
          String(cita.hora_fin ?? "").slice(0, 5),
          cita.estado,
          precioCita(cita),
          cita.origen,
          sucursal?.nombre ?? "",
          cliente?.nombre_completo ?? "",
          cliente?.telefono ?? "",
          cliente?.email ?? "",
          servicio?.nombre ?? "",
          empleado?.nombre ?? "",
        ];
      }),
    };
  }

  if (tipo === "clientes") {
    if (sucursalFiltro) {
      const { data, error } = await supabase
        .from("cliente_sucursales")
        .select(
          `
          clientes (
            nombre_completo,
            telefono,
            email,
            estado,
            created_at
          ),
          sucursales (
            nombre
          )
        `
        )
        .eq("negocio_id", access.negocio.id)
        .eq("sucursal_id", sucursalFiltro)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return {
        titulo: "Clientes",
        columnas: ["Nombre", "Teléfono", "Email", "Estado", "Sucursal", "Creado"],
        filas: (data ?? []).map((row: any) => {
          const cliente = obtenerObjeto(row.clientes) as any;
          const sucursal = obtenerObjeto(row.sucursales) as any;

          return [
            cliente?.nombre_completo ?? "",
            cliente?.telefono ?? "",
            cliente?.email ?? "",
            cliente?.estado ?? "",
            sucursal?.nombre ?? "",
            cliente?.created_at ?? "",
          ];
        }),
      };
    }

    const { data, error } = await supabase
      .from("clientes")
      .select("nombre_completo, telefono, email, estado, created_at")
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      titulo: "Clientes",
      columnas: ["Nombre", "Teléfono", "Email", "Estado", "Creado"],
      filas: (data ?? []).map((cliente: any) => [
        cliente.nombre_completo,
        cliente.telefono,
        cliente.email,
        cliente.estado,
        cliente.created_at,
      ]),
    };
  }

  if (tipo === "empleados") {
    let query: any = supabase
      .from("empleados")
      .select(
        `
        nombre,
        email,
        telefono,
        estado,
        created_at,
        sucursales (
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false });

    if (sucursalFiltro) query = query.eq("sucursal_id", sucursalFiltro);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return {
      titulo: "Empleados",
      columnas: ["Nombre", "Email", "Teléfono", "Estado", "Sucursal", "Creado"],
      filas: (data ?? []).map((empleado: any) => {
        const sucursal = obtenerObjeto(empleado.sucursales) as any;

        return [
          empleado.nombre,
          empleado.email,
          empleado.telefono,
          empleado.estado,
          sucursal?.nombre ?? "",
          empleado.created_at,
        ];
      }),
    };
  }

  if (tipo === "servicios") {
    if (!access.puedeVerTodo) {
      throw new Error("Solo el admin global puede exportar servicios.");
    }

    const { data, error } = await supabase
      .from("servicios")
      .select("nombre, descripcion, duracion_minutos, precio, estado, created_at")
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return {
      titulo: "Servicios",
      columnas: [
        "Nombre",
        "Descripción",
        "Duración minutos",
        "Precio",
        "Estado",
        "Creado",
      ],
      filas: (data ?? []).map((servicio: any) => [
        servicio.nombre,
        servicio.descripcion,
        servicio.duracion_minutos,
        servicio.precio,
        servicio.estado,
        servicio.created_at,
      ]),
    };
  }

  throw new Error("Tipo de exportación inválido.");
}

async function crearXlsx(data: ExportData) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "AgendaMe";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(data.titulo);

  sheet.columns = data.columnas.map((columna, index) => {
    const maxContenido = Math.max(
      columna.length,
      ...data.filas.map((fila) => String(fila[index] ?? "").length)
    );

    return {
      header: columna,
      key: columna,
      width: Math.min(Math.max(maxContenido + 4, 14), 42),
    };
  });

  sheet.getRow(1).font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111827" },
  };

  sheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  sheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  sheet.autoFilter = {
    from: {
      row: 1,
      column: 1,
    },
    to: {
      row: 1,
      column: data.columnas.length,
    },
  };

  for (const fila of data.filas) {
    sheet.addRow(fila);
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return buffer;
}

export async function GET(request: Request) {
  try {
    const accessResult = await resolveDashboardAccess();

    if (!accessResult.ok) {
      return NextResponse.json(
        { error: "No autenticado o sin acceso." },
        { status: 401 }
      );
    }

    const access = accessResult;

    if (!access.puedeExportar) {
      return NextResponse.json(
        { error: "No tenés permiso para exportar datos." },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient() as any;
    const { searchParams } = new URL(request.url);

    const tipo = limpiar(searchParams.get("tipo") ?? "citas");
    const formato = limpiar(searchParams.get("formato") ?? "json");
    const desde = limpiar(searchParams.get("desde"));
    const hasta = limpiar(searchParams.get("hasta"));
    const sucursalParam = limpiar(searchParams.get("sucursalId") ?? "todas");

    const esAdminEmpresarial =
      access.scope === "global" && nivelPlan(access.planClave) >= 3;

    let sucursalFiltro: string | null = null;

    if (access.scope === "sucursal" && access.sucursalId) {
      sucursalFiltro = access.sucursalId;
    } else if (esAdminEmpresarial && sucursalParam !== "todas") {
      sucursalFiltro = await validarSucursalFiltro({
        supabase,
        negocioId: access.negocio.id,
        sucursalId: sucursalParam,
      });
    }

    const data = await obtenerDatosExportacion({
      access,
      tipo,
      desde,
      hasta,
      sucursalFiltro,
    });

    if (formato === "json") {
      return NextResponse.json({
        ...data,
        total: data.filas.length,
      });
    }

    if (formato === "xlsx") {
      const buffer = await crearXlsx(data);

      return new Response(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${nombreArchivo(tipo)}"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Formato inválido." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error exportando datos:", error);

    return NextResponse.json(
      { error: "No se pudo preparar la exportación." },
      { status: 500 }
    );
  }
}