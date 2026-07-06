import { test, expect } from "@playwright/test";
import { esperarDashboardValido } from "./helpers/agendame";

test.use({ storageState: "tests/.auth/admin.json" });

const rutas = [
  "/dashboard",
  "/dashboard/reservas",
  "/dashboard/citas",
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

test("admin puede navegar varias veces sin romper el dashboard", async ({ page }) => {
  test.setTimeout(180_000);

  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(30_000);

  for (const vuelta of [1, 2, 3]) {
    for (const ruta of rutas) {
      const inicio = Date.now();

      await page.goto(ruta, { waitUntil: "domcontentloaded", timeout: 30_000 });

      await esperarDashboardValido(page);

      const duracion = Date.now() - inicio;

      expect(duracion, `${ruta} vuelta ${vuelta} tardó demasiado`).toBeLessThan(15_000);

      console.log(`Navegación vuelta ${vuelta} OK: ${ruta} ${duracion}ms`);
    }
  }
});