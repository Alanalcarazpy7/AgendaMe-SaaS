import path from "node:path";
import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { uniqueId } from "./helpers/agendame";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const business = fixtures.businesses.profesional;
const note = `Comprobante E2E ${uniqueId()}`;
let originalExpiration: string | null = null;

test.describe.serial("comprobante privado y revisión del propietario", () => {
  test.beforeAll(async () => {
    const supabase = supabaseAdmin();
    const { data: subscription } = await supabase
      .from("suscripciones")
      .select("fecha_vencimiento")
      .eq("negocio_id", business.id)
      .eq("estado", "activa")
      .single();
    originalExpiration = subscription?.fecha_vencimiento ?? null;
  });

  test.afterAll(async () => {
    const supabase = supabaseAdmin();
    const { data: payments } = await supabase
      .from("pagos_manuales")
      .select("id, comprobante_url")
      .eq("negocio_id", business.id)
      .eq("notas_cliente", note);

    for (const payment of payments ?? []) {
      if (payment.comprobante_url) {
        await supabase.storage.from("payment-proofs").remove([payment.comprobante_url]);
      }
      await supabase.from("auditoria").delete().eq("registro_id", payment.id);
      await supabase.from("pagos_manuales").delete().eq("id", payment.id);
    }

    await supabase
      .from("suscripciones")
      .update({ fecha_vencimiento: originalExpiration })
      .eq("negocio_id", business.id)
      .eq("estado", "activa");
  });

  test("el negocio sube un comprobante y recibe confirmación", async ({ browser }) => {
    const context = await browser.newContext({ storageState: fixtures.accounts.admin_profesional.storage });
    const page = await context.newPage();
    await page.goto("/dashboard/planes", { waitUntil: "networkidle" });

    await page.locator('input[type="file"]').setInputFiles(
      path.join(process.cwd(), "public", "brand", "logos-colores.png")
    );
    await page.getByLabel(/Nota para AgendaMe/i).fill(note);
    await page.getByRole("button", { name: /Enviar comprobante/i }).click();

    await expect(page.locator("body")).toContainText(/Comprobante enviado/i);
    await expect(page.locator("body")).toContainText(/Pendiente/i);

    const supabase = supabaseAdmin();
    const { data: payment, error } = await supabase
      .from("pagos_manuales")
      .select("id, estado, comprobante_url, notas_cliente")
      .eq("negocio_id", business.id)
      .eq("notas_cliente", note)
      .single();
    expect(error).toBeNull();
    expect(payment?.estado).toBe("pendiente");
    expect(payment?.notas_cliente).toBe(note);
    expect(payment?.comprobante_url).toMatch(new RegExp(`^${business.id}/`));
    await context.close();
  });

  test("el superadmin visualiza el archivo privado y aprueba el pago", async ({ browser }) => {
    const context = await browser.newContext({ storageState: fixtures.accounts.superadmin.storage });
    const page = await context.newPage();
    await page.goto(`/admin/pagos?estado=pendiente&q=${encodeURIComponent(business.name)}`, {
      waitUntil: "networkidle",
    });

    const row = page.getByRole("row").filter({ hasText: business.name });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Ver\/adjuntar/i }).click();
    const proofDialog = page.getByRole("dialog", { name: /Comprobante del pago/i });
    await expect(proofDialog.getByAltText(/Comprobante de pago/i)).toBeVisible();
    await page.keyboard.press("Escape");

    await row.getByRole("button", { name: /^Aprobar$/i }).click();
    const approveDialog = page.getByRole("dialog", { name: new RegExp(`Aprobar pago.*${business.name}`, "i") });
    await approveDialog.getByRole("button", { name: /Aprobar pago/i }).click();
    await expect(page.locator("body")).toContainText(/Pago aprobado correctamente/i);

    const supabase = supabaseAdmin();
    const { data: payment } = await supabase
      .from("pagos_manuales")
      .select("estado, aprobado_at")
      .eq("negocio_id", business.id)
      .eq("notas_cliente", note)
      .single();
    expect(payment?.estado).toBe("aprobado");
    expect(payment?.aprobado_at).toBeTruthy();
    await context.close();
  });

  test("el negocio ve el pago aprobado en su historial", async ({ browser }) => {
    const context = await browser.newContext({ storageState: fixtures.accounts.admin_profesional.storage });
    const page = await context.newPage();
    await page.goto("/dashboard/planes", { waitUntil: "networkidle" });
    const body = page.locator("body");
    await expect(body).toContainText(/Historial reciente/i);
    await expect(body).toContainText(/Profesional/i);
    await expect(body).toContainText(/Aprobado/i);
    await expect(body).not.toContainText(note);
    await context.close();
  });
});
