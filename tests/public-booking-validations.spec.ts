import { test, expect } from "@playwright/test";
import { AGENDA } from "./helpers/agendame";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";

const business = loadE2EFixtures().businesses.empresarial;

function ayerEnAsuncion() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";
  const fecha = new Date(
    Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")) - 1,
    ),
  );

  return fecha.toISOString().slice(0, 10);
}

test("formulario público exige seleccionar sucursal", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /Solicitar reserva/i }).click();

  await expect(page.locator("body")).toContainText(/Seleccioná una sucursal/i);
});

test("formulario público exige servicio, hora, nombre y teléfono", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") }).click();
  await page.getByRole("button", { name: /Solicitar reserva/i }).click();

  await expect(page.locator("body")).toContainText(/Seleccioná un servicio/i);
});

test("la API pública rechaza fechas pasadas", async ({ request }) => {
  const fechaPasada = ayerEnAsuncion();
  const disponibilidad = await request.get(
    `/api/public/disponibilidad/${business.slug}?${new URLSearchParams({
      servicioId: business.service.id,
      sucursalId: business.secondaryBranch!.id,
      fecha: fechaPasada,
    }).toString()}`,
  );

  expect(disponibilidad.status()).toBe(400);
  await expect(disponibilidad.text()).resolves.toMatch(/fecha pasada/i);

  const reserva = await request.post(`/api/public/reservas/${business.slug}`, {
    data: {
      servicioId: business.service.id,
      sucursalId: business.secondaryBranch!.id,
      fecha: fechaPasada,
      horaInicio: "10:00",
      clienteNombre: "Cliente fecha pasada",
      clienteTelefono: "0981000000",
    },
  });

  expect(reserva.status()).toBe(400);
  await expect(reserva.text()).resolves.toMatch(/ya pasó/i);
});
