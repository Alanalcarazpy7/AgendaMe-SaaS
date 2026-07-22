import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fixturePath = path.join(root, ".e2e", "fixtures.json");
const loadDir = path.join(root, "tests", "load");

if (!fs.existsSync(fixturePath)) {
  throw new Error("Faltan .e2e/fixtures.json. Ejecuta npm run test:e2e:prepare.");
}

const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const publicFixtures = Object.entries(fixtures.businesses ?? {}).map(
  ([plan, business]) => ({
    name: `e2e-${plan}`,
    slug: business.slug,
    serviceId: business.service.id,
    branchId: business.principalBranch.id,
  })
);

if (publicFixtures.length === 0) {
  throw new Error("No hay negocios E2E para preparar k6.");
}

fs.mkdirSync(loadDir, { recursive: true });
fs.writeFileSync(
  path.join(loadDir, "fixtures.local.json"),
  JSON.stringify(publicFixtures, null, 2),
  "utf8"
);

const dashboardSessions = [];
const dashboardRoutesByAccount = {
  gerente: ["/dashboard", "/dashboard/citas", "/dashboard/clientes", "/dashboard/empleados"],
  recepcion: ["/dashboard", "/dashboard/citas", "/dashboard/clientes"],
  empleado: ["/dashboard", "/dashboard/citas"],
};

for (const [accountKey, account] of Object.entries(fixtures.accounts ?? {})) {
  const routes = accountKey.startsWith("admin_")
    ? [
        "/dashboard",
        "/dashboard/citas",
        "/dashboard/clientes",
        "/dashboard/empleados",
        "/dashboard/servicios",
      ]
    : dashboardRoutesByAccount[accountKey];
  if (!routes) continue;

  const storagePath = path.join(root, account.storage);
  if (!fs.existsSync(storagePath)) continue;
  if (fs.statSync(storagePath).mtimeMs <= new Date(fixtures.generatedAt).getTime()) {
    continue;
  }

  const storageState = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  const cookie = (storageState.cookies ?? [])
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  if (cookie) {
    dashboardSessions.push({ name: accountKey, routes, cookie });
  }
}

if (dashboardSessions.length > 0) {
  fs.writeFileSync(
    path.join(loadDir, "sessions.local.json"),
    JSON.stringify(dashboardSessions, null, 2),
    "utf8"
  );
}

console.log(`Fixtures publicos preparados: ${publicFixtures.length}.`);
console.log(`Sesiones de dashboard preparadas: ${dashboardSessions.length}.`);
