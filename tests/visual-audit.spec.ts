import { test } from "@playwright/test";
import { AGENDA, RUTAS_ADMIN, adjuntarScreenshot, esperarDashboardValido, esperarPaginaSinErrores } from "./helpers/agendame";

test("captura visual de reserva pública", async ({ page }, testInfo) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await adjuntarScreenshot(page, testInfo, "reserva-publica.png");
});

test.describe("capturas visuales dashboard admin", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  for (const ruta of RUTAS_ADMIN) {
    test(`captura visual admin ${ruta}`, async ({ page }, testInfo) => {
      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarDashboardValido(page);

      const nombre = ruta.replaceAll("/", "_").replace(/^_/, "") || "dashboard";

      await adjuntarScreenshot(page, testInfo, `${nombre}.png`);
    });
  }
});