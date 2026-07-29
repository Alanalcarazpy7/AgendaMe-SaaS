import { expect, test } from "@playwright/test";
import { AGENDA } from "./helpers/agendame";

test("publica metadata e imagen social del negocio", async ({ page }) => {
  await page.goto(`/reservar/${AGENDA.slug}`, {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    new RegExp(AGENDA.negocio, "i"),
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /reserv|servicio|horario/i,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");

  expect(imageUrl).toBeTruthy();
  expect(imageUrl).toContain(`/reservar/${AGENDA.slug}/opengraph-image`);

  const imageResponse = await page.request.get(imageUrl!, {
    timeout: 60_000,
  });

  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/png");
  expect((await imageResponse.body()).byteLength).toBeGreaterThan(5_000);
});
