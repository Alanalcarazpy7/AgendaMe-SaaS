import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

import {
  adjuntarScreenshot,
  esperarDashboardValido,
} from "./helpers/agendame";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";

const fixtures = loadE2EFixtures();
const routes = [
  "/dashboard/empleados",
  "/dashboard/sucursales",
  "/dashboard/recordatorios",
  "/dashboard/configuracion",
  "/dashboard/mi-cuenta",
];

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function expectEmployeeDialogFits(dialog: Locator) {
  const dimensions = await dialog.evaluate((element) => ({
    visibleWidth: element.clientWidth,
    contentWidth: element.scrollWidth,
  }));

  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.visibleWidth + 1);

  const timeInputs = dialog.locator('input[type="time"]');
  await expect(timeInputs.first()).toBeVisible();

  const widths = await timeInputs.evaluateAll((inputs) =>
    inputs.map((input) => input.getBoundingClientRect().width),
  );
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(100);
}

async function capture(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  await expectNoHorizontalOverflow(page);
  await adjuntarScreenshot(page, testInfo, name);
}

async function dismissDashboardTour(page: Page) {
  const dismiss = page.getByRole("button", { name: /Omitir recorrido/i });
  const appeared = await dismiss
    .waitFor({ state: "visible", timeout: 2_000 })
    .then(() => true)
    .catch(() => false);

  if (appeared) {
    await dismiss.click();
  }
}

test.describe("rediseño de módulos de gestión", () => {
  test.use({ storageState: fixtures.accounts.admin_empresarial.storage });

  test("recorre tareas principales en escritorio", async ({ page }, testInfo) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto("/dashboard/empleados", { waitUntil: "networkidle" });
    await esperarDashboardValido(page);
    await dismissDashboardTour(page);
    await expect(page.getByRole("heading", { name: "Empleados" })).toBeVisible();
    await page.getByRole("button", { name: /Nuevo empleado/i }).first().click();
    const employeeDialog = page.getByRole("dialog", { name: /Nuevo empleado/i });
    await expect(employeeDialog).toBeVisible();
    await expect(employeeDialog.getByRole("button", { name: /Crear empleado/i })).toBeDisabled();
    await expectEmployeeDialogFits(employeeDialog);
    await capture(page, testInfo, "gestion-empleado-dialog-desktop.png");
    await employeeDialog.getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("tab", { name: /Asignación por sucursal/i }).click();
    await expect(
      page.getByRole("heading", { name: "Sucursal de trabajo" }),
    ).toBeVisible();
    await capture(page, testInfo, "gestion-empleados-desktop.png");

    await page.goto("/dashboard/sucursales", { waitUntil: "networkidle" });
    await esperarDashboardValido(page);
    await page.getByRole("button", { name: "Nueva sucursal" }).click();
    await expect(page.getByLabel("Nombre")).toBeVisible();
    await page
      .getByTestId("dashboard-main-content")
      .getByRole("button", { name: "Cerrar", exact: true })
      .click();
    await page.getByRole("tab", { name: /Usuarios y accesos/i }).click();
    await page.getByRole("button", { name: "Invitar usuario" }).click();
    await expect(page.getByLabel("Correo")).toBeVisible();
    await capture(page, testInfo, "gestion-sucursales-desktop.png");

    await page.goto("/dashboard/recordatorios", { waitUntil: "networkidle" });
    await esperarDashboardValido(page);
    await expect(
      page.getByRole("heading", { name: "Recordatorios" }),
    ).toBeVisible();
    await capture(page, testInfo, "gestion-recordatorios-desktop.png");

    await page.goto("/dashboard/configuracion", { waitUntil: "networkidle" });
    await esperarDashboardValido(page);
    await page.getByRole("tab", { name: "Reservas y horarios" }).click();
    await expect(
      page.getByRole("heading", { name: "Intervalo de reservas" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Información" }).click();
    await expect(
      page.getByRole("heading", { name: "Datos del negocio" }),
    ).toBeVisible();
    await capture(page, testInfo, "gestion-configuracion-desktop.png");

    await page.goto("/dashboard/mi-cuenta", { waitUntil: "networkidle" });
    await esperarDashboardValido(page);
    await page.getByRole("button", { name: "Apariencia" }).click();
    await expect(
      page.getByRole("heading", { name: "Apariencia y avisos" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Seguridad" }).click();
    await expect(
      page.getByRole("heading", { name: "Seguridad" }),
    ).toBeVisible();
    await capture(page, testInfo, "gestion-mi-cuenta-desktop.png");

    expect(browserErrors).toEqual([]);
  });

  for (const route of routes) {
    test(`mantiene ${route} estable en móvil`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await esperarDashboardValido(page);
      await dismissDashboardTour(page);

      if (route === "/dashboard/empleados") {
        await page.getByRole("button", { name: /Nuevo empleado/i }).first().click();
        const employeeDialog = page.getByRole("dialog", { name: /Nuevo empleado/i });
        await expect(employeeDialog).toBeVisible();
        await expectEmployeeDialogFits(employeeDialog);
        await capture(page, testInfo, "gestion-empleado-dialog-mobile.png");
        await employeeDialog.getByRole("button", { name: "Cancelar" }).click();
      }

      await capture(
        page,
        testInfo,
        `gestion-${route.split("/").pop()}-mobile.png`,
      );
    });
  }
});
