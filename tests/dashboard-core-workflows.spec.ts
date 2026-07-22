import { expect, test } from "@playwright/test";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { siguienteLunesIso, uniqueId } from "./helpers/agendame";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const business = fixtures.businesses.empresarial;
const suffix = uniqueId();
const clientName = `Cliente Flujo E2E ${suffix}`;
const serviceName = `Servicio Flujo E2E ${suffix}`;
const employeeName = `Empleado Flujo E2E ${suffix}`;

async function cleanupCoreData() {
  const supabase = supabaseAdmin();
  const [{ data: clients }, { data: services }, { data: employees }] = await Promise.all([
    supabase.from("clientes").select("id").eq("negocio_id", business.id).like("nombre_completo", "Cliente Flujo E2E %"),
    supabase.from("servicios").select("id").eq("negocio_id", business.id).like("nombre", "Servicio Flujo E2E %"),
    supabase.from("empleados").select("id").eq("negocio_id", business.id).like("nombre", "Empleado Flujo E2E %"),
  ]);

  const clientIds = (clients ?? []).map((row) => row.id);
  const serviceIds = (services ?? []).map((row) => row.id);
  const employeeIds = (employees ?? []).map((row) => row.id);

  if (clientIds.length) {
    await supabase.from("citas").delete().in("cliente_id", clientIds);
    await supabase.from("cliente_sucursales").delete().in("cliente_id", clientIds);
  }
  if (serviceIds.length) await supabase.from("citas").delete().in("servicio_id", serviceIds);
  if (employeeIds.length) {
    await supabase.from("citas").delete().in("empleado_id", employeeIds);
    await supabase.from("horarios_empleado").delete().in("empleado_id", employeeIds);
    await supabase.from("empleado_servicios").delete().in("empleado_id", employeeIds);
    await supabase.from("empleados").delete().in("id", employeeIds);
  }
  if (serviceIds.length) {
    await supabase.from("empleado_servicios").delete().in("servicio_id", serviceIds);
    await supabase.from("servicios").delete().in("id", serviceIds);
  }
  if (clientIds.length) await supabase.from("clientes").delete().in("id", clientIds);
}

test.describe.serial("CRUD principal y asignación automática", () => {
  test.use({ storageState: fixtures.accounts.admin_empresarial.storage });

  test.beforeAll(cleanupCoreData);
  test.afterAll(cleanupCoreData);

  test("crea, edita y oculta un cliente con confirmaciones", async ({ page }) => {
    await page.goto("/dashboard/clientes", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Nuevo cliente/i }).first().click();

    const dialog = page.getByRole("dialog", { name: /Nuevo cliente/i });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(200);
    await dialog.getByLabel(/Nombre completo/i).fill(clientName);
    await dialog.getByLabel(/Teléfono/i).fill(`09${suffix.slice(-8)}`);
    await dialog.getByLabel(/Correo/i).fill(`cliente.${suffix}@example.com`);
    await dialog.getByLabel(/Documento/i).fill(`E2E-${suffix}`);
    await dialog.getByLabel(/Notas internas/i).fill("Creado por la auditoría E2E");
    await dialog.getByRole("button", { name: /Crear cliente/i }).click();

    await expect(page.locator("body")).toContainText(/Cliente creado/i);
    const row = page.getByRole("row").filter({ hasText: clientName });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: /Editar/i }).click();
    const editDialog = page.getByRole("dialog", { name: /Editar cliente/i });
    await expect(editDialog).toBeVisible();
    await page.waitForTimeout(200);
    await editDialog.getByLabel(/Notas internas/i).fill("Cliente E2E actualizado");
    await editDialog.getByRole("button", { name: /Guardar cambios/i }).click();
    await expect(page.locator("body")).toContainText(/Cliente actualizado/i);

    await page.getByRole("row").filter({ hasText: clientName }).getByRole("button", { name: /Ocultar/i }).click();
    await expect(page.locator("body")).toContainText(/Cliente ocultado/i);
    await expect(page.getByRole("row").filter({ hasText: clientName })).toContainText(/Inactivo/i);

    await page.getByRole("row").filter({ hasText: clientName }).getByRole("button", { name: /Activar/i }).click();
    await expect(page.locator("body")).toContainText(/Cliente activado/i);
  });

  test("crea un servicio y confirma que aparece en el panel", async ({ page }) => {
    await page.goto("/dashboard/servicios", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Nuevo servicio/i }).first().click();

    const dialog = page.getByRole("dialog", { name: /Nuevo servicio/i });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(200);
    await dialog.getByLabel(/Nombre del servicio/i).fill(serviceName);
    await dialog.locator("#duracionMinutos").fill("45");
    await dialog.getByLabel(/Precio/i).fill("75000");
    await dialog.locator("#descripcion").fill("Servicio creado por Playwright");
    await dialog.getByRole("button", { name: /Crear servicio/i }).click();

    await expect(page.locator("body")).toContainText(/Servicio creado/i);
    const card = page.locator("article").filter({ hasText: serviceName });
    await expect(card).toBeVisible();
    await expect(card).toContainText(/45 min/i);
    await expect(card).toContainText(/75.000/i);
  });

  test("crea un empleado y le asigna el servicio", async ({ page }) => {
    await page.goto("/dashboard/empleados", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Nuevo empleado/i }).first().click();

    const dialog = page.getByRole("dialog", { name: /Nuevo empleado/i });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(200);
    await dialog.getByLabel(/^Nombre$/i).fill(employeeName);
    await dialog.getByLabel(/Correo/i).fill(`empleado.${suffix}@example.com`);
    await dialog.getByLabel(/Teléfono/i).fill(`08${suffix.slice(-8)}`);
    await dialog.getByRole("button", { name: new RegExp(serviceName, "i") }).click();
    await dialog.getByRole("button", { name: /Crear empleado/i }).click();

    await expect(page.locator("body")).toContainText(/Empleado creado/i);
    const row = page.getByRole("row").filter({ hasText: employeeName });
    await expect(row).toBeVisible();
    await expect(row).toContainText(serviceName);
  });

  test("abre Nueva cita sin error prematuro y asigna empleado automáticamente", async ({ page }) => {
    await page.goto("/dashboard/citas", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /^Nueva cita$/i }).click();

    const dialog = page.getByRole("dialog", { name: /Nueva cita/i });
    await expect(dialog).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/fecha u hora que ya pasó/i);

    const clientOptionValue = await dialog.locator("#cliente option").filter({ hasText: clientName }).getAttribute("value");
    const serviceOptionValue = await dialog.locator("#servicio option").filter({ hasText: serviceName }).getAttribute("value");
    expect(clientOptionValue).toBeTruthy();
    expect(serviceOptionValue).toBeTruthy();
    await dialog.getByLabel(/Cliente/i).selectOption(clientOptionValue!);
    await dialog.getByLabel(/Servicio/i).selectOption(serviceOptionValue!);
    await expect(dialog.getByLabel(/Empleado/i)).toHaveValue("");
    await dialog.getByLabel(/Fecha/i).fill(siguienteLunesIso());
    await dialog.getByLabel(/Hora de inicio/i).fill("16:00");
    await dialog.getByRole("button", { name: /Crear cita/i }).click();

    await expect(page.locator("body")).toContainText(/Cita creada correctamente/i);

    const supabase = supabaseAdmin();
    const { data: client } = await supabase
      .from("clientes")
      .select("id")
      .eq("negocio_id", business.id)
      .eq("nombre_completo", clientName)
      .single();
    const { data: appointment, error } = await supabase
      .from("citas")
      .select("id, empleado_id, estado")
      .eq("negocio_id", business.id)
      .eq("cliente_id", client?.id)
      .single();

    expect(error).toBeNull();
    expect(appointment?.empleado_id, "La asignación automática debe guardar empleado_id").toBeTruthy();
    expect(appointment?.estado).toBe("confirmada");
  });

  test("cambia entre Detalle y Panorama sin perder el calendario", async ({ page }) => {
    await page.goto("/dashboard/citas", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Panorama", exact: true }).click();
    await expect(page.locator("body")).toContainText(/Panorama semanal|Semana del/i);
    await page.getByRole("button", { name: "Detalle", exact: true }).click();
    await expect(page.locator("body")).toContainText(/Hora/);
  });
});
