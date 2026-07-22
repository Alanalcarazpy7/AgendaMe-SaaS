import { test, expect } from "@playwright/test";
import { AGENDA } from "./helpers/agendame";

test("formulario público exige seleccionar sucursal", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /Solicitar reserva/i }).click();

  await expect(page.locator("body")).toContainText(/Seleccioná una sucursal/i);
});

test("formulario público exige servicio, hora, nombre y teléfono", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") }).click();
  await page.getByRole("button", { name: /Solicitar reserva/i }).click();

  await expect(page.locator("body")).toContainText(/Seleccioná un servicio/i);
});
