import { expect, test } from "@playwright/test";
import { AGENDA, uniqueId } from "./helpers/agendame";

test("limita el noveno intento publico por IP", async ({ request }) => {
  const id = uniqueId();
  const headers = { "x-forwarded-for": `2001:db8:ffff:${id.slice(-4)}::1` };
  const payload = {
    servicioId: "00000000-0000-0000-0000-000000000000",
    sucursalId: "00000000-0000-0000-0000-000000000000",
    fecha: "2026-12-31",
    horaInicio: "10:00",
    clienteNombre: `Rate Limit E2E ${id}`,
  };

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = await request.post(`/api/public/reservas/${AGENDA.slug}`, {
      data: {
        ...payload,
        clienteTelefono: `0971${id.slice(-4)}${String(attempt).padStart(2, "0")}`,
      },
      headers,
      failOnStatusCode: false,
    });
    expect(response.status(), `El intento ${attempt} no debe estar limitado todavía`).not.toBe(429);
  }

  const blocked = await request.post(`/api/public/reservas/${AGENDA.slug}`, {
    data: { ...payload, clienteTelefono: `0971${id.slice(-4)}09` },
    headers,
    failOnStatusCode: false,
  });
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  await expect(blocked.json()).resolves.toMatchObject({
    error: expect.stringMatching(/muchas solicitudes/i),
  });
});

test("limita el cuarto intento publico con el mismo telefono", async ({ request }) => {
  const id = uniqueId();
  const payload = {
    servicioId: "00000000-0000-0000-0000-000000000000",
    sucursalId: "00000000-0000-0000-0000-000000000000",
    fecha: "2026-12-31",
    horaInicio: "10:00",
    clienteNombre: `Rate Limit Telefono E2E ${id}`,
    clienteTelefono: `0981${id.slice(-6)}`,
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await request.post(`/api/public/reservas/${AGENDA.slug}`, {
      data: payload,
      headers: {
        "x-forwarded-for": `2001:db8:${id.slice(-4)}:${attempt}::1`,
      },
      failOnStatusCode: false,
    });
    expect(response.status(), `El intento ${attempt} no debe estar limitado`).not.toBe(429);
  }

  const blocked = await request.post(`/api/public/reservas/${AGENDA.slug}`, {
    data: payload,
    headers: {
      "x-forwarded-for": `2001:db8:${id.slice(-4)}:4::1`,
    },
    failOnStatusCode: false,
  });

  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  await expect(blocked.json()).resolves.toMatchObject({
    error: expect.stringMatching(/muchas solicitudes/i),
  });
});

test("mantiene el limite por telefono con solicitudes concurrentes", async ({ request }) => {
  const id = uniqueId();
  const payload = {
    servicioId: "00000000-0000-0000-0000-000000000000",
    sucursalId: "00000000-0000-0000-0000-000000000000",
    fecha: "2026-12-31",
    horaInicio: "10:00",
    clienteNombre: `Rate Limit Concurrente E2E ${id}`,
    clienteTelefono: `0972${id.slice(-6)}`,
  };

  const responses = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      request.post(`/api/public/reservas/${AGENDA.slug}`, {
        data: payload,
        headers: {
          "x-forwarded-for": `2001:db8:${id.slice(-4)}:${index + 10}::1`,
        },
        failOnStatusCode: false,
      })
    )
  );

  const limited = responses.filter((response) => response.status() === 429);
  const acceptedByLimiter = responses.filter(
    (response) => response.status() !== 429
  );

  expect(acceptedByLimiter).toHaveLength(3);
  expect(limited).toHaveLength(3);
  expect(limited.every((response) => Number(response.headers()["retry-after"]) > 0)).toBe(
    true
  );
});
