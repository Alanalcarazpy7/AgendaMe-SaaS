import { test, expect } from "@playwright/test";
import { AGENDA, esperarPaginaSinErrores } from "./helpers/agendame";

test.describe.configure({ mode: "serial" });

for (const index of Array.from({ length: 20 }, (_, i) => i + 1)) {
  test(`reserva pública carga repetida #${index}`, async ({ page }) => {
    const inicio = Date.now();

    await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

    await esperarPaginaSinErrores(page);

    await expect(page.locator("body")).toContainText(/Reservas? online/i);
    await expect(page.locator("body")).toContainText(/Elegí una sucursal/i);
    await expect(page.locator("body")).toContainText(/Elegí un servicio/i);

    const duracion = Date.now() - inicio;

    expect(duracion).toBeLessThan(9000);

    console.log(`Reserva pública load #${index}: ${duracion}ms`);
  });
}
