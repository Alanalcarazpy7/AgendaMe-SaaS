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

test("planes muestra la matriz completa sin desbordar la página", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/planes", { waitUntil: "domcontentloaded" });

    await esperarPaginaSinErrores(page);

    const body = page.locator("body");
    await expect(body).toContainText(/Gratis/i);
    await expect(body).toContainText(/Profesional/i);
    await expect(body).toContainText(/Recordatorios manuales por WhatsApp/i);
    await expect(body).toContainText(/Operación empresarial/i);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
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
