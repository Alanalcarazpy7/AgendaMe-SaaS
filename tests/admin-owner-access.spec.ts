import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import { hasE2EFixtures, loadE2EFixtures } from "./helpers/e2e-fixtures";

/**
 * Pruebas de seguridad para /admin (panel privado del propietario).
 *
 * Los storageState de "tests/.auth/*.json" se generan localmente (están en
 * .gitignore, no viajan en el repo) iniciando sesión real con Playwright o
 * copiando las cookies desde un login manual. Si el archivo no existe en el
 * entorno donde corre esto, el caso se salta de forma documentada en vez de
 * inventar credenciales o falsear el resultado.
 */

const ADMIN_TENANT_STORAGE_STATE = "tests/.auth/admin.json"; // usuario admin_global de un negocio (NO propietario de la plataforma)
const PLATFORM_OWNER_STORAGE_STATE = "tests/.auth/superadmin.json"; // propietario real de AgendaMe
const fixtures = hasE2EFixtures() ? loadE2EFixtures() : null;

function storageStateDisponible(relativePath: string) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

test.describe("Acceso a /admin sin sesión", () => {
  test("visitante no autenticado es redirigido a login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login/i);
  });

  test("visitante no autenticado no puede ver contenido del panel", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page.locator("body")).not.toContainText(/Panel del propietario/i);
  });
});

test.describe("Acceso a /admin con usuario normal (admin_global de un negocio)", () => {
  test.skip(
    !storageStateDisponible(ADMIN_TENANT_STORAGE_STATE),
    `Falta ${ADMIN_TENANT_STORAGE_STATE} (storageState local, no versionado). Generar credenciales de prueba antes de correr este caso.`
  );

  test.use({ storageState: ADMIN_TENANT_STORAGE_STATE });

  test("admin_global de negocio no entra al panel del propietario", async ({ page }) => {
    const response = await page.goto("/admin", { waitUntil: "domcontentloaded" });

    // requirePlatformOwner() responde con notFound() para cualquier autenticado
    // que no sea el propietario real: no debe haber contenido del panel ni
    // redirección a login (ya está autenticado), y la ruta debe fallar (404)
    // o mostrar la página not-found de Next.
    expect(response?.status()).toBeGreaterThanOrEqual(400);
    await expect(page.locator("body")).not.toContainText(/Panel del propietario/i);
  });
});

test.describe("Acceso a /admin con el propietario real de la plataforma", () => {
  test.skip(
    !storageStateDisponible(PLATFORM_OWNER_STORAGE_STATE) || !process.env.ADMIN_OWNER_USER_ID,
    `Falta ${PLATFORM_OWNER_STORAGE_STATE} y/o ADMIN_OWNER_USER_ID. Este caso requiere credenciales reales del propietario, que no se inventan.`
  );

  test.use({ storageState: PLATFORM_OWNER_STORAGE_STATE });

  test("propietario entra y ve el panel", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await expect(page).not.toHaveURL(/\/login/i);
    await expect(page.locator("body")).toContainText(/Control privado/i);
    await expect(page.locator("body")).toContainText(/Vista general/i);
  });

  const ownerRoutes = [
    "/admin",
    "/admin/negocios",
    "/admin/suscripciones",
    "/admin/renovaciones",
    "/admin/pagos",
    "/admin/usuarios",
    "/admin/planes",
    "/admin/invitaciones",
    "/admin/auditoria",
    "/admin/analitica",
    "/admin/configuracion",
  ];

  for (const route of ownerRoutes) {
    test(`propietario carga ${route} sin error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);
      await expect(page).not.toHaveURL(/\/login/i);
      await expect(page.locator("body")).not.toContainText(/Internal Server Error|Application error|Build Error/i);
    });
  }

  test("propietario abre el detalle de un negocio", async ({ page }) => {
    test.skip(!fixtures, "Requiere fixtures E2E para identificar un negocio aislado.");
    const response = await page.goto(`/admin/negocios/${fixtures!.businesses.empresarial.id}`, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toContainText(fixtures!.businesses.empresarial.name);
  });
});
