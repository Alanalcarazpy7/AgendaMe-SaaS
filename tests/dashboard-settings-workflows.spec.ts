import path from "node:path";
import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const account = fixtures.accounts.admin_empresarial;
const business = fixtures.businesses.empresarial;

type OriginalProfile = {
  nombre: string | null;
  telefono: string | null;
  cargo: string | null;
  tema: string | null;
  color_acento: string | null;
  recibir_notificaciones: boolean | null;
};

let originalInterval = 30;
let originalProfile: OriginalProfile | null = null;

test.describe.serial("configuracion y cuenta del negocio", () => {
  test.use({ storageState: account.storage });

  test.beforeAll(async () => {
    const supabase = supabaseAdmin();
    const [{ data: currentBusiness }, { data: profile }] = await Promise.all([
      supabase.from("negocios").select("intervalo_reserva_minutos").eq("id", business.id).single(),
      supabase
        .from("perfiles_usuario")
        .select("nombre, telefono, cargo, tema, color_acento, recibir_notificaciones")
        .eq("usuario_id", account.id)
        .single(),
    ]);
    originalInterval = Number(currentBusiness?.intervalo_reserva_minutos ?? 30);
    originalProfile = profile as OriginalProfile | null;
  });

  test.afterAll(async () => {
    const supabase = supabaseAdmin();
    await supabase
      .from("negocios")
      .update({ intervalo_reserva_minutos: originalInterval, logo_url: null, banner_url: null })
      .eq("id", business.id);

    if (originalProfile) {
      await supabase.from("perfiles_usuario").update(originalProfile).eq("usuario_id", account.id);
      await supabase.auth.admin.updateUserById(account.id, {
        user_metadata: {
          nombre: originalProfile.nombre,
          name: originalProfile.nombre,
          full_name: originalProfile.nombre,
          cargo: originalProfile.cargo,
        },
      });
    }
  });

  test("actualiza y restaura el intervalo de reservas", async ({ page }) => {
    await page.goto("/dashboard/configuracion", { waitUntil: "networkidle" });
    const intervalSection = page.locator("section").filter({ hasText: "Intervalo de reservas" });
    const nextInterval = originalInterval === 35 ? 40 : 35;
    await intervalSection.locator("select").selectOption(String(nextInterval));
    await intervalSection.getByRole("button", { name: /Guardar intervalo/i }).click();
    await expect(page.locator("body")).toContainText(/Intervalo actualizado correctamente/i);

    const supabase = supabaseAdmin();
    const { data: updated } = await supabase
      .from("negocios")
      .select("intervalo_reserva_minutos")
      .eq("id", business.id)
      .single();
    expect(updated?.intervalo_reserva_minutos).toBe(nextInterval);

    await intervalSection.locator("select").selectOption(String(originalInterval));
    await intervalSection.getByRole("button", { name: /Guardar intervalo/i }).click();
    await expect(page.locator("body")).toContainText(/Intervalo actualizado correctamente/i);
  });

  test("sube y quita el logo con confirmaciones", async ({ page }) => {
    await page.goto("/dashboard/configuracion", { waitUntil: "networkidle" });
    await page.locator('input[type="file"]').first().setInputFiles(
      path.join(process.cwd(), "public", "brand", "logos-colores.png")
    );
    await expect(page.locator("body")).toContainText(/Logo actualizado/i);
    await expect(page.getByAltText("Logo del negocio")).toBeVisible();

    const logoCard = page.locator("article").filter({ hasText: /^Logo/ }).first();
    await logoCard.getByRole("button", { name: /Quitar/i }).click();
    await expect(page.locator("body")).toContainText(/Logo eliminado/i);

    const supabase = supabaseAdmin();
    const { data: updated } = await supabase.from("negocios").select("logo_url").eq("id", business.id).single();
    expect(updated?.logo_url).toBeNull();
  });

  test("guarda los horarios del negocio", async ({ page }) => {
    await page.goto("/dashboard/configuracion", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Guardar horarios/i }).click();
    await expect(page.locator("body")).toContainText(/Horarios guardados correctamente/i);
  });

  test("actualiza los datos personales y muestra confirmacion", async ({ page }) => {
    await page.goto("/dashboard/mi-cuenta", { waitUntil: "networkidle" });
    const newName = "Admin E2E Empresarial Verificado";
    await page.getByLabel(/Nombre visible/i).fill(newName);
    await page.getByLabel(/Telefono|Teléfono/i).fill("0981000099");
    await page.getByLabel(/Cargo/i).fill("Administrador de prueba");
    await page.getByRole("button", { name: /Guardar cambios/i }).click();
    await expect(page.locator("body")).toContainText(/Cuenta actualizada correctamente/i);
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/Nombre visible/i)).toHaveValue(newName);

    const supabase = supabaseAdmin();
    const { data: updated } = await supabase
      .from("perfiles_usuario")
      .select("nombre, telefono, cargo")
      .eq("usuario_id", account.id)
      .single();
    expect(updated?.nombre).toBe(newName);
    expect(updated?.telefono).toBe("0981000099");
    expect(updated?.cargo).toBe("Administrador de prueba");
  });
});
