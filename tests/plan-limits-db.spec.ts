import { test, expect } from "@playwright/test";
import {
  borrarNegocioPrueba,
  crearCitaDirecta,
  crearEmpleado,
  crearNegocioPrueba,
  crearServicio,
  intentarCrearCitaDirecta,
  intentarCrearCliente,
  intentarCrearEmpleado,
  intentarCrearServicio,
  obtenerPlanes,
  prepararAgendaBase,
  type PlanClave,
  usoMensual,
} from "./helpers/supabase-db";

test.describe.configure({ mode: "serial" });

function errorDebeSerLimite(error: any) {
  expect(error, "Se esperaba error de límite, pero no hubo error").toBeTruthy();

  const message = String(error?.message ?? "");

  expect(message).toMatch(/l[ií]mite|plan|alcanz[oó]|cupo|crear/i);
}

test("catálogo de planes tiene límites coherentes", async () => {
  const planes = await obtenerPlanes();

  console.log("Planes actuales en DB:", JSON.stringify(planes, null, 2));

  expect(planes.gratis).toBeTruthy();
  expect(planes.basico).toBeTruthy();
  expect(planes.profesional).toBeTruthy();
  expect(planes.empresarial).toBeTruthy();

  expect(planes.gratis.limite_citas_mensuales).not.toBeNull();
  expect(planes.basico.limite_citas_mensuales).not.toBeNull();

  expect(planes.profesional.limite_citas_mensuales).toBeNull();
  expect(planes.empresarial.limite_citas_mensuales).toBeNull();
});

test("plan gratis bloquea la cita 21 del mismo mes y permite el mes siguiente", async () => {
  test.setTimeout(180_000);

  const fixture = await crearNegocioPrueba("gratis");

  try {
    const agenda = await prepararAgendaBase(fixture);
    const limite = Number(fixture.plan.limite_citas_mensuales ?? 20);

    for (let i = 0; i < limite; i++) {
      await crearCitaDirecta({
        negocioId: fixture.negocioId,
        sucursalId: fixture.sucursalId,
        clienteId: agenda.clienteId,
        servicioId: agenda.servicioId,
        empleadoId: agenda.empleadoId,
        monthOffset: 2,
        index: i,
      });
    }

    await expect(usoMensual(fixture.negocioId, 2)).resolves.toBe(limite);

    const intentoExtra = await intentarCrearCitaDirecta({
      negocioId: fixture.negocioId,
      sucursalId: fixture.sucursalId,
      clienteId: agenda.clienteId,
      servicioId: agenda.servicioId,
      empleadoId: agenda.empleadoId,
      monthOffset: 2,
      index: limite,
    });

    errorDebeSerLimite(intentoExtra.error);

    await crearCitaDirecta({
      negocioId: fixture.negocioId,
      sucursalId: fixture.sucursalId,
      clienteId: agenda.clienteId,
      servicioId: agenda.servicioId,
      empleadoId: agenda.empleadoId,
      monthOffset: 3,
      index: 0,
    });

    await expect(usoMensual(fixture.negocioId, 3)).resolves.toBe(1);

    console.log(`Gratis OK: ${limite} citas bloquea extra, mes siguiente vuelve a contar desde 1.`);
  } finally {
    await borrarNegocioPrueba(fixture.negocioId);
  }
});

test("plan básico bloquea la cita extra después de su límite mensual", async () => {
  test.setTimeout(240_000);

  const fixture = await crearNegocioPrueba("basico");

  try {
    const agenda = await prepararAgendaBase(fixture);
    const limite = Number(fixture.plan.limite_citas_mensuales ?? 100);

    test.skip(limite > 250, `Límite demasiado alto para test local: ${limite}`);

    for (let i = 0; i < limite; i++) {
      await crearCitaDirecta({
        negocioId: fixture.negocioId,
        sucursalId: fixture.sucursalId,
        clienteId: agenda.clienteId,
        servicioId: agenda.servicioId,
        empleadoId: agenda.empleadoId,
        monthOffset: 4,
        index: i,
      });
    }

    await expect(usoMensual(fixture.negocioId, 4)).resolves.toBe(limite);

    const intentoExtra = await intentarCrearCitaDirecta({
      negocioId: fixture.negocioId,
      sucursalId: fixture.sucursalId,
      clienteId: agenda.clienteId,
      servicioId: agenda.servicioId,
      empleadoId: agenda.empleadoId,
      monthOffset: 4,
      index: limite,
    });

    errorDebeSerLimite(intentoExtra.error);

    console.log(`Básico OK: ${limite} citas permitidas y la extra bloqueada.`);
  } finally {
    await borrarNegocioPrueba(fixture.negocioId);
  }
});

test("plan profesional permite muchas citas porque es ilimitado en citas", async () => {
  test.setTimeout(240_000);

  const fixture = await crearNegocioPrueba("profesional");

  try {
    const agenda = await prepararAgendaBase(fixture);
    const total = 120;

    expect(fixture.plan.limite_citas_mensuales).toBeNull();

    for (let i = 0; i < total; i++) {
      await crearCitaDirecta({
        negocioId: fixture.negocioId,
        sucursalId: fixture.sucursalId,
        clienteId: agenda.clienteId,
        servicioId: agenda.servicioId,
        empleadoId: agenda.empleadoId,
        monthOffset: 5,
        index: i,
      });
    }

    await expect(usoMensual(fixture.negocioId, 5)).resolves.toBe(total);

    console.log(`Profesional OK: ${total} citas creadas sin bloqueo mensual.`);
  } finally {
    await borrarNegocioPrueba(fixture.negocioId);
  }
});

test("plan empresarial permite muchas citas porque es ilimitado", async () => {
  test.setTimeout(300_000);

  const fixture = await crearNegocioPrueba("empresarial");

  try {
    const agenda = await prepararAgendaBase(fixture);
    const total = 150;

    expect(fixture.plan.limite_citas_mensuales).toBeNull();

    for (let i = 0; i < total; i++) {
      await crearCitaDirecta({
        negocioId: fixture.negocioId,
        sucursalId: fixture.sucursalId,
        clienteId: agenda.clienteId,
        servicioId: agenda.servicioId,
        empleadoId: agenda.empleadoId,
        monthOffset: 6,
        index: i,
      });
    }

    await expect(usoMensual(fixture.negocioId, 6)).resolves.toBe(total);

    console.log(`Empresarial OK: ${total} citas creadas sin bloqueo mensual.`);
  } finally {
    await borrarNegocioPrueba(fixture.negocioId);
  }
});

for (const planClave of ["gratis", "basico", "profesional", "empresarial"] as PlanClave[]) {
  test(`límite de empleados activo se cumple para plan ${planClave}`, async () => {
    test.setTimeout(180_000);

    const fixture = await crearNegocioPrueba(planClave);

    try {
      const limite = fixture.plan.limite_empleados;

      if (limite === null) {
        for (let i = 0; i < 25; i++) {
          await crearEmpleado(fixture.negocioId, fixture.sucursalId, i);
        }

        console.log(`${planClave} OK: empleados ilimitados, 25 creados.`);
        return;
      }

      for (let i = 0; i < limite; i++) {
        await crearEmpleado(fixture.negocioId, fixture.sucursalId, i);
      }

      const extra = await intentarCrearEmpleado(fixture.negocioId, fixture.sucursalId, limite + 1);

      errorDebeSerLimite(extra.error);

      console.log(`${planClave} OK: ${limite} empleados permitidos y extra bloqueado.`);
    } finally {
      await borrarNegocioPrueba(fixture.negocioId);
    }
  });
}

for (const planClave of ["gratis", "basico", "profesional", "empresarial"] as PlanClave[]) {
  test(`límite de servicios activos se cumple para plan ${planClave}`, async () => {
    test.setTimeout(180_000);

    const fixture = await crearNegocioPrueba(planClave);

    try {
      const limite = fixture.plan.limite_servicios;

      if (limite === null) {
        for (let i = 0; i < 30; i++) {
          await crearServicio(fixture.negocioId, i);
        }

        console.log(`${planClave} OK: servicios ilimitados, 30 creados.`);
        return;
      }

      for (let i = 0; i < limite; i++) {
        await crearServicio(fixture.negocioId, i);
      }

      const extra = await intentarCrearServicio(fixture.negocioId, limite + 1);

      errorDebeSerLimite(extra.error);

      console.log(`${planClave} OK: ${limite} servicios permitidos y extra bloqueado.`);
    } finally {
      await borrarNegocioPrueba(fixture.negocioId);
    }
  });
}

for (const planClave of ["gratis", "basico", "profesional", "empresarial"] as PlanClave[]) {
  test(`límite de clientes activos se cumple si está implementado para plan ${planClave}`, async () => {
    test.setTimeout(180_000);

    const fixture = await crearNegocioPrueba(planClave);

    try {
      const limite = fixture.plan.limite_clientes;

      test.skip(
        typeof limite === "undefined",
        "La columna limite_clientes no existe o no fue expuesta en planes_saas."
      );

      if (limite === null) {
        for (let i = 0; i < 50; i++) {
          const result = await intentarCrearCliente(fixture.negocioId, i);
          expect(result.error).toBeFalsy();
        }

        console.log(`${planClave} OK: clientes ilimitados, 50 creados.`);
        return;
      }

      test.skip(limite > 250, `Límite de clientes demasiado alto para test local: ${limite}`);

      for (let i = 0; i < limite; i++) {
        const result = await intentarCrearCliente(fixture.negocioId, i);
        expect(result.error).toBeFalsy();
      }

      const extra = await intentarCrearCliente(fixture.negocioId, limite + 1);

      errorDebeSerLimite(extra.error);

      console.log(`${planClave} OK: ${limite} clientes permitidos y extra bloqueado.`);
    } finally {
      await borrarNegocioPrueba(fixture.negocioId);
    }
  });
}