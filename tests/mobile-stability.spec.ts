import { test, expect } from "@playwright/test";
import { AGENDA, esperarDashboardValido, esperarPaginaSinErrores } from "./helpers/agendame";

test("reserva pública móvil permite avanzar hasta elegir servicio", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await page.getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") }).click();

  await expect(page.getByRole("button", { name: new RegExp(AGENDA.servicio, "i") })).toBeVisible();

  await page.getByRole("button", { name: new RegExp(AGENDA.servicio, "i") }).click();

  await expect(page.locator("body")).toContainText(new RegExp(AGENDA.servicio, "i"));
});

test.describe("dashboard móvil admin estable", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  for (const ruta of ["/dashboard", "/dashboard/reservas", "/dashboard/citas", "/dashboard/clientes"]) {
    test(`admin móvil carga ${ruta}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarDashboardValido(page);

      console.log(`Mobile admin OK: ${ruta}`);
    });
  }
});