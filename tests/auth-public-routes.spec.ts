import { test, expect } from "@playwright/test";
import { AGENDA, esperarPaginaSinErrores } from "./helpers/agendame";

test("dashboard sin sesión redirige a login", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/login/i);
});

test("reserva pública carga sin iniciar sesión", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "domcontentloaded" });

  await esperarPaginaSinErrores(page);

  await expect(page.locator("body")).toContainText(/Reservas? online/i);
  await expect(page.locator("body")).toContainText(/Elegí una sucursal/i);
});
