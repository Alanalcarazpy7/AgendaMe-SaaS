import http from "k6/http";
import { check, sleep } from "k6";
import { scenarioFor } from "./profiles.js";

const baseUrl = (__ENV.BASE_URL || "").replace(/\/$/, "");
const storageStateFile = __ENV.DASHBOARD_STORAGE_STATE || "";
const storageState = storageStateFile
  ? JSON.parse(open(storageStateFile))
  : null;
const sessionCookie = __ENV.DASHBOARD_COOKIE || "";
const storageCookies = storageState?.cookies ?? [];
const profile = __ENV.PROFILE || "smoke";
const routes = [
  "/dashboard",
  "/dashboard/citas",
  "/dashboard/clientes",
  "/dashboard/empleados",
  "/dashboard/servicios",
];

if (!baseUrl) {
  throw new Error("Falta BASE_URL del deployment de staging.");
}

if (!sessionCookie && storageCookies.length === 0) {
  throw new Error(
    "Falta DASHBOARD_COOKIE o DASHBOARD_STORAGE_STATE de una cuenta exclusiva de staging."
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
  },
};

export default function () {
  const route = routes[(__VU + __ITER) % routes.length];
  const cookieJar = http.cookieJar();

  for (const cookie of storageCookies) {
    cookieJar.set(baseUrl, cookie.name, cookie.value, {
      path: cookie.path || "/",
      secure: Boolean(cookie.secure),
    });
  }

  const response = http.get(`${baseUrl}${route}`, {
    headers: sessionCookie ? { Cookie: sessionCookie } : {},
    redirects: 0,
    tags: { endpoint: "dashboard" },
  });

  if (__VU === 1 && __ITER === 0 && response.status !== 200) {
    console.error(
      `Dashboard respondio ${response.status}; destino: ${response.headers.Location || "sin Location"}`
    );
  }

  check(response, {
    "dashboard responde 200": (result) => result.status === 200,
    "dashboard no redirige al login": (result) =>
      !String(result.headers.Location || "").includes("/login"),
  });

  sleep(1 + Math.random() * 2);
}
