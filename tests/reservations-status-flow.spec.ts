import { expect, test } from "@playwright/test";

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
      },
      {
        fecha: fechaFutura,
        hora_inicio: "07:00",
        hora_fin: "07:30",
      },
    ].map((cita) => ({
      ...cita,
      negocio_id: business.id,
      sucursal_id: business.secondaryBranch!.id,
      cliente_id: clienteId,
      servicio_id: business.service.id,
      empleado_id: business.secondaryEmployee!.id,
      estado: "confirmada",
      precio: 50000,
      origen: "dashboard",
      notas: `Flujo de estados E2E ${id}`,
    }));

    const { data: citas, error: citasError } = await supabase
      .from("citas")
      .insert(citasBase)
      .select("id, fecha");

    if (citasError || !citas) {
      throw citasError ?? new Error("No se pudieron crear las citas de estados.");
    }

    citaPasadaId =
      citas.find((cita) => cita.fecha === fechaPasada)?.id ?? "";
    citaFuturaId =
      citas.find((cita) => cita.fecha === fechaFutura)?.id ?? "";
  });

  test.afterAll(async () => {
    const supabase = supabaseAdmin();
    const citasIds = [citaPasadaId, citaFuturaId].filter(Boolean);

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

    const omitirRecorrido = page.getByRole("button", {
      name: /Omitir recorrido/i,
    });
    if (await omitirRecorrido.isVisible()) {
      await omitirRecorrido.click();
    }

    await page.getByRole("button", { name: /Confirmadas/i }).click();
    await page
      .getByPlaceholder(/Buscar cliente/i)
      .fill(clienteNombre);

    const fila = page
      .getByRole("row")
      .filter({ hasText: clienteNombre })
      .filter({
        hasText: `${diaFecha}/${mesFecha}/2023`,
      });

    await expect(fila).toBeVisible();

    const completar = fila.getByTitle("Marcar servicio como completado");
    await expect(completar).toBeEnabled();
    await completar.click();

    await expect(fila).toContainText("Completada");
    await expect(
      page.getByRole("button", { name: /Completadas/i }),
    ).toHaveClass(/bg-primary/);
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
        .filter({ hasText: `${diaFecha}/${mesFecha}/2023` }),
    ).toContainText("Completada");
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
