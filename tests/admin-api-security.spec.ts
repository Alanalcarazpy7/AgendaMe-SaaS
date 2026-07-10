import { test, expect } from "@playwright/test";

/**
 * Seguridad directa de las rutas privilegiadas del panel /admin, sin pasar
 * por la UI. No requiere credenciales: todos estos casos deben rechazar a
 * un visitante sin sesión, así que corren de verdad (no se saltan).
 */

const ADMIN_PAGE_ROUTES = [
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

for (const ruta of ADMIN_PAGE_ROUTES) {
  test(`${ruta} sin sesión redirige a login`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login/i);
  });
}

test("negocios/[id] sin sesión redirige a login", async ({ page }) => {
  await page.goto("/admin/negocios/00000000-0000-0000-0000-000000000000", {
    waitUntil: "domcontentloaded",
  });

  await expect(page).toHaveURL(/\/login/i);
});

test("export de negocios sin sesión responde 401, no un archivo", async ({ request }) => {
  const response = await request.get("/api/admin/negocios/exportar", { maxRedirects: 0 });

  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"] ?? "").not.toContain("spreadsheetml");
});

test("export de pagos sin sesión responde 401, no un archivo", async ({ request }) => {
  const response = await request.get("/api/admin/pagos/exportar", { maxRedirects: 0 });

  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"] ?? "").not.toContain("spreadsheetml");
});

test("no se filtran claves de Supabase en el bundle público", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });

  const html = await page.content();

  expect(html).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(html.toLowerCase()).not.toContain("service_role");
});
