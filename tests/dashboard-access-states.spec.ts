import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { uniqueId } from "./helpers/agendame";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const business = fixtures.businesses.empresarial;
const branch = business.secondaryBranch!;
const blockReason = `Motivo administrativo E2E ${uniqueId()}`;

test.describe.serial("estados de acceso dentro del dashboard", () => {
  test.afterAll(async () => {
    const supabase = supabaseAdmin();
    await supabase
      .from("negocios")
      .update({ estado: "activo", motivo_bloqueo: null, bloqueado_at: null, bloqueado_por: null })
      .eq("id", business.id);
    await supabase.from("sucursales").update({ estado: "activo" }).eq("id", branch.id);
  });

  test("sucursal inactiva pausa al empleado y conserva el shell", async ({ browser }) => {
    const adminContext = await browser.newContext({ storageState: fixtures.accounts.admin_empresarial.storage });
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/dashboard/sucursales", { waitUntil: "networkidle" });

    const branchCard = adminPage.locator("article").filter({ hasText: branch.nombre });
    await branchCard.getByRole("button", { name: /Desactivar/i }).click();
    await expect(adminPage.locator("body")).toContainText(/Sucursal desactivada/i);

    const employeeContext = await browser.newContext({ storageState: fixtures.accounts.empleado.storage });
    const employeePage = await employeeContext.newPage();
    await employeePage.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(employeePage.locator("body")).toContainText(business.name);
    await expect(employeePage.locator("body")).toContainText(/Sucursal inactiva/i);
    await expect(employeePage.locator("body")).toContainText(/No se borra nada/i);
    await expect(employeePage).toHaveURL(/\/dashboard/);

    await adminPage.reload({ waitUntil: "networkidle" });
    await adminPage.locator("article").filter({ hasText: branch.nombre }).getByRole("button", { name: /Activar/i }).click();
    await expect(adminPage.locator("body")).toContainText(/Sucursal activada/i);

    await employeePage.reload({ waitUntil: "networkidle" });
    await expect(employeePage.locator("body")).not.toContainText(/Sucursal inactiva/i);
    await expect(employeePage.locator("body")).toContainText(/Panel privado/i);
    await employeeContext.close();
    await adminContext.close();
  });

  test("bloqueo muestra el motivo a admin y lo oculta al empleado", async ({ browser }) => {
    const ownerContext = await browser.newContext({ storageState: fixtures.accounts.superadmin.storage });
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto(`/admin/negocios/${business.id}`, { waitUntil: "networkidle" });
    await ownerPage.getByRole("button", { name: /^Bloquear negocio$/i }).click();
    const blockDialog = ownerPage.getByRole("dialog", { name: /Bloquear negocio/i });
    await blockDialog.getByLabel(/Motivo/i).fill(blockReason);
    await blockDialog.getByRole("button", { name: /^Bloquear$/i }).click();
    await expect(ownerPage.locator("body")).toContainText(/Negocio bloqueado/i);

    const adminContext = await browser.newContext({ storageState: fixtures.accounts.admin_empresarial.storage });
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(adminPage.locator("body")).toContainText(/pausa administrativa/i);
    await expect(adminPage.locator("body")).toContainText(blockReason);
    await expect(adminPage.locator("body")).toContainText(/Panel privado/i);

    const employeeContext = await browser.newContext({ storageState: fixtures.accounts.empleado.storage });
    const employeePage = await employeeContext.newPage();
    await employeePage.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(employeePage.locator("body")).toContainText(/Acceso temporalmente no disponible/i);
    await expect(employeePage.locator("body")).not.toContainText(blockReason);
    await expect(employeePage.locator("body")).toContainText(/contacta al responsable/i);

    await ownerPage.reload({ waitUntil: "networkidle" });
    await ownerPage.getByRole("button", { name: /^Desbloquear negocio$/i }).click();
    const unblockDialog = ownerPage.getByRole("dialog", { name: /Desbloquear negocio/i });
    await unblockDialog.getByRole("button", { name: /^Desbloquear$/i }).click();
    await expect(ownerPage.locator("body")).toContainText(/Negocio desbloqueado/i);

    await adminPage.reload({ waitUntil: "networkidle" });
    await expect(adminPage.locator("body")).not.toContainText(/pausa administrativa/i);
    await employeeContext.close();
    await adminContext.close();
    await ownerContext.close();
  });
});
