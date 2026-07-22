import fs from "node:fs";
import path from "node:path";
import { chromium, expect, type FullConfig } from "@playwright/test";
import { hasE2EFixtures, loadE2EFixtures } from "./helpers/e2e-fixtures";
import { supabaseAdmin } from "./helpers/supabase-db";

async function cleanTransientE2EData(businessIds: string[]) {
  const supabase = supabaseAdmin();
  const citasResult = await supabase
    .from("citas")
    .update({ estado: "cancelada" })
    .in("negocio_id", businessIds)
    .neq("estado", "cancelada");
  if (citasResult.error) throw new Error(citasResult.error.message);
}

export default async function globalSetup(config: FullConfig) {
  if (!hasE2EFixtures()) return;

  const fixtures = loadE2EFixtures();
  const baseURL = String(config.projects[0]?.use?.baseURL ?? "http://localhost:3000");
  await cleanTransientE2EData(Object.values(fixtures.businesses).map((business) => business.id));
  fs.mkdirSync(path.join(process.cwd(), "tests", ".auth"), { recursive: true });

  const browser = await chromium.launch();

  try {
    for (const account of Object.values(fixtures.accounts)) {
      const storagePath = path.join(process.cwd(), account.storage);
      const maxSessionAgeMs = 45 * 60 * 1000;
      if (
        fs.existsSync(storagePath) &&
        fs.statSync(storagePath).mtimeMs > new Date(fixtures.generatedAt).getTime() &&
        Date.now() - fs.statSync(storagePath).mtimeMs < maxSessionAgeMs
      ) {
        continue;
      }

      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      console.log(`Creando sesión E2E: ${account.email}`);
      await page.goto("/login", { waitUntil: "networkidle" });
      const emailInput = page.getByLabel(/Correo electronico/i);
      const passwordInput = page.getByLabel(/Contrasena/i);

      await emailInput.fill(account.email);
      await passwordInput.fill(account.password);
      await page.waitForTimeout(300);

      if ((await emailInput.inputValue()) !== account.email) await emailInput.fill(account.email);
      if ((await passwordInput.inputValue()) !== account.password) await passwordInput.fill(account.password);

      await expect(emailInput).toHaveValue(account.email);
      await expect(passwordInput).toHaveValue(account.password);
      await page.getByRole("button", { name: /Iniciar sesion/i }).click();
      await page.waitForTimeout(1_000);

      if (page.url().includes("/login")) {
        await page.goto("/auth/redirect", { waitUntil: "domcontentloaded" });
      }

      try {
        await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
      } catch {
        const body = await page.locator("body").innerText().catch(() => "");
        throw new Error(`No se pudo iniciar sesión con ${account.email}. Pantalla: ${body.slice(0, 800)}`);
      }
      await context.storageState({ path: account.storage });
      await context.close();
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  } finally {
    await browser.close();
  }
}
