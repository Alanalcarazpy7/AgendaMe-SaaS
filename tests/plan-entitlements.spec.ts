import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { esperarPaginaSinErrores } from "./helpers/agendame";

const fixtures = loadE2EFixtures();

const premiumRoutes = [
  { path: "/dashboard/reportes", title: "Reportes", allowedTitle: "Reportes", minimum: 1 },
  { path: "/dashboard/exportar", title: "Exportar CSV", allowedTitle: "Exportar a Excel", minimum: 2 },
  { path: "/dashboard/recordatorios", title: "Recordatorios", allowedTitle: "Recordatorios", minimum: 2 },
  { path: "/dashboard/sucursales", title: "Sucursales", allowedTitle: "Sucursales", minimum: 3 },
];

const plans = [
  { key: "gratis", level: 0, storage: fixtures.accounts.admin_gratis.storage },
  { key: "basico", level: 1, storage: fixtures.accounts.admin_basico.storage },
  { key: "profesional", level: 2, storage: fixtures.accounts.admin_profesional.storage },
  { key: "empresarial", level: 3, storage: fixtures.accounts.admin_empresarial.storage },
];

for (const plan of plans) {
  test.describe(`permisos del plan ${plan.key}`, () => {
    test.use({ storageState: plan.storage });

    test("muestra el plan y sus cinco límites", async ({ page }) => {
      await page.goto("/dashboard/planes", { waitUntil: "domcontentloaded" });
      await esperarPaginaSinErrores(page);

      await expect(page.locator("body")).toContainText(new RegExp(`Plan ${plan.key}`, "i"));
      for (const label of [
        "Citas del mes",
        "Empleados activos",
        "Servicios activos",
        "Clientes activos",
        "Sucursales activas",
      ]) {
        await expect(page.locator("body")).toContainText(label);
      }
    });

    for (const feature of premiumRoutes) {
      test(`${feature.title}: ${plan.level >= feature.minimum ? "habilitado" : "restringido"}`, async ({ page }) => {
        await page.goto(feature.path, { waitUntil: "domcontentloaded" });
        await esperarPaginaSinErrores(page);
        if (plan.level >= feature.minimum) {
          await expect(page.locator("body")).toContainText(feature.allowedTitle);
          await expect(page.locator("body")).not.toContainText(/Disponible desde Plan/i);
        } else {
          await expect(page.locator("body")).toContainText(feature.title);
          await expect(page.locator("body")).toContainText(/Disponible desde Plan/i);
          await expect(page.getByRole("link", { name: /Mejorar plan/i })).toBeVisible();
        }
      });
    }
  });
}

test.describe("acceso de sucursal tras bajar de plan", () => {
  test.use({ storageState: fixtures.accounts.profesional_restringido.storage });

  test("conserva el dashboard y explica que necesita Empresarial", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.locator("body")).toContainText(/Este acceso necesita el plan Empresarial/i);
    await expect(page.locator("body")).toContainText(/No se borra nada por bajar de plan/i);
    await expect(page.locator("body")).toContainText(/Historial conservado/i);
    await expect(page.getByRole("complementary").filter({ hasText: /Que pasa ahora/i })).toBeVisible();
  });
});
