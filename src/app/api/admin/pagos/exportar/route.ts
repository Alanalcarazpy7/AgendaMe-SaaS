import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePlatformOwnerApi } from "@/lib/admin/api-guard";
import { obtenerTodosPagos } from "@/lib/admin/queries/pagos";
import { registrarAuditoria } from "@/lib/admin/audit";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";

export const dynamic = "force-dynamic";

function nombreArchivo() {
  const fecha = new Date().toISOString().slice(0, 10);
  return `pagos-agendame-${fecha}.xlsx`;
}

export async function GET(request: Request) {
  const guard = await requirePlatformOwnerApi();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const estado = url.searchParams.get("estado");

  let pagos;
  try {
    pagos = await obtenerTodosPagos(2000);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo obtener los pagos." },
      { status: 500 }
    );
  }

  const filas = estado ? pagos.filter((p) => p.estado === estado) : pagos;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AgendaMe";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Pagos");
  sheet.columns = [
    { header: "Negocio", key: "negocio", width: 26 },
    { header: "Plan", key: "plan", width: 16 },
    { header: "Monto (Gs.)", key: "monto", width: 14 },
    { header: "Método", key: "metodo", width: 14 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Fecha de pago", key: "fecha_pago", width: 14 },
    { header: "Período inicio", key: "periodo_inicio", width: 14 },
    { header: "Período fin", key: "periodo_fin", width: 14 },
    { header: "Aprobado", key: "aprobado_at", width: 14 },
    { header: "Rechazado", key: "rechazado_at", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const p of filas) {
    sheet.addRow({
      negocio: p.negocios?.nombre ?? "",
      plan: p.planes_saas?.nombre ?? "",
      monto: p.monto_gs,
      metodo: p.metodo ?? "",
      estado: p.estado,
      fecha_pago: formatearFechaCorta(p.fecha_pago),
      periodo_inicio: formatearFechaCorta(p.periodo_inicio),
      periodo_fin: formatearFechaCorta(p.periodo_fin),
      aprobado_at: formatearFechaCorta(p.aprobado_at),
      rechazado_at: formatearFechaCorta(p.rechazado_at),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  await registrarAuditoria({
    usuarioId: guard.owner.id,
    accion: "exportar_pagos",
    tablaAfectada: "pagos_manuales",
    detalles: { estado, filas: filas.length },
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo()}"`,
      "Cache-Control": "no-store",
    },
  });
}
