import { test, expect } from "@playwright/test";
import { AGENDA, esperarPaginaSinErrores } from "./helpers/agendame";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  `/reservar/${AGENDA.slug}`,
];

test.describe("performance pública básica", () => {
  for (const ruta of PUBLIC_ROUTES) {
    test(`carga pública rápida: ${ruta}`, async ({ page }) => {
      const inicio = Date.now();

      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarPaginaSinErrores(page);

      const duracion = Date.now() - inicio;

      expect(duracion, `${ruta} tardó demasiado: ${duracion}ms`).toBeLessThan(8000);

      console.log(`PUBLIC PERF OK ${ruta}: ${duracion}ms`);
    });
  }
});

test.describe("performance dashboard admin", () => {
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

  for (const ruta of rutas) {
    test(`dashboard carga en tiempo aceptable: ${ruta}`, async ({ page }) => {
      const inicio = Date.now();

      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarPaginaSinErrores(page);

      await expect(page).not.toHaveURL(/\/login/i);
      await expect(page).not.toHaveURL(/\/dashboard\/sin-permiso/i);

      const duracion = Date.now() - inicio;

      expect(duracion, `${ruta} tardó demasiado: ${duracion}ms`).toBeLessThan(10000);

      console.log(`DASHBOARD PERF OK ${ruta}: ${duracion}ms`);
    });
  }
});