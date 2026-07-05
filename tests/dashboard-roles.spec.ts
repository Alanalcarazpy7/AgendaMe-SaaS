import { test, expect, type Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

type RutaPermitida = {
  path: string;
  texto?: RegExp;
};

async function ir(page: Page, path: string) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
}

async function validarPermitida(page: Page, ruta: RutaPermitida) {
  await ir(page, ruta.path);

  await expect(page, `La ruta ${ruta.path} no debe mandar a login`).not.toHaveURL(/\/login/);
  await expect(page, `La ruta ${ruta.path} no debe mandar a sin-acceso`).not.toHaveURL(/\/sin-acceso/);
  await expect(page, `La ruta ${ruta.path} no debe mandar a sin-permiso`).not.toHaveURL(/\/dashboard\/sin-permiso/);
  await expect(page, `La ruta ${ruta.path} no debe mandar a onboarding`).not.toHaveURL(/\/onboarding\/negocio/);

  const body = page.locator("body");

  await expect(body, `La ruta ${ruta.path} no debe mostrar No autenticado`).not.toContainText(/No autenticado/i);
  await expect(body, `La ruta ${ruta.path} no debe mostrar sin acceso`).not.toContainText(/sin acceso/i);
  await expect(body, `La ruta ${ruta.path} no debe mostrar sin permiso`).not.toContainText(/no tenés permiso/i);
  await expect(body, `La ruta ${ruta.path} no debe mostrar solo admin`).not.toContainText(/solo el admin/i);

  if (ruta.texto) {
    await expect(body, `La ruta ${ruta.path} debe contener ${ruta.texto}`).toContainText(ruta.texto);
  }
}

async function validarBloqueada(page: Page, path: string) {
  await ir(page, path);

  const url = page.url();
  const body = await page.locator("body").innerText().catch(() => "");

  const bloqueada =
    url.includes("/sin-acceso") ||
    url.includes("/dashboard/sin-permiso") ||
    url.includes("/login") ||
    /no tenés permiso/i.test(body) ||
    /sin acceso/i.test(body) ||
    /solo el admin/i.test(body) ||
    /no autenticado/i.test(body);

  expect(
    bloqueada,
    `La ruta ${path} debería estar bloqueada, pero quedó accesible en ${url}`
  ).toBeTruthy();
}

const adminPermitidas: RutaPermitida[] = [
  { path: "/dashboard", texto: /Admin global|Vista global|Dashboard/i },
  { path: "/dashboard/reservas", texto: /Reservas/i },
  { path: "/dashboard/citas", texto: /Calendario|Citas/i },
  { path: "/dashboard/clientes", texto: /Clientes/i },
  { path: "/dashboard/empleados", texto: /Empleados/i },
  { path: "/dashboard/servicios", texto: /Servicios/i },
  { path: "/dashboard/reportes", texto: /Reportes/i },
  { path: "/dashboard/exportar", texto: /Exportar/i },
  { path: "/dashboard/recordatorios", texto: /Recordatorios/i },
  { path: "/dashboard/sucursales", texto: /Sucursales|Usuarios con acceso/i },
  { path: "/dashboard/planes", texto: /Planes/i },
  { path: "/dashboard/configuracion", texto: /Configuración/i },
  { path: "/dashboard/mi-cuenta", texto: /Mi cuenta|Datos personales/i },
];

const gerentePermitidas: RutaPermitida[] = [
  { path: "/dashboard", texto: /Gerente|Sucursal|Dashboard/i },
  { path: "/dashboard/reservas", texto: /Reservas/i },
  { path: "/dashboard/citas", texto: /Calendario|Citas/i },
  { path: "/dashboard/clientes", texto: /Clientes/i },
  { path: "/dashboard/empleados", texto: /Empleados/i },
  { path: "/dashboard/reportes", texto: /Reportes/i },
  { path: "/dashboard/exportar", texto: /Exportar/i },
  { path: "/dashboard/recordatorios", texto: /Recordatorios/i },
  { path: "/dashboard/mi-cuenta", texto: /Mi cuenta|Datos personales/i },
];

const gerenteBloqueadas = [
  "/dashboard/sucursales",
  "/dashboard/planes",
  "/dashboard/configuracion",
  "/dashboard/servicios",
];

const recepcionPermitidas: RutaPermitida[] = [
  { path: "/dashboard", texto: /Recepcionista|Sucursal|Dashboard/i },
  { path: "/dashboard/reservas", texto: /Reservas/i },
  { path: "/dashboard/citas", texto: /Calendario|Citas/i },
  { path: "/dashboard/clientes", texto: /Clientes/i },
  { path: "/dashboard/recordatorios", texto: /Recordatorios/i },
  { path: "/dashboard/mi-cuenta", texto: /Mi cuenta|Datos personales/i },
];

const recepcionBloqueadas = [
  "/dashboard/empleados",
  "/dashboard/servicios",
  "/dashboard/reportes",
  "/dashboard/exportar",
  "/dashboard/sucursales",
  "/dashboard/planes",
  "/dashboard/configuracion",
];

const empleadoPermitidas: RutaPermitida[] = [
  { path: "/dashboard", texto: /Personal|Empleado|Sucursal|Dashboard/i },
  { path: "/dashboard/citas", texto: /Calendario|Citas/i },
  { path: "/dashboard/mi-cuenta", texto: /Mi cuenta|Datos personales/i },
];

const empleadoBloqueadas = [
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
];

test.describe("Admin global", () => {
  test.use({ storageState: "tests/.auth/admin.json" });

  for (const ruta of adminPermitidas) {
    test(`puede acceder a ${ruta.path}`, async ({ page }) => {
      await validarPermitida(page, ruta);
    });
  }
});

test.describe("Gerente de sucursal principal", () => {
  test.use({ storageState: "tests/.auth/gerente.json" });

  for (const ruta of gerentePermitidas) {
    test(`puede acceder a ${ruta.path}`, async ({ page }) => {
      await validarPermitida(page, ruta);
    });
  }

  for (const path of gerenteBloqueadas) {
    test(`no puede acceder a ${path}`, async ({ page }) => {
      await validarBloqueada(page, path);
    });
  }
});

test.describe("Recepcionista de sucursal secundaria", () => {
  test.use({ storageState: "tests/.auth/recepcion.json" });

  for (const ruta of recepcionPermitidas) {
    test(`puede acceder a ${ruta.path}`, async ({ page }) => {
      await validarPermitida(page, ruta);
    });
  }

  for (const path of recepcionBloqueadas) {
    test(`no puede acceder a ${path}`, async ({ page }) => {
      await validarBloqueada(page, path);
    });
  }
});

test.describe("Empleado de sucursal", () => {
  test.use({ storageState: "tests/.auth/empleado.json" });

  for (const ruta of empleadoPermitidas) {
    test(`puede acceder a ${ruta.path}`, async ({ page }) => {
      await validarPermitida(page, ruta);
    });
  }

  for (const path of empleadoBloqueadas) {
    test(`no puede acceder a ${path}`, async ({ page }) => {
      await validarBloqueada(page, path);
    });
  }
});