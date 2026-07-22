import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { scenarioFor } from "./profiles.js";

const baseUrl = (__ENV.BASE_URL || "").replace(/\/$/, "");
const fixtureFile = __ENV.FIXTURES_FILE || "./fixtures.local.json";
const profile = __ENV.PROFILE || "smoke";
const loadDate = __ENV.LOAD_DATE || futureIsoDate(14);

const tenants = new SharedArray("load-test-tenants", () => {
  const parsed = JSON.parse(open(fixtureFile));

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("FIXTURES_FILE debe contener al menos un negocio.");
  }

  return parsed;
});

if (!baseUrl) {
  throw new Error("Falta BASE_URL del deployment de staging.");
}

export const options = {
  scenarios: {
    publicReads: scenarioFor(profile),
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:public_page}": ["p(95)<2500"],
    "http_req_duration{endpoint:availability}": ["p(95)<1200"],
  },
};

function futureIsoDate(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function tenantForIteration() {
  return tenants[(__VU + __ITER) % tenants.length];
}

export default function () {
  const tenant = tenantForIteration();
  const page = http.get(`${baseUrl}/reservar/${tenant.slug}`, {
    tags: { endpoint: "public_page" },
  });

  check(page, {
    "pagina publica responde 200": (response) => response.status === 200,
  });

  const params = [
    `servicioId=${encodeURIComponent(tenant.serviceId)}`,
    `fecha=${encodeURIComponent(loadDate)}`,
  ];

  if (tenant.branchId) {
    params.push(`sucursalId=${encodeURIComponent(tenant.branchId)}`);
  }

  const availability = http.get(
    `${baseUrl}/api/public/disponibilidad/${tenant.slug}?${params.join("&")}`,
    { tags: { endpoint: "availability" } }
  );

  check(availability, {
    "disponibilidad responde 200": (response) => response.status === 200,
    "disponibilidad devuelve slots": (response) => {
      try {
        return Array.isArray(response.json("slots"));
      } catch {
        return false;
      }
    },
  });

  sleep(0.8 + Math.random() * 1.2);
}
