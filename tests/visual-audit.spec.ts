import { test } from "@playwright/test";
import { expect } from "@playwright/test";
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

      const sidebarBox = await page.getByTestId("dashboard-sidebar-frame").boundingBox();
      const contentBox = await page.getByTestId("dashboard-main-content").boundingBox();
      expect(sidebarBox).not.toBeNull();
      expect(contentBox).not.toBeNull();
      expect(contentBox!.x).toBeGreaterThanOrEqual(sidebarBox!.x + sidebarBox!.width);

      const nombre = ruta.replaceAll("/", "_").replace(/^_/, "") || "dashboard";

      await adjuntarScreenshot(page, testInfo, `${nombre}.png`);
    });
  }
});
