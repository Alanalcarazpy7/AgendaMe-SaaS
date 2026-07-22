import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { scenarioFor } from "./profiles.js";

const baseUrl = (__ENV.BASE_URL || "").replace(/\/$/, "");
const sessionsFile = __ENV.DASHBOARD_SESSIONS_FILE || "";
const storageStateFile = __ENV.DASHBOARD_STORAGE_STATE || "";
const storageState = storageStateFile
  ? JSON.parse(open(storageStateFile))
  : null;
const sessionCookie = __ENV.DASHBOARD_COOKIE || "";
const storageCookies = storageState?.cookies ?? [];
const dashboardSessions = new SharedArray("dashboard-load-sessions", () => {
  if (!sessionsFile) return [];

  const parsed = JSON.parse(open(sessionsFile));

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("DASHBOARD_SESSIONS_FILE debe contener al menos una sesion.");
  }

  for (const [index, session] of parsed.entries()) {
    if (!session || typeof session.cookie !== "string" || !session.cookie.trim()) {
      throw new Error(`La sesion ${index + 1} no tiene una cookie valida.`);
    }

    if (session.routes && !Array.isArray(session.routes)) {
      throw new Error(`La sesion ${index + 1} tiene routes invalido.`);
    }
  }

  return parsed;
});
const profile = __ENV.PROFILE || "smoke";
const routes = [
  { name: "inicio", path: "/dashboard" },
  { name: "citas", path: "/dashboard/citas" },
  { name: "clientes", path: "/dashboard/clientes" },
  { name: "empleados", path: "/dashboard/empleados" },
  { name: "servicios", path: "/dashboard/servicios" },
];

if (!baseUrl) {
  throw new Error("Falta BASE_URL del deployment de staging.");
}

if (
  dashboardSessions.length === 0 &&
  !sessionCookie &&
  storageCookies.length === 0
) {
  throw new Error(
    "Falta DASHBOARD_SESSIONS_FILE, DASHBOARD_COOKIE o DASHBOARD_STORAGE_STATE."
  );
}

export const options = {
  scenarios: {
    dashboardReads: scenarioFor(profile),
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:dashboard}": ["p(95)<3000"],
    ...Object.fromEntries(
      routes.map((route) => [
        `http_req_duration{route:${route.name}}`,
        ["p(95)<3000"],
      ])
    ),
  },
};

export default function dashboardRead() {
  const selectedSession = dashboardSessions.length
    ? dashboardSessions[(__VU - 1) % dashboardSessions.length]
    : null;
  const requestCookie = selectedSession?.cookie || sessionCookie;
  const cookieJar = http.cookieJar();
  const allowedPaths = selectedSession?.routes;
  const availableRoutes = Array.isArray(allowedPaths) && allowedPaths.length
    ? routes.filter((route) => allowedPaths.includes(route.path))
    : routes;
  const route = availableRoutes[(__VU + __ITER) % availableRoutes.length];

  if (!selectedSession && !sessionCookie) {
    for (const cookie of storageCookies) {
      cookieJar.set(baseUrl, cookie.name, cookie.value, {
        path: cookie.path || "/",
        secure: Boolean(cookie.secure),
      });
    }
  }

  const response = http.get(`${baseUrl}${route.path}`, {
    headers: requestCookie ? { Cookie: requestCookie } : {},
    redirects: 0,
    tags: {
      endpoint: "dashboard",
      route: route.name,
      account: selectedSession?.name || "single-session",
    },
  });

  if (__VU === 1 && __ITER === 0 && response.status !== 200) {
    console.error(
      `Dashboard respondio ${response.status}; destino: ${response.headers.Location || "sin Location"}`
    );
  }

  if (response.status !== 200) {
    console.error(
      `${route.name} respondio ${response.status}; destino: ${response.headers.Location || "sin Location"}`
    );

    if (response.status >= 500) {
      const body = String(response.body || "")
        .replace(/\s+/g, " ")
        .slice(0, 300);
      console.error(
        `${route.name} 5xx; vercel=${response.headers["X-Vercel-Id"] || "sin id"}; cuerpo=${body || "vacio"}`
      );
    }
  }

  check(response, {
    "dashboard responde 200": (result) => result.status === 200,
    "dashboard no redirige al login": (result) =>
      !String(result.headers.Location || "").includes("/login"),
  });

  sleep(1 + Math.random() * 2);
}
