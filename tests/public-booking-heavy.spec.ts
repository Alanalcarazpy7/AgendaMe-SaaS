import { test } from "@playwright/test";
import { crearReservaPublica, siguienteLunesIso, sumarDiasIso } from "./helpers/agendame";

test.describe.configure({ mode: "serial" });

const base = siguienteLunesIso();

for (const index of Array.from({ length: 8 }, (_, i) => i + 1)) {
  test(`crea reserva pública pesada #${index}`, async ({ page }) => {
    const fechaReserva = sumarDiasIso(base, 49 + index * 7);

    const reserva = await crearReservaPublica(page, {
      clientePrefijo: `Cliente Heavy ${index}`,
      fechaReserva,
      indiceHorario: index % 2,
    });

    console.log(
      `Reserva pesada #${index}: ${reserva.clienteNombre} - ${reserva.fechaReserva} ${reserva.horarioElegido}`
    );
  });
}