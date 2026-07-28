import { expect, test } from "@playwright/test";

import { AGENDA } from "./helpers/agendame";

test("la reserva pública presenta el flujo completo sin desbordes", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: AGENDA.negocio })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Armá tu reserva" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar reserva" })).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("reserva-publica-desktop.png"),
    fullPage: true,
  });

  await page
    .getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") })
    .click();
  await page
    .getByRole("button", { name: new RegExp(AGENDA.servicio, "i") })
    .click();

  const fechaInput = page.locator("#reserva-fecha");
  await expect(fechaInput).toBeVisible();
  await fechaInput.evaluate((input) => {
    Object.defineProperty(input, "showPicker", {
      configurable: true,
      value() {
        input.dataset.pickerOpened = "true";
      },
    });
  });
  await fechaInput.click({ position: { x: 24, y: 20 } });
  await expect(fechaInput).toHaveAttribute("data-picker-opened", "true");

  await page.screenshot({
    path: testInfo.outputPath("reserva-publica-fecha-light.png"),
    fullPage: true,
  });

  await page.evaluate(() => {
    localStorage.setItem("agendame-tema", "oscuro");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: new RegExp(AGENDA.sucursal, "i") })
    .click();
  await page
    .getByRole("button", { name: new RegExp(AGENDA.servicio, "i") })
    .click();
  await expect(page.locator("#reserva-fecha")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("reserva-publica-fecha-dark.png"),
    fullPage: true,
  });

  await page.evaluate(() => {
    localStorage.setItem("agendame-tema", "claro");
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/reservar/${AGENDA.slug}`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: AGENDA.negocio })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Armá tu reserva" })).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("reserva-publica-mobile.png"),
    fullPage: true,
  });

  expect(consoleErrors).toEqual([]);
});
