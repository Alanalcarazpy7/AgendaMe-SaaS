import { test, expect } from "@playwright/test";
import { crearReservaPublica, sumarDiasIso, siguienteLunesIso } from "./helpers/agendame";

test("cliente puede abrir el estado de su reserva", async ({ page }) => {
  const reserva = await crearReservaPublica(page, {
    clientePrefijo: "Cliente Seguimiento",
    fechaReserva: sumarDiasIso(siguienteLunesIso(), 21),
  });

  await page.getByRole("link", { name: /Ver estado de mi reserva/i }).click();

  await expect(page.locator("body")).toContainText(/reserva|estado|pendiente/i, {
    timeout: 15_000,
  });

  console.log(
    `Seguimiento abierto para: ${reserva.clienteNombre} - ${reserva.fechaReserva} ${reserva.horarioElegido}`
  );
});