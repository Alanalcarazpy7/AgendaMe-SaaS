import { expect, type Browser, type BrowserContext, type Page, type TestInfo } from "@playwright/test";

import fs from "node:fs";
import path from "node:path";
import { hasE2EFixtures, loadE2EFixtures } from "./e2e-fixtures";

const fixtures = hasE2EFixtures() ? loadE2EFixtures() : null;
const agendaBusiness = fixtures?.businesses.empresarial;

export const AGENDA = {
  slug: agendaBusiness?.slug ?? "barberia",
  negocio: agendaBusiness?.name ?? "Barberia",
  sucursal: agendaBusiness?.secondaryBranch?.nombre ?? "Secundaria",
  servicio: agendaBusiness?.service.nombre ?? "Barberia1",
  adminStorage: "tests/.auth/admin.json",
  gerenteStorage: "tests/.auth/gerente.json",
  recepcionStorage: "tests/.auth/recepcion.json",
  empleadoStorage: "tests/.auth/empleado.json",
};

export const RUTAS_ADMIN = [
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

export const RUTAS_GERENTE = [
  "/dashboard",
  "/dashboard/citas",
  "/dashboard/reservas",
  "/dashboard/clientes",
  "/dashboard/empleados",
  "/dashboard/reportes",
  "/dashboard/exportar",
  "/dashboard/recordatorios",
  "/dashboard/mi-cuenta",
];

export const RUTAS_RECEPCION = [
  "/dashboard",
  "/dashboard/citas",
  "/dashboard/reservas",
  "/dashboard/clientes",
  "/dashboard/recordatorios",
  "/dashboard/mi-cuenta",
];

export const RUTAS_EMPLEADO = [
  "/dashboard",
  "/dashboard/citas",
  "/dashboard/mi-cuenta",
];

export function siguienteLunesIso() {
  const date = new Date();
  const dia = date.getDay();
  const diasHastaLunes = (1 - dia + 7) % 7 || 7;

  date.setDate(date.getDate() + diasHastaLunes);

  return toIsoDate(date);
}

export function sumarDiasIso(fechaIso: string, dias: number) {
  const date = new Date(`${fechaIso}T12:00:00`);
  date.setDate(date.getDate() + dias);
  return toIsoDate(date);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function uniqueId() {
  const timestamp = String(Date.now()).slice(-7);
  const random = Math.floor(Math.random() * 999).toString().padStart(3, "0");

  return `${timestamp}${random}`;
}

export type ReservaCreada = {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  fechaReserva: string;
  horarioElegido: string;
  seguimientoUrl: string | null;
};

export async function crearReservaPublica(
  page: Page,
  opciones?: {
    clientePrefijo?: string;
    fechaReserva?: string;
    sucursal?: string;
    servicio?: string;
    indiceHorario?: number;
  }
): Promise<ReservaCreada> {
  const id = uniqueId();

  const clienteNombre = `${opciones?.clientePrefijo ?? "Cliente Test"} ${id}`;
  const clienteTelefono = `0982${id.slice(-6)}`;
  const clienteEmail = `cliente.test.${id}@example.com`;
  const fechaReserva = opciones?.fechaReserva ?? siguienteLunesIso();
  const sucursal = opciones?.sucursal ?? AGENDA.sucursal;
  const servicio = opciones?.servicio ?? AGENDA.servicio;

  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);
  await page.waitForLoadState("networkidle");
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `2001:db8:${id.slice(0, 4)}:${id.slice(-4)}::1`,
  });

  await expect(page.locator("body")).toContainText(/Reservas? online/i);
  await expect(page.locator("body")).toContainText(new RegExp(AGENDA.negocio, "i"));

  await page.getByRole("button", { name: new RegExp(sucursal, "i") }).click();
  await page.getByRole("button", { name: new RegExp(servicio, "i") }).click();

  const availabilityResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === `/api/public/disponibilidad/${AGENDA.slug}` &&
      url.searchParams.get("fecha") === fechaReserva &&
      response.request().method() === "GET"
    );
  });
  await page.locator('input[type="date"]').fill(fechaReserva);
  await availabilityResponse;

  const horarios = page.getByRole("button", {
    name: /^\d{2}:\d{2}$/,
  });

  await expect(
    horarios.first(),
    `No apareció ningún horario disponible para ${sucursal} / ${servicio} en ${fechaReserva}.`
  ).toBeVisible({ timeout: 20_000 });

  const cantidadHorarios = await horarios.count();
  const indice = Math.min(opciones?.indiceHorario ?? 0, Math.max(cantidadHorarios - 1, 0));

  const horario = horarios.nth(indice);
  const horarioElegido = (await horario.textContent())?.trim() ?? "";

  await horario.click();

  await page.locator('input[placeholder="Tu nombre"]').fill(clienteNombre);
  await page.locator('input[placeholder="0981..."]').fill(clienteTelefono);
  await page.locator('input[placeholder="email@ejemplo.com"]').fill(clienteEmail);
  await page.locator('input[placeholder="Detalle adicional"]').fill(`Reserva automática Playwright ${id}`);

  await page.getByRole("button", { name: /Solicitar reserva/i }).click();

  await expect(page.locator("body")).toContainText(/Reserva enviada/i, {
    timeout: 15_000,
  });

  const seguimientoUrl = await page
    .getByRole("link", { name: /Ver estado de mi reserva/i })
    .getAttribute("href");

  return {
    clienteNombre,
    clienteTelefono,
    clienteEmail,
    fechaReserva,
    horarioElegido,
    seguimientoUrl,
  };
}

export async function abrirDashboardComoAdmin(browser: Browser, path: string) {
  return abrirDashboardConStorage(browser, AGENDA.adminStorage, path);
}

export async function abrirDashboardConStorage(
  browser: Browser,
  storageState: string,
  path: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    storageState,
    baseURL: "http://localhost:3000",
  });

  const page = await context.newPage();

  await page.goto(path, { waitUntil: "domcontentloaded" });

  return { context, page };
}

export async function esperarPaginaSinErrores(page: Page) {
  const body = page.locator("body");

  await expect(body).not.toContainText(/Build Error/i);
  await expect(body).not.toContainText(/Application error/i);
  await expect(body).not.toContainText(/Unhandled Runtime Error/i);
  await expect(body).not.toContainText(/Error parsing package\.json/i);
  await expect(body).not.toContainText(/Internal Server Error/i);
}

export async function esperarDashboardValido(page: Page) {
  await esperarPaginaSinErrores(page);

  await expect(page).not.toHaveURL(/\/login/i);
  await expect(page).not.toHaveURL(/\/dashboard\/sin-permiso/i);

  await expect(page.locator("body")).toBeVisible();
}

export async function adjuntarScreenshot(page: Page, testInfo: TestInfo, nombre: string) {
  const screenshotDir = path.join(process.cwd(), ".e2e", "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, nombre),
  });
  const buffer = await page.screenshot({ fullPage: true });

  await testInfo.attach(nombre, {
    body: buffer,
    contentType: "image/png",
  });
}
