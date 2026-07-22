import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { uniqueId } from "./helpers/agendame";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const account = fixtures.accounts.admin_empresarial;
const business = fixtures.businesses.empresarial;
const suffix = uniqueId();
const branchName = `Sucursal Flujo E2E ${suffix}`;
const editedBranchName = `${branchName} Editada`;
const invitationEmail = `e2e.invitado.${suffix}@agendame.test`;

async function cleanup() {
  const supabase = supabaseAdmin();
  await supabase.from("sucursal_invitaciones").delete().eq("negocio_id", business.id).eq("email", invitationEmail);
  await supabase.from("sucursal_usuarios").delete().eq("negocio_id", business.id).eq("email", invitationEmail);
  await supabase.from("sucursales").delete().eq("negocio_id", business.id).like("nombre", `Sucursal Flujo E2E ${suffix}%`);
}

test.describe.serial("sucursales e invitaciones empresariales", () => {
  test.use({ storageState: account.storage });
  test.beforeAll(cleanup);
  test.afterAll(cleanup);

  test("crea, edita, desactiva y reactiva una sucursal", async ({ page }) => {
    await page.goto("/dashboard/sucursales", { waitUntil: "networkidle" });
    const branches = page.locator("section").filter({ hasText: "Ubicaciones del negocio" });

    await branches.getByPlaceholder("Sucursal Centro").fill(branchName);
    await branches.getByPlaceholder(/Direccion de la sucursal|Dirección de la sucursal/i).fill("Dirección E2E");
    await branches.getByPlaceholder("0981...").fill("0981000088");
    await branches.getByRole("button", { name: /^Crear$/i }).click();
    await expect(page.locator("body")).toContainText(/Sucursal creada correctamente/i);

    let card = branches.locator("article").filter({ hasText: branchName });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /Editar/i }).click();
    const editCard = branches.locator("article").filter({
      has: page.getByRole("button", { name: /^Guardar$/i }),
    });
    await editCard.locator("input").first().fill(editedBranchName);
    await editCard.getByRole("button", { name: /^Guardar$/i }).click();
    await expect(page.locator("body")).toContainText(/Sucursal actualizada correctamente/i);

    card = branches.locator("article").filter({ hasText: editedBranchName });
    await card.getByRole("button", { name: /Desactivar/i }).click();
    await expect(page.locator("body")).toContainText(/Sucursal desactivada/i);
    await expect(card).toContainText(/inactivo/i);

    await card.getByRole("button", { name: /Activar/i }).click();
    await expect(page.locator("body")).toContainText(/Sucursal activada/i);
    await expect(card).toContainText(/activo/i);
  });

  test("la sucursal principal no permite desactivacion", async ({ page }) => {
    await page.goto("/dashboard/sucursales", { waitUntil: "networkidle" });
    const principal = page.locator("article").filter({ hasText: /Principal/i }).first();
    await expect(principal).toBeVisible();
    await expect(principal.getByRole("button", { name: /Desactivar/i })).toHaveCount(0);
  });

  test("crea y revoca una invitacion reutilizable", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/dashboard/sucursales", { waitUntil: "networkidle" });
    const access = page.locator("section").filter({ hasText: "Accesos empresariales" });
    await access.getByPlaceholder("usuario@empresa.com").fill(invitationEmail);
    await access.locator("select").nth(0).selectOption(business.principalBranch.id);
    await access.locator("select").nth(1).selectOption("recepcionista_sucursal");
    await access.getByRole("button", { name: /Crear invitacion|Crear invitación/i }).click();

    await expect(page.locator("body")).toContainText(/Invitacion creada|Invitación creada/i);
    await expect(access).toContainText(/Link de invitacion listo|Link de invitación listo/i);
    const row = access.getByRole("row").filter({ hasText: invitationEmail });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /Revocar/i }).click();
    await expect(page.locator("body")).toContainText(/Invitacion revocada|Invitación revocada/i);
    await expect(access.getByRole("row").filter({ hasText: invitationEmail })).toHaveCount(0);
  });

  test("un empleado vinculado no aparece disponible para otra cuenta", async ({ page }) => {
    await page.goto("/dashboard/sucursales", { waitUntil: "networkidle" });
    const access = page.locator("section").filter({ hasText: "Accesos empresariales" });
    await access.locator("select").nth(0).selectOption(business.secondaryBranch!.id);
    await access.locator("select").nth(1).selectOption("empleado_sucursal");
    const employeeSelect = access.locator("select").nth(2);
    await expect(employeeSelect.locator("option").filter({ hasText: business.secondaryEmployee!.nombre })).toHaveCount(0);
  });
});
