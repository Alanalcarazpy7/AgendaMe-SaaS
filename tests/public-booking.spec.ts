import { test, expect } from "@playwright/test";
import { AGENDA, abrirDashboardComoAdmin, crearReservaPublica } from "./helpers/agendame";

test("cliente puede crear reserva pública y admin la ve en reservas", async ({ page, browser }) => {
  const reserva = await crearReservaPublica(page, {
    clientePrefijo: "Cliente Test",
  });

  const { context, page: adminPage } = await abrirDashboardComoAdmin(
    browser,
    "/dashboard/reservas"
  );

  await expect(adminPage.locator("body")).toContainText(reserva.clienteNombre, {
    timeout: 15_000,
  });

  await expect(adminPage.locator("body")).toContainText(AGENDA.servicio);
  await expect(adminPage.locator("body")).toContainText(AGENDA.sucursal);

  console.log(
    `Reserva creada y encontrada en dashboard: ${reserva.clienteNombre} - ${reserva.fechaReserva} ${reserva.horarioElegido}`
  );

  await context.close();
});
