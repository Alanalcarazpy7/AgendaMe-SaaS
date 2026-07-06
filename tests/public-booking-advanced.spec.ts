import { test, expect } from "@playwright/test";
import { AGENDA, crearReservaPublica, siguienteLunesIso, sumarDiasIso } from "./helpers/agendame";

test("negocio inexistente muestra página no encontrada o 404", async ({ page }) => {
  const response = await page.goto(`/reservar/no-existe-${Date.now()}`, {
    waitUntil: "domcontentloaded",
  });

  expect(response?.status()).toBeGreaterThanOrEqual(400);
});

test("cambiar sucursal limpia el servicio seleccionado", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") }).click();
  await page.getByRole("button", { name: new RegExp(AGENDA.servicio, "i") }).click();

  await expect(page.locator("body")).toContainText(new RegExp(`${AGENDA.servicio}.*min`, "i"));

  await page.getByRole("button", { name: /Sucursal principal/i }).click();

  await expect(page.locator("body")).toContainText(/Seleccioná un servicio/i);
});

test("reserva pública genera link de seguimiento válido", async ({ page }) => {
  const reserva = await crearReservaPublica(page, {
    clientePrefijo: "Cliente Link",
    fechaReserva: sumarDiasIso(siguienteLunesIso(), 35),
  });

  expect(reserva.seguimientoUrl).toBeTruthy();
  expect(reserva.seguimientoUrl).toMatch(/seguimiento|reserva|turno/i);

  console.log(`Link seguimiento: ${reserva.seguimientoUrl}`);
});