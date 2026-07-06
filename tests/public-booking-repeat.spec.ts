import { test } from "@playwright/test";
import { crearReservaPublica, siguienteLunesIso, sumarDiasIso } from "./helpers/agendame";

test.describe.configure({ mode: "serial" });

const base = siguienteLunesIso();

for (const index of [1, 2, 3]) {
  test(`crea reserva pública en lote #${index}`, async ({ page }) => {
    const fechaReserva = sumarDiasIso(base, (index - 1) * 7);

    const reserva = await crearReservaPublica(page, {
      clientePrefijo: `Cliente Lote ${index}`,
      fechaReserva,
    });

    console.log(
      `Reserva lote #${index}: ${reserva.clienteNombre} - ${reserva.fechaReserva} ${reserva.horarioElegido}`
    );
  });
}