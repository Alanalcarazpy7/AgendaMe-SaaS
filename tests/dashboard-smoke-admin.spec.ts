import { test, expect } from "@playwright/test";
import { esperarPaginaSinErrores } from "./helpers/agendame";

test.use({ storageState: "tests/.auth/admin.json" });

const rutas = [
  "/dashboard",
  "/dashboard/citas",
  "/dashboard/reservas",
  "/dashboard/clientes",
  "/dashboard/empleados",
  "/dashboard/servicios",
  "/dashboard/reportes",
  "/dashboard/exportar",
  "/dashboard/recordatorios",
  "/dashboard/sucursales",
  "/dashboard/planes",
  "/dashboard/configuracion",
  "/dashboard/mi-cuenta",
];

for (const ruta of rutas) {
  test(`admin carga sin errores: ${ruta}`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: "domcontentloaded" });

    await esperarPaginaSinErrores(page);

    await expect(page).not.toHaveURL(/\/login/i);
    await expect(page).not.toHaveURL(/\/dashboard\/sin-permiso/i);

    await expect(page.locator("body")).toBeVisible();

    console.log(`Ruta admin OK: ${ruta}`);
  });
}