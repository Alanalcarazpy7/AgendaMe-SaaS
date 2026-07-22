import { test, expect } from "@playwright/test";
import { AGENDA, adjuntarScreenshot, esperarDashboardValido, esperarPaginaSinErrores } from "./helpers/agendame";

async function esperarSinDesbordeHorizontal(page: import("@playwright/test").Page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
}

test("reserva pública móvil permite avanzar hasta elegir servicio", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await esperarPaginaSinErrores(page);

  await page.getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") }).click();

  await expect(page.getByRole("button", { name: new RegExp(AGENDA.servicio, "i") })).toBeVisible();

  await page.getByRole("button", { name: new RegExp(AGENDA.servicio, "i") }).click();

  await expect(page.locator("body")).toContainText(new RegExp(AGENDA.servicio, "i"));
  await esperarSinDesbordeHorizontal(page);
  await adjuntarScreenshot(page, testInfo, "mobile-reserva-publica.png");
});

test.describe("dashboard móvil admin estable", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  for (const ruta of ["/dashboard", "/dashboard/reservas", "/dashboard/citas", "/dashboard/clientes"]) {
    test(`admin móvil carga ${ruta}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarDashboardValido(page);
      await esperarSinDesbordeHorizontal(page);

      const nombre = ruta.replaceAll("/", "_").replace(/^_/, "") || "dashboard";
      await adjuntarScreenshot(page, testInfo, `mobile-${nombre}.png`);

      console.log(`Mobile admin OK: ${ruta}`);
    });
  }
});
