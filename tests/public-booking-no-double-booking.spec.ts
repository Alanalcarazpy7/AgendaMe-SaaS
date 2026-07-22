import { test, expect } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { supabaseAdmin } from "./helpers/supabase-db";
import {
  AGENDA,
  crearReservaPublica,
  esperarPaginaSinErrores,
  siguienteLunesIso,
  sumarDiasIso,
  uniqueId,
} from "./helpers/agendame";

const fixtures = loadE2EFixtures();
const business = fixtures.businesses.empresarial;

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

  await expect(page.locator("body")).toContainText(/Reservas? online/i, {
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

test("dos solicitudes simultaneas solo crean una cita activa", async ({ request }) => {
  test.setTimeout(90_000);

  const fecha = sumarDiasIso(siguienteLunesIso(), 399);
  const query = new URLSearchParams({
    servicioId: business.service.id,
    sucursalId: business.secondaryBranch!.id,
    fecha,
  });
  const availability = await request.get(
    `/api/public/disponibilidad/${business.slug}?${query.toString()}`
  );
  expect(availability.ok()).toBeTruthy();

  const availabilityBody = (await availability.json()) as { slots?: string[] };
  const horaInicio = availabilityBody.slots?.[0];
  expect(horaInicio, `No hay horario para la prueba concurrente del ${fecha}.`).toBeTruthy();

  const id = uniqueId();
  const payloadBase = {
    servicioId: business.service.id,
    sucursalId: business.secondaryBranch!.id,
    fecha,
    horaInicio,
    clienteEmail: "",
    notas: `Concurrencia E2E ${id}`,
  };

  const [first, second] = await Promise.all([
    request.post(`/api/public/reservas/${business.slug}`, {
      headers: { "x-forwarded-for": `2001:db8:${id.slice(0, 4)}:1::1` },
      data: {
        ...payloadBase,
        clienteNombre: `Concurrente A ${id}`,
        clienteTelefono: `0971${id.slice(-6)}`,
      },
    }),
    request.post(`/api/public/reservas/${business.slug}`, {
      headers: { "x-forwarded-for": `2001:db8:${id.slice(0, 4)}:2::1` },
      data: {
        ...payloadBase,
        clienteNombre: `Concurrente B ${id}`,
        clienteTelefono: `0972${id.slice(-6)}`,
      },
    }),
  ]);

  const statuses = [first.status(), second.status()];
  expect(statuses.filter((status) => status === 200)).toHaveLength(1);
  expect(statuses.filter((status) => status === 409 || status === 400)).toHaveLength(1);

  const supabase = supabaseAdmin();
  const { count, error } = await supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("negocio_id", business.id)
    .eq("sucursal_id", business.secondaryBranch!.id)
    .eq("fecha", fecha)
    .eq("hora_inicio", horaInicio!)
    .neq("estado", "cancelada");

  expect(error).toBeNull();
  expect(count).toBe(1);
});
