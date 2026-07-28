import { expect, test, type APIRequestContext } from "@playwright/test";

import {
  siguienteLunesIso,
  sumarDiasIso,
  uniqueId,
} from "./helpers/agendame";
import { loadE2EFixtures } from "./helpers/e2e-fixtures";
import { supabaseAdmin } from "./helpers/supabase-db";

const fixtures = loadE2EFixtures();
const business = fixtures.businesses.empresarial;

async function primerHorarioDisponible(
  request: APIRequestContext,
  fecha: string,
) {
  const query = new URLSearchParams({
    servicioId: business.service.id,
    sucursalId: business.secondaryBranch!.id,
    fecha,
  });
  const response = await request.get(
    `/api/public/disponibilidad/${business.slug}?${query.toString()}`,
  );

  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as { slots?: string[] };
  const hora = body.slots?.[0];

  expect(hora, `No hay horarios disponibles para ${fecha}.`).toBeTruthy();

  return hora!;
}

test("un cliente puede reservar nuevamente con el mismo correo", async ({
  request,
}) => {
  test.setTimeout(90_000);

  const id = uniqueId();
  const email = `cliente.recurrente.${id}@example.com`;
  const primeraFecha = sumarDiasIso(siguienteLunesIso(), 455);
  const segundaFecha = sumarDiasIso(primeraFecha, 7);
  const primeraHora = await primerHorarioDisponible(request, primeraFecha);
  const segundaHora = await primerHorarioDisponible(request, segundaFecha);
  const citasIds: string[] = [];
  let clienteId: string | null = null;

  const reservar = async ({
    fecha,
    horaInicio,
    telefono,
    ip,
  }: {
    fecha: string;
    horaInicio: string;
    telefono: string;
    ip: string;
  }) =>
    request.post(`/api/public/reservas/${business.slug}`, {
      headers: { "x-forwarded-for": ip },
      data: {
        servicioId: business.service.id,
        sucursalId: business.secondaryBranch!.id,
        fecha,
        horaInicio,
        clienteNombre: `Cliente recurrente ${id}`,
        clienteTelefono: telefono,
        clienteEmail: email.toUpperCase(),
        notas: `Identidad recurrente E2E ${id}`,
      },
    });

  try {
    const primeraReserva = await reservar({
      fecha: primeraFecha,
      horaInicio: primeraHora,
      telefono: `0971${id.slice(-6)}`,
      ip: `2001:db8:${id.slice(0, 4)}:31::1`,
    });
    expect(primeraReserva.status()).toBe(200);

    const primeraRespuesta = (await primeraReserva.json()) as {
      citaId: string;
    };
    citasIds.push(primeraRespuesta.citaId);

    const segundaReserva = await reservar({
      fecha: segundaFecha,
      horaInicio: segundaHora,
      telefono: `0972${id.slice(-6)}`,
      ip: `2001:db8:${id.slice(0, 4)}:32::1`,
    });
    expect(segundaReserva.status()).toBe(200);

    const segundaRespuesta = (await segundaReserva.json()) as {
      citaId: string;
    };
    citasIds.push(segundaRespuesta.citaId);

    const supabase = supabaseAdmin();
    const { data: clientes, error: clientesError } = await supabase
      .from("clientes")
      .select("id, email, telefono")
      .eq("negocio_id", business.id)
      .eq("email", email);

    expect(clientesError).toBeNull();
    expect(clientes).toHaveLength(1);

    clienteId = clientes?.[0]?.id ?? null;
    expect(clienteId).toBeTruthy();
    expect(clientes?.[0]?.telefono).toBe(`0972${id.slice(-6)}`);

    const { data: citas, error: citasError } = await supabase
      .from("citas")
      .select("id, cliente_id")
      .in("id", citasIds);

    expect(citasError).toBeNull();
    expect(citas).toHaveLength(2);
    expect(new Set(citas?.map((cita) => cita.cliente_id))).toEqual(
      new Set([clienteId]),
    );
  } finally {
    const supabase = supabaseAdmin();

    if (citasIds.length) {
      await supabase.from("citas").delete().in("id", citasIds);
    }

    if (clienteId) {
      await supabase
        .from("clientes")
        .delete()
        .eq("id", clienteId)
        .eq("negocio_id", business.id);
    }
  }
});
