import { test } from "@playwright/test";
import { crearReservaPublica, siguienteLunesIso, sumarDiasIso } from "./helpers/agendame";

test.describe.configure({ mode: "serial" });

const base = siguienteLunesIso();

for (const index of Array.from({ length: 21 }, (_, i) => i + 1)) {
  test(`crea reserva número ${index} de 21`, async ({ page }) => {
    const fechaReserva = sumarDiasIso(base, 140 + index * 7);

    const reserva = await crearReservaPublica(page, {
      clientePrefijo: `Cliente Limite ${index}`,
      fechaReserva,
      indiceHorario: index % 2,
    });

    console.log(
      `Reserva límite #${index}: ${reserva.clienteNombre} - ${reserva.fechaReserva} ${reserva.horarioElegido}`
    );
  });
}