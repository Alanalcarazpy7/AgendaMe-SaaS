import { test, expect } from "@playwright/test";

import type { APIRequestContext } from "@playwright/test";
import { AGENDA } from "./helpers/agendame";

type ApiCheck = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  data?: unknown;
};

const protectedApiChecks: ApiCheck[] = [
  { method: "GET", path: "/api/dashboard/citas" },
  { method: "POST", path: "/api/dashboard/citas", data: {} },
  { method: "PATCH", path: "/api/dashboard/citas/00000000-0000-0000-0000-000000000000", data: {} },
  { method: "DELETE", path: "/api/dashboard/citas/00000000-0000-0000-0000-000000000000" },

  { method: "GET", path: "/api/dashboard/clientes" },
  { method: "POST", path: "/api/dashboard/clientes", data: {} },
  { method: "PATCH", path: "/api/dashboard/clientes/00000000-0000-0000-0000-000000000000", data: {} },
  { method: "DELETE", path: "/api/dashboard/clientes/00000000-0000-0000-0000-000000000000" },

  { method: "GET", path: "/api/dashboard/empleados" },
  { method: "POST", path: "/api/dashboard/empleados", data: {} },
  { method: "PATCH", path: "/api/dashboard/empleados/00000000-0000-0000-0000-000000000000", data: {} },
  { method: "DELETE", path: "/api/dashboard/empleados/00000000-0000-0000-0000-000000000000" },

  { method: "GET", path: "/api/dashboard/servicios" },
  { method: "POST", path: "/api/dashboard/servicios", data: {} },
  { method: "POST", path: "/api/dashboard/servicios/imagenes", data: {} },
  { method: "PATCH", path: "/api/dashboard/servicios/00000000-0000-0000-0000-000000000000", data: {} },
  { method: "DELETE", path: "/api/dashboard/servicios/00000000-0000-0000-0000-000000000000" },
  { method: "POST", path: "/api/dashboard/servicios/00000000-0000-0000-0000-000000000000/imagen", data: {} },
  { method: "DELETE", path: "/api/dashboard/servicios/00000000-0000-0000-0000-000000000000/imagen" },

  { method: "GET", path: "/api/dashboard/exportar" },

  { method: "PATCH", path: "/api/dashboard/mi-cuenta", data: {} },
  { method: "POST", path: "/api/dashboard/mi-cuenta/avatar", data: {} },
  { method: "PATCH", path: "/api/dashboard/mi-cuenta/password", data: {} },

  { method: "GET", path: "/api/dashboard/negocio/branding" },
  { method: "POST", path: "/api/dashboard/negocio/branding", data: {} },
  { method: "DELETE", path: "/api/dashboard/negocio/branding", data: {} },
  { method: "GET", path: "/api/dashboard/negocio/intervalo-reserva" },
  { method: "PATCH", path: "/api/dashboard/negocio/intervalo-reserva", data: {} },
  { method: "POST", path: "/api/dashboard/configuracion/horarios", data: {} },

  { method: "POST", path: "/api/dashboard/planes/solicitudes", data: {} },
  { method: "PATCH", path: "/api/dashboard/planes/regularizar-sucursales", data: {} },

  { method: "GET", path: "/api/dashboard/pagos/comprobante?pagoId=00000000-0000-0000-0000-000000000000" },
  { method: "POST", path: "/api/dashboard/pagos/comprobante", data: {} },

  { method: "GET", path: "/api/dashboard/sucursales" },
  { method: "POST", path: "/api/dashboard/sucursales", data: {} },
  { method: "PATCH", path: "/api/dashboard/sucursales", data: {} },
  { method: "DELETE", path: "/api/dashboard/sucursales", data: {} },

  { method: "GET", path: "/api/dashboard/sucursales/empleados" },
  { method: "PATCH", path: "/api/dashboard/sucursales/empleados", data: {} },
  { method: "GET", path: "/api/dashboard/sucursales/usuarios" },
  { method: "POST", path: "/api/dashboard/sucursales/usuarios", data: {} },
  { method: "PATCH", path: "/api/dashboard/sucursales/usuarios", data: {} },
  { method: "DELETE", path: "/api/dashboard/sucursales/usuarios", data: {} },

  { method: "GET", path: "/api/dashboard/servicios/imagenes" },

  { method: "POST", path: "/api/onboarding/negocio", data: {} },

  { method: "GET", path: "/api/admin/pagos/00000000-0000-0000-0000-000000000000/comprobante" },
  { method: "POST", path: "/api/admin/pagos/00000000-0000-0000-0000-000000000000/comprobante", data: {} },
];

async function callApi(request: APIRequestContext, check: ApiCheck) {
  return request.fetch(check.path, {
    method: check.method,
    data: check.data,
    failOnStatusCode: false,
  });
}

function esSuccess(status: number) {
  return status >= 200 && status < 300;
}

test.describe("seguridad APIs privadas sin sesión", () => {
  for (const check of protectedApiChecks) {
    test(`${check.method} ${check.path} no debe funcionar sin sesión`, async ({ request }) => {
      const response = await callApi(request, check);
      const status = response.status();

      expect(
        esSuccess(status),
        `${check.method} ${check.path} respondió ${status}. Una API privada no debe devolver éxito sin sesión.`
      ).toBe(false);

      expect(
        status,
        `${check.method} ${check.path} devolvió error 500. Debería bloquear con 401/403/400/404/405, pero no romper.`
      ).toBeLessThan(500);

      console.log(`API privada protegida OK: ${check.method} ${check.path} -> ${status}`);
    });
  }
});

test.describe("APIs públicas básicas", () => {
  test("disponibilidad pública no exige sesión y no rompe", async ({ request }) => {
    const response = await request.get(
      `/api/public/disponibilidad/${AGENDA.slug}?servicioId=00000000-0000-0000-0000-000000000000&fecha=2026-07-06&sucursalId=00000000-0000-0000-0000-000000000000`,
      {
        failOnStatusCode: false,
      }
    );

    const status = response.status();

    expect(status).not.toBe(401);
    expect(status).not.toBe(403);
    expect(status).toBeLessThan(500);

    console.log(`API pública disponibilidad OK -> ${status}`);
  });

  test("reservas públicas inválidas no exigen sesión y no rompen", async ({ request }) => {
    const response = await request.post(`/api/public/reservas/${AGENDA.slug}`, {
      data: {},
      failOnStatusCode: false,
    });

    const status = response.status();

    expect(status).not.toBe(401);
    expect(status).not.toBe(403);
    expect(status).toBeLessThan(500);

    console.log(`API pública reservas inválida OK -> ${status}`);
  });

  test("aceptar invitación inválida no rompe", async ({ request }) => {
    const response = await request.post("/api/invitaciones/aceptar", {
      data: {},
      failOnStatusCode: false,
    });

    const status = response.status();

    expect(status).toBeLessThan(500);

    console.log(`API invitación inválida OK -> ${status}`);
  });
});
