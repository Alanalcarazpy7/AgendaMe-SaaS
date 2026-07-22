import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const seedOnly = process.argv.includes("--seed-only");

function loadEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv();

if (!seedOnly) {
  throw new Error(
    "Este script solo admite --seed-only. La limpieza total requiere confirmar el superadmin " +
      "protegido y una operacion SQL de mantenimiento para el historial inmutable de citas."
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  process.env.SUPABASE_SERVICE_KEY;
const protectedOwnerId = process.env.ADMIN_OWNER_USER_ID;

if (!supabaseUrl || !serviceRoleKey || !protectedOwnerId) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o ADMIN_OWNER_USER_ID."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isMissingTable(error) {
  return error && (error.code === "PGRST205" || /schema cache|could not find the table/i.test(error.message));
}

function testPassword() {
  return `Agm!${crypto.randomBytes(18).toString("base64url")}9a`;
}

async function createAuthAccount(key, name) {
  const email = `e2e.${key}@agendame.test`;
  const password = testPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre: name, e2e: true },
  });

  if (error || !data.user) throw new Error(`No se pudo crear ${email}: ${error?.message}`);

  const profile = {
    id: data.user.id,
    usuario_id: data.user.id,
    nombre_completo: name,
    nombre: name,
    email,
    rol_global: "usuario",
    tipo_cuenta: "negocio",
  };
  const { error: profileError } = await supabase
    .from("perfiles_usuario")
    .upsert(profile, { onConflict: "id" });
  if (profileError) throw new Error(`No se pudo crear perfil ${email}: ${profileError.message}`);

  return { id: data.user.id, email, password, storage: `tests/.auth/${key}.json` };
}

async function createBusiness(plan, account, suffix) {
  const slug = `e2e-${plan.clave}`;
  const { data: business, error: businessError } = await supabase
    .from("negocios")
    .insert({
      nombre: `AgendaMe E2E ${plan.nombre}`,
      slug,
      rubro: "Servicios de prueba",
      email: account.email,
      telefono: "0981000000",
      direccion: "Entorno automatizado",
      estado: "activo",
      intervalo_reserva_minutos: 30,
    })
    .select("id, nombre, slug")
    .single();
  if (businessError || !business) throw new Error(`No se pudo crear negocio ${suffix}: ${businessError?.message}`);

  const { error: membershipError } = await supabase.from("negocio_usuarios").insert({
    negocio_id: business.id,
    usuario_id: account.id,
    rol: "admin",
    activo: true,
  });
  if (membershipError) throw new Error(`No se pudo asociar admin ${suffix}: ${membershipError.message}`);

  await supabase.from("suscripciones").update({ estado: "cancelada" }).eq("negocio_id", business.id);
  const { error: subscriptionError } = await supabase.from("suscripciones").insert({
    negocio_id: business.id,
    plan_id: plan.id,
    estado: "activa",
    fecha_inicio: new Date().toISOString(),
    ciclo_facturacion: "mensual",
  });
  if (subscriptionError) throw new Error(`No se pudo asignar plan ${suffix}: ${subscriptionError.message}`);

  await supabase.rpc("obtener_o_crear_sucursal_principal", { p_negocio_id: business.id });
  let { data: branch, error: branchError } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .eq("negocio_id", business.id)
    .eq("es_principal", true)
    .maybeSingle();

  if (branchError) throw new Error(branchError.message);
  if (!branch) {
    const created = await supabase
      .from("sucursales")
      .insert({ negocio_id: business.id, nombre: "Sucursal principal", es_principal: true, estado: "activo" })
      .select("id, nombre")
      .single();
    if (created.error || !created.data) throw new Error(created.error?.message ?? "No se creó la sucursal principal");
    branch = created.data;
  }

  const serviceResult = await supabase
    .from("servicios")
    .insert({
      negocio_id: business.id,
      nombre: `Servicio E2E ${plan.nombre}`,
      descripcion: "Servicio base para pruebas automatizadas",
      duracion_minutos: 30,
      precio: 50000,
      color: "#06b6d4",
      estado: "activo",
    })
    .select("id, nombre")
    .single();
  if (serviceResult.error || !serviceResult.data) throw new Error(serviceResult.error?.message ?? "No se creó servicio");

  const employeeResult = await supabase
    .from("empleados")
    .insert({
      negocio_id: business.id,
      sucursal_id: branch.id,
      nombre: `Profesional E2E ${plan.nombre}`,
      email: `profesional.${plan.clave}@agendame.test`,
      color_calendario: "#14b8a6",
      estado: "activo",
    })
    .select("id, nombre")
    .single();
  if (employeeResult.error || !employeeResult.data) throw new Error(employeeResult.error?.message ?? "No se creó empleado");

  const linkResult = await supabase.from("empleado_servicios").insert({
    empleado_id: employeeResult.data.id,
    servicio_id: serviceResult.data.id,
  });
  if (linkResult.error) throw new Error(linkResult.error.message);

  const businessHours = Array.from({ length: 7 }, (_, day) => ({
    negocio_id: business.id,
    dia_semana: day,
    activo: true,
    hora_apertura: "07:00",
    hora_cierre: "21:00",
  }));
  const employeeHours = Array.from({ length: 7 }, (_, day) => ({
    empleado_id: employeeResult.data.id,
    dia_semana: day,
    activo: true,
    hora_inicio: "07:00",
    hora_fin: "21:00",
    descanso_inicio: null,
    descanso_fin: null,
  }));
  const hoursBusinessResult = await supabase.from("horarios_negocio").insert(businessHours);
  const hoursEmployeeResult = await supabase.from("horarios_empleado").insert(employeeHours);
  if (hoursBusinessResult.error) throw new Error(hoursBusinessResult.error.message);
  if (hoursEmployeeResult.error) throw new Error(hoursEmployeeResult.error.message);

  return {
    id: business.id,
    name: business.nombre,
    slug: business.slug,
    plan: plan.clave,
    admin: account,
    principalBranch: branch,
    service: serviceResult.data,
    employee: employeeResult.data,
  };
}

async function createBranchAccount({ key, name, role, business, branch, employeeId = null }) {
  const account = await createAuthAccount(key, name);
  const { error } = await supabase.from("sucursal_usuarios").insert({
    negocio_id: business.id,
    sucursal_id: branch.id,
    usuario_id: account.id,
    email: account.email,
    nombre: name,
    cargo: role,
    rol: role,
    empleado_id: employeeId,
    activo: true,
  });
  if (error) throw new Error(`No se pudo asociar ${key}: ${error.message}`);
  return account;
}

async function cleanE2EFixtures() {
  const { data: businesses, error: businessesError } = await supabase
    .from("negocios")
    .select("id")
    .like("slug", "e2e-%");
  if (businessesError) throw new Error(businessesError.message);

  const businessIds = (businesses ?? []).map((business) => business.id);
  if (businessIds.length > 0) {
    throw new Error(
      "Hay negocios E2E existentes, pero falta un archivo de fixtures valido. " +
        "No se intentara borrarlos porque las citas tienen historial inmutable."
    );
  }

  const authResult = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authResult.error) throw new Error(authResult.error.message);

  const e2eUsers = authResult.data.users.filter((user) =>
    /^e2e\..+@agendame\.test$/i.test(user.email ?? "")
  );

  for (const user of e2eUsers) {
    await supabase.from("perfiles_usuario").delete().or(`id.eq.${user.id},usuario_id.eq.${user.id}`);
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`No se pudo limpiar usuario E2E ${user.email}: ${error.message}`);
  }
}

async function resetExistingFixtures() {
  const fixturePath = path.join(root, ".e2e", "fixtures.json");
  if (!fs.existsSync(fixturePath)) return null;

  const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const businesses = Object.values(fixtures.businesses ?? {});
  const businessIds = businesses.map((business) => business.id).filter(Boolean);
  if (businessIds.length !== 4) return null;

  const existing = await supabase.from("negocios").select("id, estado").in("id", businessIds);
  if (existing.error || existing.data?.length !== businessIds.length) return null;
  const inactiveBusiness = existing.data.find((business) => business.estado !== "activo");
  if (inactiveBusiness) {
    throw new Error(
      `El negocio E2E ${inactiveBusiness.id} no esta activo. Reactivalo desde el panel superadmin antes de preparar los tests.`
    );
  }

  const paymentRows = await supabase
    .from("pagos_manuales")
    .select("id, comprobante_url")
    .in("negocio_id", businessIds);
  if (paymentRows.error) throw new Error(paymentRows.error.message);

  const proofPaths = (paymentRows.data ?? [])
    .map((payment) => payment.comprobante_url)
    .filter(Boolean);
  if (proofPaths.length > 0) {
    const storageResult = await supabase.storage.from("payment-proofs").remove(proofPaths);
    if (storageResult.error) throw new Error(storageResult.error.message);
  }

  const cancellable = await supabase
    .from("citas")
    .update({ estado: "cancelada" })
    .in("negocio_id", businessIds)
    .neq("estado", "cancelada");
  if (cancellable.error) throw new Error(cancellable.error.message);

  for (const table of ["sucursal_invitaciones", "pagos_manuales", "solicitudes_cambio_plan"]) {
    const result = await supabase.from(table).delete().in("negocio_id", businessIds);
    if (!isMissingTable(result.error) && result.error) throw new Error(result.error.message);
  }

  for (const table of ["clientes", "empleados", "servicios", "sucursales"]) {
    const result = await supabase
      .from(table)
      .update({ estado: "inactivo" })
      .in("negocio_id", businessIds);
    if (result.error) throw new Error(`No se pudo restaurar ${table}: ${result.error.message}`);
  }

  for (const business of businesses) {
    const activeEmployeeIds = [business.employee?.id, business.secondaryEmployee?.id].filter(Boolean);
    const activeBranchIds = [business.principalBranch?.id, business.secondaryBranch?.id].filter(Boolean);

    const serviceResult = await supabase.from("servicios").update({ estado: "activo" }).eq("id", business.service.id);
    if (serviceResult.error) throw new Error(serviceResult.error.message);

    if (activeEmployeeIds.length > 0) {
      const employeeResult = await supabase.from("empleados").update({ estado: "activo" }).in("id", activeEmployeeIds);
      if (employeeResult.error) throw new Error(employeeResult.error.message);
    }

    if (activeBranchIds.length > 0) {
      const branchResult = await supabase.from("sucursales").update({ estado: "activo" }).in("id", activeBranchIds);
      if (branchResult.error) throw new Error(branchResult.error.message);
    }
  }

  const fixtureUserIds = Object.values(fixtures.accounts ?? {}).map((account) => account.id).filter(Boolean);
  if (fixtureUserIds.length > 0) {
    const accessResult = await supabase
      .from("sucursal_usuarios")
      .update({ activo: true })
      .in("usuario_id", fixtureUserIds)
      .in("negocio_id", businessIds);
    if (accessResult.error) throw new Error(accessResult.error.message);
  }

  return { ...fixtures, generatedAt: new Date().toISOString() };
}

async function seedFixtures() {
  const plansResult = await supabase
    .from("planes_saas")
    .select("id, clave, nombre, limite_citas_mensuales, limite_empleados, limite_servicios, limite_clientes, limite_sucursales")
    .in("clave", ["gratis", "basico", "profesional", "empresarial"]);
  if (plansResult.error) throw new Error(plansResult.error.message);

  const plans = Object.fromEntries((plansResult.data ?? []).map((plan) => [plan.clave, plan]));
  for (const key of ["gratis", "basico", "profesional", "empresarial"]) {
    if (!plans[key]) throw new Error(`Falta el plan requerido: ${key}`);
  }

  const accounts = {};
  const businesses = {};
  for (const planKey of ["gratis", "basico", "profesional", "empresarial"]) {
    const accountKey = planKey === "empresarial" ? "admin" : `admin-${planKey}`;
    const account = await createAuthAccount(accountKey, `Admin E2E ${plans[planKey].nombre}`);
    accounts[`admin_${planKey}`] = account;
    businesses[planKey] = await createBusiness(plans[planKey], account, planKey);
  }

  const enterprise = businesses.empresarial;
  const secondaryResult = await supabase
    .from("sucursales")
    .insert({
      negocio_id: enterprise.id,
      nombre: "Sucursal E2E Centro",
      direccion: "Centro",
      estado: "activo",
      es_principal: false,
    })
    .select("id, nombre")
    .single();
  if (secondaryResult.error || !secondaryResult.data) throw new Error(secondaryResult.error?.message ?? "No se creó sucursal secundaria");
  enterprise.secondaryBranch = secondaryResult.data;

  const secondaryEmployee = await supabase
    .from("empleados")
    .insert({
      negocio_id: enterprise.id,
      sucursal_id: secondaryResult.data.id,
      nombre: "Personal E2E Centro",
      email: "personal.centro@agendame.test",
      color_calendario: "#f59e0b",
      estado: "activo",
    })
    .select("id, nombre")
    .single();
  if (secondaryEmployee.error || !secondaryEmployee.data) throw new Error(secondaryEmployee.error?.message ?? "No se creó empleado secundario");
  enterprise.secondaryEmployee = secondaryEmployee.data;

  const secondaryLink = await supabase.from("empleado_servicios").insert({
    empleado_id: secondaryEmployee.data.id,
    servicio_id: enterprise.service.id,
  });
  if (secondaryLink.error) throw new Error(secondaryLink.error.message);

  const secondaryHours = Array.from({ length: 7 }, (_, day) => ({
    empleado_id: secondaryEmployee.data.id,
    dia_semana: day,
    activo: true,
    hora_inicio: "07:00",
    hora_fin: "21:00",
    descanso_inicio: null,
    descanso_fin: null,
  }));
  const secondaryHoursResult = await supabase.from("horarios_empleado").insert(secondaryHours);
  if (secondaryHoursResult.error) throw new Error(secondaryHoursResult.error.message);

  accounts.gerente = await createBranchAccount({
    key: "gerente",
    name: "Gerente E2E",
    role: "gerente_sucursal",
    business: enterprise,
    branch: secondaryResult.data,
  });
  accounts.recepcion = await createBranchAccount({
    key: "recepcion",
    name: "Recepción E2E",
    role: "recepcionista_sucursal",
    business: enterprise,
    branch: secondaryResult.data,
  });
  accounts.empleado = await createBranchAccount({
    key: "empleado",
    name: "Personal E2E",
    role: "empleado_sucursal",
    business: enterprise,
    branch: secondaryResult.data,
    employeeId: secondaryEmployee.data.id,
  });
  accounts.profesional_restringido = await createBranchAccount({
    key: "profesional-restringido",
    name: "Gerente Profesional E2E",
    role: "gerente_sucursal",
    business: businesses.profesional,
    branch: businesses.profesional.principalBranch,
  });

  accounts.onboarding = await createAuthAccount("onboarding", "Cuenta Onboarding E2E");
  accounts.superadmin = await createAuthAccount("superadmin", "Propietario E2E AgendaMe");
  const ownerProfileResult = await supabase
    .from("perfiles_usuario")
    .update({ rol_global: "super_admin", cargo: "Propietario" })
    .eq("id", accounts.superadmin.id);
  if (ownerProfileResult.error) throw new Error(ownerProfileResult.error.message);

  return {
    generatedAt: new Date().toISOString(),
    protectedOwnerId,
    ownerOverrideId: accounts.superadmin.id,
    plans,
    businesses,
    accounts,
  };
}

console.log("Modo seguro: se conservan todos los datos existentes.");
const existingFixtures = await resetExistingFixtures();
if (existingFixtures) {
  const e2eDir = path.join(root, ".e2e");
  fs.mkdirSync(e2eDir, { recursive: true });
  fs.writeFileSync(path.join(e2eDir, "fixtures.json"), JSON.stringify(existingFixtures, null, 2), "utf8");
  console.log("Fixtures E2E existentes restaurados sin borrar historial.");
  process.exit(0);
}

await cleanE2EFixtures();
console.log("No habia fixtures E2E persistentes; se preparara un entorno nuevo.");
const fixtures = await seedFixtures();

const e2eDir = path.join(root, ".e2e");
fs.mkdirSync(e2eDir, { recursive: true });
fs.writeFileSync(path.join(e2eDir, "fixtures.json"), JSON.stringify(fixtures, null, 2), "utf8");
console.log("Fixtures E2E creados para los cuatro planes y todos los roles.");
