import { test, expect } from "@playwright/test";
import { AGENDA, esperarPaginaSinErrores } from "./helpers/agendame";

const rutasPublicas = [
  "/",
  "/login",
  `/reservar/${AGENDA.slug}`,
];

const WARNING_CRITICO =
  /Encountered a script tag|hydration|Each child in a list|unique ["']key["']|Cannot update a component/i;

function observarConsola(page: import("@playwright/test").Page) {
  const errores: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" || (msg.type() === "warning" && WARNING_CRITICO.test(msg.text()))) {
      errores.push(msg.text());
    }
  });

  return errores;
}

test.describe("sin errores graves en consola pública", () => {
  for (const ruta of rutasPublicas) {
    test(`sin errores consola: ${ruta}`, async ({ page }) => {
      const errores = observarConsola(page);

      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarPaginaSinErrores(page);

      const erroresFiltrados = errores.filter((error) => {
        return !/favicon/i.test(error) && !/chrome-extension/i.test(error);
      });

      expect(erroresFiltrados, erroresFiltrados.join("\n")).toHaveLength(0);

      console.log(`Consola pública OK: ${ruta}`);
    });
  }
});

test.describe("sin errores graves en consola dashboard admin", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  for (const ruta of ["/dashboard", "/dashboard/reservas", "/dashboard/citas", "/dashboard/clientes"]) {
    test(`sin errores consola admin: ${ruta}`, async ({ page }) => {
      const errores = observarConsola(page);

      await page.goto(ruta, { waitUntil: "domcontentloaded" });

      await esperarPaginaSinErrores(page);

      await expect(page).not.toHaveURL(/\/login/i);

      const erroresFiltrados = errores.filter((error) => {
        return !/favicon/i.test(error) && !/chrome-extension/i.test(error);
      });

      expect(erroresFiltrados, erroresFiltrados.join("\n")).toHaveLength(0);

      console.log(`Consola admin OK: ${ruta}`);
    });
  }
});
