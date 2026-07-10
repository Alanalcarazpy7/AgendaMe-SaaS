import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePlatformOwnerApi } from "@/lib/admin/api-guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { aplicarFiltrosNegocios, type NegociosFiltro } from "@/lib/admin/negocios-table";
import { registrarAuditoria } from "@/lib/admin/audit";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";

export const dynamic = "force-dynamic";

function nombreArchivo() {
  const fecha = new Date().toISOString().slice(0, 10);
  return `negocios-agendame-${fecha}.xlsx`;
}

export async function GET(request: Request) {
  const guard = await requirePlatformOwnerApi();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const filtro: NegociosFiltro = {
    q: url.searchParams.get("q") ?? undefined,
    plan: url.searchParams.get("plan") ?? undefined,
    estado: url.searchParams.get("estado") ?? undefined,
    vencimiento: (url.searchParams.get("vencimiento") as NegociosFiltro["vencimiento"]) ?? "",
    orden: (url.searchParams.get("orden") as NegociosFiltro["orden"]) ?? "recientes",
  };

  let negocios;
  try {
    negocios = await obtenerNegociosResumen();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo obtener los negocios." },
      { status: 500 }
    );
  }

  // Límite conservador: evita generar archivos desproporcionados si la
  // plataforma crece mucho. Suficiente para el volumen actual.
  const filas = aplicarFiltrosNegocios(negocios, filtro).slice(0, 5000);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AgendaMe";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Negocios");
  sheet.columns = [
    { header: "Negocio", key: "nombre", width: 28 },
    { header: "Slug", key: "slug", width: 22 },
    { header: "Email", key: "email", width: 26 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Registro", key: "created_at", width: 14 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Plan", key: "plan_nombre", width: 16 },
    { header: "Suscripción", key: "suscripcion_estado", width: 14 },
    { header: "Vencimiento", key: "fecha_vencimiento", width: 14 },
    { header: "Días para vencer", key: "dias_para_vencer", width: 14 },
    { header: "Citas mes", key: "citas_usadas_mes_actual", width: 12 },
    { header: "Límite citas", key: "limite_citas_mensuales", width: 12 },
    { header: "Clientes", key: "clientes_total", width: 10 },
    { header: "Empleados", key: "empleados_total", width: 10 },
    { header: "Servicios", key: "servicios_total", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const n of filas) {
    sheet.addRow({
      nombre: n.nombre,
      slug: n.slug,
      email: n.email,
      telefono: n.telefono,
      created_at: formatearFechaCorta(n.created_at),
      estado: n.estado,
      plan_nombre: n.plan_nombre,
      suscripcion_estado: n.suscripcion_estado,
      fecha_vencimiento: formatearFechaCorta(n.fecha_vencimiento),
      dias_para_vencer: n.dias_para_vencer,
      citas_usadas_mes_actual: n.citas_usadas_mes_actual,
      limite_citas_mensuales: n.limite_citas_mensuales,
      clientes_total: n.clientes_total,
      empleados_total: n.empleados_total,
      servicios_total: n.servicios_total,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  await registrarAuditoria({
    usuarioId: guard.owner.id,
    accion: "exportar_negocios",
    tablaAfectada: "negocios",
    detalles: { filtro, filas: filas.length },
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo()}"`,
      "Cache-Control": "no-store",
    },
  });
}
