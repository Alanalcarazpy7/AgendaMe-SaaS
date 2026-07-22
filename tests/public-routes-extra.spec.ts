import { test, expect } from "@playwright/test";
import { AGENDA, esperarPaginaSinErrores } from "./helpers/agendame";

test("home carga sin error", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await expect(page.locator("body")).toBeVisible();
});

test("login carga sin error", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await expect(page.locator("body")).toBeVisible();
});

test("reserva pública muestra datos principales del negocio", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await expect(page.locator("body")).toContainText(/Reservas? online/i);
  await expect(page.locator("body")).toContainText(/Reservá tu turno/i);
  await expect(page.locator("body")).toContainText(/Elegí una sucursal/i);
  await expect(page.locator("body")).toContainText(/Elegí un servicio/i);
  await expect(page.locator("body")).toContainText(/Tus datos/i);
});
