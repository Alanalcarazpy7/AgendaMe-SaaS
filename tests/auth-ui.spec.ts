import { expect, test } from "@playwright/test";

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
} as const;

test("login y registro muestran con claridad la sección activa", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/login");

  const authCard = page.locator("main > section");
  const cardSize = await authCard.boundingBox();
  expect(cardSize?.width).toBeLessThanOrEqual(1090);
  expect(cardSize?.height).toBeLessThanOrEqual(706);

  await expect(
    page.getByRole("link", { name: "Iniciar sesión", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "Crear cuenta", exact: true }),
  ).not.toHaveAttribute("aria-current");
  await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("login-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 1366, height: 700 });
  await page.goto("/auth/registro");

  await expect(
    page.getByRole("link", { name: "Crear cuenta", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("link", { name: "Iniciar sesión", exact: true }),
  ).not.toHaveAttribute("aria-current");
  await expect(page.getByRole("heading", { name: "Creá tu cuenta" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Política de Privacidad" }),
  ).toBeInViewport({ ratio: 1 });
  const registrationCard = await page.locator("main > section").boundingBox();
  const privacyLink = await page
    .getByRole("link", { name: "Política de Privacidad" })
    .boundingBox();
  expect((privacyLink?.y ?? 0) + (privacyLink?.height ?? 0)).toBeLessThanOrEqual(
    (registrationCard?.y ?? 0) + (registrationCard?.height ?? 0) - 10,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("registro-desktop.png"),
    fullPage: true,
  });
});

test("registro guía la contraseña y se mantiene completo en móvil", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await page.goto("/auth/registro");

  const layoutSize = await page.evaluate(() => ({
    viewport: window.innerHeight,
    document: document.documentElement.scrollHeight,
  }));

  expect(layoutSize.document).toBeLessThanOrEqual(layoutSize.viewport);

  const password = page.getByLabel("Contraseña", { exact: true });
  const confirmPassword = page.getByLabel("Repetir contraseña");

  await password.fill("abcdefgh");
  await page.getByLabel("Nombre completo").fill("Alan Silva");
  await page.getByLabel("Correo electrónico").fill("alan@example.com");
  await confirmPassword.fill("abcdefgh");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  const formError = page.locator("#auth-form-error");
  await expect(formError).toContainText("una letra mayúscula");

  await password.fill("Abcdefgh");
  await confirmPassword.fill("Abcdefgh");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(formError).toContainText("al menos un número");

  await password.fill("Abcdefg1");
  await confirmPassword.fill("Abcdefg2");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(formError).toContainText("no coinciden");

  await confirmPassword.fill("Abcdefg1");
  await expect(page.getByLabel("Las contraseñas coinciden")).toBeVisible();

  const passwordToggle = password.locator("..").getByRole("button");
  await passwordToggle.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(
    password.locator("..").getByRole("button", { name: "Ocultar contraseña" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.screenshot({
    path: testInfo.outputPath("registro-mobile.png"),
    fullPage: true,
  });
});
