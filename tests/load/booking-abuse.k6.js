import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const baseUrl = (__ENV.BASE_URL || "").replace(/\/$/, "");
const slug = __ENV.PUBLIC_SLUG || "";
const serviceId = __ENV.SERVICE_ID || "";
const branchId = __ENV.BRANCH_ID || null;
const bookingDate = __ENV.BOOKING_DATE || "";
const bookingTime = __ENV.BOOKING_TIME || "";
const phone = __ENV.TEST_PHONE || `0981${String(Date.now()).slice(-6)}`;
const limitedResponses = new Counter("limited_responses");

for (const [name, value] of Object.entries({
  BASE_URL: baseUrl,
  PUBLIC_SLUG: slug,
  SERVICE_ID: serviceId,
  BOOKING_DATE: bookingDate,
  BOOKING_TIME: bookingTime,
})) {
  if (!value) throw new Error(`Falta ${name}.`);
}

export const options = {
  scenarios: {
    bookingAbuse: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 6,
      maxDuration: "1m",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    limited_responses: ["count>=1"],
  },
};

export default function bookingAbuse() {
  const response = http.post(
    `${baseUrl}/api/public/reservas/${slug}`,
    JSON.stringify({
      servicioId: serviceId,
      sucursalId: branchId,
      fecha: bookingDate,
      horaInicio: bookingTime,
      clienteNombre: "Prueba controlada de rate limit",
      clienteTelefono: phone,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "booking_abuse" },
    }
  );

  if (response.status === 429) {
    limitedResponses.add(1);
  }

  const controlledStatuses = [200, 400, 403, 409, 429];
  if (!controlledStatuses.includes(response.status)) {
    console.error(
      `Respuesta inesperada ${response.status}: ${String(response.body || "").slice(0, 300)}`
    );
  }

  check(response, {
    "respuesta controlada": (result) => controlledStatuses.includes(result.status),
    "429 incluye Retry-After": (result) =>
      result.status !== 429 || Number(result.headers["Retry-After"]) > 0,
  });
}
