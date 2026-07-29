import { expect, test, type Page } from "@playwright/test";

import { uniqueId } from "./helpers/agendame";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const business = fixtures.businesses.empresarial;
const id = uniqueId();
const clienteNombre = `Cliente estados ${id}`;
const numeroFecha = Number(id.replace(/\D/g, "").slice(-4) || "1");
const mesFecha = String((numeroFecha % 12) + 1).padStart(2, "0");
const diaFecha = String((numeroFecha % 27) + 1).padStart(2, "0");
const fechaPasada = `2023-${mesFecha}-${diaFecha}`;
const fechaFutura = `2035-${mesFecha}-${diaFecha}`;

let clienteId = "";
let citaPasadaId = "";
let citaFuturaId = "";
let citaCanceladaId = "";
let citaPendientePasadaId = "";
let citaAusenteId = "";
let citaAutoActualizadaId = "";

async function omitirRecorridoSiAparece(page: Page) {
  const omitirRecorrido = page.getByRole("button", {
    name: /Omitir recorrido/i,
  });

  if (await omitirRecorrido.isVisible()) {
    await omitirRecorrido.click();
  }
}

test.describe.serial("flujo operativo de estados en Reservas", () => {
  test.use({ storageState: fixtures.accounts.admin_empresarial.storage });

  test.beforeAll(async () => {
    const supabase = supabaseAdmin();
    const { data: clientesAnteriores } = await supabase
      .from("clientes")
      .select("id")
      .eq("negocio_id", business.id)
      .like("nombre_completo", "Cliente estados %");
    const clientesAnterioresIds = (clientesAnteriores ?? []).map(
      (cliente) => cliente.id,
    );

    if (clientesAnterioresIds.length) {
      await supabase
        .from("citas")
        .delete()
        .in("cliente_id", clientesAnterioresIds);
      await supabase
        .from("cliente_sucursales")
        .delete()
        .in("cliente_id", clientesAnterioresIds);
      await supabase
        .from("clientes")
        .delete()
        .in("id", clientesAnterioresIds);
    }

    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({
        negocio_id: business.id,
        nombre_completo: clienteNombre,
        telefono: `0961${id.slice(-6)}`,
        email: `estados.${id}@example.com`,
        estado: "activo",
      })
      .select("id")
      .single();

    if (clienteError || !cliente) {
      throw clienteError ?? new Error("No se pudo crear el cliente de estados.");
    }

    clienteId = cliente.id;

    const citasBase = [
      {
        fecha: fechaPasada,
        hora_inicio: "07:00",
        hora_fin: "07:30",
        estado: "confirmada",
      },
      {
        fecha: fechaFutura,
        hora_inicio: "07:00",
        hora_fin: "07:30",
        estado: "confirmada",
      },
      {
        fecha: fechaFutura,
        hora_inicio: "08:00",
        hora_fin: "08:30",
        estado: "confirmada",
      },
      {
        fecha: fechaPasada,
        hora_inicio: "08:00",
        hora_fin: "08:30",
        estado: "pendiente",
      },
      {
        fecha: fechaPasada,
        hora_inicio: "09:00",
        hora_fin: "09:30",
        estado: "pendiente",
      },
    ].map((cita) => ({
      ...cita,
      negocio_id: business.id,
      sucursal_id: business.secondaryBranch!.id,
      cliente_id: clienteId,
      servicio_id: business.service.id,
      empleado_id: business.secondaryEmployee!.id,
      precio: 50000,
      origen: "dashboard",
      notas: `Flujo de estados E2E ${id}`,
    }));

    const { data: citas, error: citasError } = await supabase
      .from("citas")
      .insert(citasBase)
      .select("id, fecha, hora_inicio");

    if (citasError || !citas) {
      throw citasError ?? new Error("No se pudieron crear las citas de estados.");
    }

    citaPasadaId =
      citas.find(
        (cita) =>
          cita.fecha === fechaPasada &&
          String(cita.hora_inicio).slice(0, 5) === "07:00",
      )?.id ?? "";
    citaFuturaId =
      citas.find(
        (cita) =>
          cita.fecha === fechaFutura &&
          String(cita.hora_inicio).slice(0, 5) === "07:00",
      )?.id ?? "";
    citaCanceladaId =
      citas.find(
        (cita) =>
          cita.fecha === fechaFutura &&
          String(cita.hora_inicio).slice(0, 5) === "08:00",
      )?.id ?? "";
    citaPendientePasadaId =
      citas.find(
        (cita) =>
          cita.fecha === fechaPasada &&
          String(cita.hora_inicio).slice(0, 5) === "08:00",
      )?.id ?? "";
    citaAusenteId =
      citas.find(
        (cita) =>
          cita.fecha === fechaPasada &&
          String(cita.hora_inicio).slice(0, 5) === "09:00",
      )?.id ?? "";
  });

  test.afterAll(async () => {
    const supabase = supabaseAdmin();
    const citasIds = [
      citaPasadaId,
      citaFuturaId,
      citaCanceladaId,
      citaPendientePasadaId,
      citaAusenteId,
      citaAutoActualizadaId,
    ].filter(Boolean);

    if (citasIds.length) {
      await supabase.from("citas").delete().in("id", citasIds);
    }

    if (clienteId) {
      await supabase.from("clientes").delete().eq("id", clienteId);
    }
  });

  test("completa una reserva confirmada cuyo horario terminó", async ({
    page,
  }) => {
    await page.goto("/dashboard/reservas", { waitUntil: "networkidle" });

    await omitirRecorridoSiAparece(page);

    await page.getByRole("button", { name: /^Asistencia/i }).click();
    await page
      .getByPlaceholder(/Buscar cliente/i)
      .fill(clienteNombre);

    const fila = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "07:00 - 07:30" });

    await expect(fila).toBeVisible();

    const completar = fila.getByTitle("Marcar como atendida y completada");
    await expect(completar).toBeEnabled();
    await completar.click();
    const dialog = page.getByRole("dialog", {
      name: "Confirmar servicio completado",
    });
    await expect(dialog).toContainText(clienteNombre);
    await dialog
      .getByRole("button", { name: "Sí, marcar como completada" })
      .click();

    await expect(
      page.getByRole("button", { name: /Completadas/i }),
    ).toHaveClass(/bg-primary/);
    const filaCompletada = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "07:00 - 07:30" });
    await expect(filaCompletada).toContainText("Completada");
    await expect(filaCompletada).not.toContainText("Próxima");
    await expect(filaCompletada).not.toContainText("Finalizada");
    await expect(filaCompletada).not.toContainText("Registrar asistencia");
    await expect(page.locator("body")).toContainText(/Servicio completado/i);

    const { data: cita, error } = await supabaseAdmin()
      .from("citas")
      .select("estado")
      .eq("id", citaPasadaId)
      .single();

    expect(error).toBeNull();
    expect(cita?.estado).toBe("completada");

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Completadas/i }).click();
    await page
      .getByPlaceholder(/Buscar cliente/i)
      .fill(clienteNombre);
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: clienteNombre })
        .filter({ hasText: "07:00 - 07:30" }),
    ).toContainText("Completada");
  });

  test("completa directamente una reserva pasada que quedó pendiente", async ({
    page,
  }) => {
    await page.goto("/dashboard/reservas", { waitUntil: "networkidle" });
    await omitirRecorridoSiAparece(page);
    await page.getByRole("button", { name: /^Asistencia/i }).click();
    await page.getByPlaceholder(/Buscar cliente/i).fill(clienteNombre);

    const fila = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "08:00 - 08:30" });

    await expect(fila).toContainText("Pendiente");
    await expect(fila).toContainText("Registrar asistencia");
    await expect(fila).not.toContainText("Próxima");
    await fila.getByTitle("Marcar como atendida y completada").click();
    await page
      .getByRole("dialog", { name: "Confirmar servicio completado" })
      .getByRole("button", { name: "Sí, marcar como completada" })
      .click();

    await expect(
      page.getByRole("button", { name: /Completadas/i }),
    ).toHaveClass(/bg-primary/);
    const filaCompletada = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "08:00 - 08:30" });
    await expect(filaCompletada).toContainText("Completada");
    await expect(filaCompletada).not.toContainText("Registrar asistencia");

    const { data: cita, error } = await supabaseAdmin()
      .from("citas")
      .select("estado")
      .eq("id", citaPendientePasadaId)
      .single();

    expect(error).toBeNull();
    expect(cita?.estado).toBe("completada");
  });

  test("cierra una reserva pasada como no asistida", async ({ page }) => {
    await page.goto("/dashboard/reservas", { waitUntil: "networkidle" });
    await omitirRecorridoSiAparece(page);
    await page.getByRole("button", { name: /^Asistencia/i }).click();
    await page.getByPlaceholder(/Buscar cliente/i).fill(clienteNombre);

    const fila = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "09:00 - 09:30" });

    await expect(fila).toContainText("Pendiente");
    await expect(fila).toContainText("Registrar asistencia");
    await fila.getByTitle("Cerrar como no asistida").click();
    const dialog = page.getByRole("dialog", {
      name: "Confirmar que no asistió",
    });
    await expect(dialog).toContainText("09:00");
    await dialog
      .getByRole("button", { name: "Sí, marcar como no asistió" })
      .click();

    await expect(
      page.getByRole("button", { name: /No asistieron/i }),
    ).toHaveClass(/bg-primary/);
    const filaNoAsistio = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "09:00 - 09:30" });
    await expect(filaNoAsistio).toContainText("No asistió");
    await expect(filaNoAsistio).not.toContainText("Registrar asistencia");

    const { data: cita, error } = await supabaseAdmin()
      .from("citas")
      .select("estado")
      .eq("id", citaAusenteId)
      .single();

    expect(error).toBeNull();
    expect(cita?.estado).toBe("no_asistio");
  });

  test("confirma antes de cancelar una reserva futura", async ({ page }) => {
    await page.goto("/dashboard/reservas", { waitUntil: "networkidle" });
    await omitirRecorridoSiAparece(page);
    await page.getByRole("button", { name: /Confirmadas/i }).click();
    await page.getByPlaceholder(/Buscar cliente/i).fill(clienteNombre);

    const fila = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "08:00 - 08:30" });

    await expect(fila).toContainText("Confirmada");
    await fila.getByTitle("Cancelar reserva futura").click();

    const dialog = page.getByRole("dialog", {
      name: "Confirmar cancelación",
    });
    await expect(dialog).toContainText(clienteNombre);
    await dialog
      .getByRole("button", { name: "Sí, cancelar reserva" })
      .click();

    await expect(
      page.getByRole("button", { name: /Canceladas/i }),
    ).toHaveClass(/bg-primary/);
    const filaCancelada = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: "08:00 - 08:30" });
    await expect(filaCancelada).toContainText("Cancelada");

    const { data: cita, error } = await supabaseAdmin()
      .from("citas")
      .select("estado")
      .eq("id", citaCanceladaId)
      .single();

    expect(error).toBeNull();
    expect(cita?.estado).toBe("cancelada");
  });

  test("incorpora una reserva nueva al volver a la pestaña", async ({
    page,
  }) => {
    await page.goto("/dashboard/reservas", { waitUntil: "networkidle" });
    await omitirRecorridoSiAparece(page);
    await page.getByPlaceholder(/Buscar cliente/i).fill(clienteNombre);

    const { data: cita, error } = await supabaseAdmin()
      .from("citas")
      .insert({
        negocio_id: business.id,
        sucursal_id: business.secondaryBranch!.id,
        cliente_id: clienteId,
        servicio_id: business.service.id,
        empleado_id: business.secondaryEmployee!.id,
        fecha: fechaFutura,
        hora_inicio: "10:00",
        hora_fin: "10:30",
        estado: "pendiente",
        precio: 50000,
        origen: "publico",
        notas: `Actualización automática E2E ${id}`,
      })
      .select("id")
      .single();

    if (error || !cita) {
      throw error ?? new Error("No se pudo crear la reserva para refrescar.");
    }

    citaAutoActualizadaId = cita.id;

    await page.evaluate(() => window.dispatchEvent(new Event("focus")));

    await expect(
      page
        .getByRole("row")
        .filter({ hasText: clienteNombre })
        .filter({ hasText: "10:00 - 10:30" }),
    ).toBeVisible();
  });

  test("edita horario, contacto y notas desde Reservas", async ({ page }) => {
    await page.goto("/dashboard/reservas", { waitUntil: "networkidle" });
    await omitirRecorridoSiAparece(page);
    await page.getByRole("button", { name: /Confirmadas/i }).click();
    await page.getByPlaceholder(/Buscar cliente/i).fill(clienteNombre);

    const fila = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({ hasText: `${diaFecha}/${mesFecha}/2035` });

    await fila.getByLabel("Editar reserva").click();
    const dialog = page.getByRole("dialog", { name: "Editar reserva" });
    const nombreCorregido = `${clienteNombre} corregido`;
    const telefonoCorregido = `0972${id.slice(-6)}`;
    await dialog.getByLabel("Hora de inicio").fill("07:05");
    await dialog.getByLabel("Nombre completo").fill(nombreCorregido);
    await dialog.getByLabel("Teléfono").fill(telefonoCorregido);
    await dialog.getByLabel("Notas internas").fill("Horario corregido por E2E");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(dialog).toBeHidden();
    await expect(fila).toContainText("07:05");
    await expect(fila).toContainText(nombreCorregido);

    const [{ data: cita, error }, { data: cliente, error: clienteError }] =
      await Promise.all([
        supabaseAdmin()
          .from("citas")
          .select("hora_inicio, notas")
          .eq("id", citaFuturaId)
          .single(),
        supabaseAdmin()
          .from("clientes")
          .select("nombre_completo, telefono")
          .eq("id", clienteId)
          .single(),
      ]);

    expect(error).toBeNull();
    expect(clienteError).toBeNull();
    expect(String(cita?.hora_inicio).slice(0, 5)).toBe("07:05");
    expect(cita?.notas).toBe("Horario corregido por E2E");
    expect(cliente?.nombre_completo).toBe(nombreCorregido);
    expect(cliente?.telefono).toBe(telefonoCorregido);
  });

  test("rechaza completar una cita futura aunque se fuerce la API", async ({
    page,
  }) => {
    const response = await page.request.patch(
      `/api/dashboard/citas/${citaFuturaId}`,
      {
        data: { estado: "completada" },
      },
    );

    expect(response.status()).toBe(400);
    await expect(response.text()).resolves.toMatch(/cuando haya finalizado/i);
  });
});
