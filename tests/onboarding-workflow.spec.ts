import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { uniqueId } from "./helpers/agendame";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const account = fixtures.accounts.onboarding;
const suffix = uniqueId();
const slug = `e2e-onboarding-${suffix}`;

test.describe.serial("onboarding de un negocio nuevo", () => {
  test.use({ storageState: account.storage });

  test.afterAll(async () => {
    const supabase = supabaseAdmin();
    const { data: business } = await supabase.from("negocios").select("id").eq("slug", slug).maybeSingle();
    if (business?.id) await supabase.from("negocios").delete().eq("id", business.id);
  });

  test("crea el negocio y activa Gratis por defecto", async ({ page }) => {
    await page.goto("/onboarding/negocio?confirmado=1", { waitUntil: "networkidle" });
    await page.getByLabel(/Tu nombre/i).fill("Responsable Onboarding E2E");
    await page.getByLabel(/Nombre del negocio/i).fill(`Negocio Onboarding ${suffix}`);
    await page.getByLabel(/Link publico/i).fill(slug);
    await page.getByLabel(/Rubro/i).fill("Pruebas automatizadas");
    await page.getByLabel(/Telefono/i).fill("0981778899");
    await page.getByLabel(/Direccion/i).fill("Asunción");
    await expect(page.getByLabel(/Tu nombre/i)).toHaveValue("Responsable Onboarding E2E");
    await expect(page.getByLabel(/Link publico/i)).toHaveValue(slug);
    await page.getByRole("button", { name: /Crear mi negocio/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText(/Plan gratis/i);

    const supabase = supabaseAdmin();
    const { data: business } = await supabase.from("negocios").select("id").eq("slug", slug).single();
    const { data: subscription } = await supabase
      .from("suscripciones")
      .select("estado, planes_saas(clave)")
      .eq("negocio_id", business?.id)
      .eq("estado", "activa")
      .single();

    expect((subscription?.planes_saas as unknown as { clave: string })?.clave).toBe("gratis");
  });
});
