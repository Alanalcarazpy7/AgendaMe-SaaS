import { expect, type Browser, type Page } from "@playwright/test";

export const AGENDA = {
  slug: "barberia",
  sucursal: "Secundaria",
  servicio: "Barberia1",
  adminStorage: "tests/.auth/admin.json",
};

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
  return String(Date.now()).slice(-8);
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
  }
): Promise<ReservaCreada> {
  const id = uniqueId();

  const clienteNombre = `${opciones?.clientePrefijo ?? "Cliente Test"} ${id}`;
  const clienteTelefono = `0982${id.slice(0, 6)}`;
  const clienteEmail = `cliente.test.${id}@example.com`;
  const fechaReserva = opciones?.fechaReserva ?? siguienteLunesIso();
  const sucursal = opciones?.sucursal ?? AGENDA.sucursal;
  const servicio = opciones?.servicio ?? AGENDA.servicio;

  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await expect(page.locator("body")).toContainText(/Reserva online/i);
  await expect(page.locator("body")).toContainText(/Barberia|Barbería/i);

  await page.getByRole("button", { name: new RegExp(sucursal, "i") }).click();
  await page.getByRole("button", { name: new RegExp(servicio, "i") }).click();

  await page.locator('input[type="date"]').fill(fechaReserva);

  const primerHorario = page.getByRole("button", {
    name: /^\d{2}:\d{2}$/,
  }).first();

  await expect(
    primerHorario,
    `No apareció ningún horario disponible para ${sucursal} / ${servicio} en ${fechaReserva}.`
  ).toBeVisible({ timeout: 20_000 });

  const horarioElegido = (await primerHorario.textContent())?.trim() ?? "";
  await primerHorario.click();

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
  const context = await browser.newContext({
    storageState: AGENDA.adminStorage,
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
}