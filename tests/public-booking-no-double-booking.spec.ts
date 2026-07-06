import { test, expect } from "@playwright/test";
import {
  AGENDA,
  crearReservaPublica,
  esperarPaginaSinErrores,
  siguienteLunesIso,
  sumarDiasIso,
} from "./helpers/agendame";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("no permite volver a reservar el mismo horario ocupado", async ({ page }) => {
  test.setTimeout(90_000);

  const fechaReserva = sumarDiasIso(siguienteLunesIso(), 42);

  const reserva = await crearReservaPublica(page, {
    clientePrefijo: "Cliente Anti Doble",
    fechaReserva,
    indiceHorario: 0,
  });

  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await expect(page.locator("body")).toContainText(/Reserva online/i, {
    timeout: 20_000,
  });

  const sucursalButton = page.getByRole("button", {
    name: new RegExp(AGENDA.sucursal, "i"),
  });

  await expect(sucursalButton).toBeVisible({ timeout: 20_000 });
  await sucursalButton.click();

  await expect(page.locator("body")).toContainText(/Elegí un servicio/i, {
    timeout: 20_000,
  });

  await expect(page.locator("body")).toContainText(new RegExp(AGENDA.servicio, "i"), {
    timeout: 20_000,
  });

  const servicioButton = page.getByRole("button", {
    name: new RegExp(AGENDA.servicio, "i"),
  });

  await expect(
    servicioButton,
    `No apareció el servicio ${AGENDA.servicio} para la sucursal ${AGENDA.sucursal}.`
  ).toBeVisible({ timeout: 20_000 });

  await servicioButton.click();

  await page.locator('input[type="date"]').fill(fechaReserva);

  await expect(page.getByText(/Cargando horarios/i))
    .toBeHidden({ timeout: 20_000 })
    .catch(() => {});

  await page.waitForTimeout(1000);

  const horarioOcupado = page.getByRole("button", {
    name: new RegExp(`^${escapeRegExp(reserva.horarioElegido)}$`),
  });

  await expect(
    horarioOcupado,
    `El horario ${reserva.horarioElegido} ya fue reservado y no debería aparecer otra vez.`
  ).toHaveCount(0, { timeout: 10_000 });

  console.log(`Horario bloqueado correctamente: ${fechaReserva} ${reserva.horarioElegido}`);
});