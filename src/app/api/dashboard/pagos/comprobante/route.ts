import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import {
  obtenerUrlSeguraComprobantePago,
  PAYMENT_PROOFS_BUCKET,
} from "@/lib/payment-proofs";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function extensionDesdeMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return null;
}

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

export async function GET(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const pagoId = String(searchParams.get("pagoId") ?? "").trim();

    if (!pagoId) {
      return NextResponse.json({ error: "Falta el pago." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: pago, error } = await supabase
      .from("pagos_manuales")
      .select("id, comprobante_url")
      .eq("id", pagoId)
      .eq("negocio_id", guard.access.negocio.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!pago?.comprobante_url) {
      return NextResponse.json({ error: "Este pago no tiene comprobante." }, { status: 404 });
    }

    const url = await obtenerUrlSeguraComprobantePago(pago.comprobante_url);

    if (!url) {
      return NextResponse.json({ error: "No se pudo resolver el comprobante." }, { status: 404 });
    }

    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Error abriendo comprobante desde dashboard:", error);
    const mensaje = error instanceof Error && error.message ? error.message : "No se pudo abrir el comprobante.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  try {
    const authSupabase = await createClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const planId = limpiar(formData.get("planId"));
    const montoGs = Number(limpiar(formData.get("montoGs")).replace(/\D/g, ""));
    const metodo = limpiar(formData.get("metodo")) || "transferencia";
    const cicloRaw = limpiar(formData.get("ciclo"));
    const ciclo = cicloRaw === "mensual" || cicloRaw === "anual" ? cicloRaw : "manual";
    const notasCliente = limpiar(formData.get("notasCliente"));
    const file = formData.get("file");

    if (!planId) {
      return NextResponse.json({ error: "Selecciona el plan que estas pagando." }, { status: 400 });
    }

    if (!Number.isFinite(montoGs) || montoGs <= 0) {
      return NextResponse.json({ error: "Indica el monto abonado." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Adjunta el comprobante de pago." }, { status: 400 });
    }

    const extension = extensionDesdeMime(file.type);
    if (!extension) {
      return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WEBP o PDF." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El comprobante no puede superar 5 MB." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: membresia, error: membresiaError } = await supabase
      .from("negocio_usuarios")
      .select("negocio_id")
      .eq("usuario_id", user.id)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    if (membresiaError) throw new Error(membresiaError.message);
    if (!membresia) {
      return NextResponse.json({ error: "No encontramos un negocio activo para tu usuario." }, { status: 404 });
    }

    const { data: plan, error: planError } = await supabase
      .from("planes_saas")
      .select("id, nombre")
      .eq("id", planId)
      .maybeSingle();

    if (planError) throw new Error(planError.message);
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
    }

    const { data: suscripcion } = await supabase
      .from("suscripciones")
      .select("id")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: pago, error: insertError } = await supabase
      .from("pagos_manuales")
      .insert({
        negocio_id: membresia.negocio_id,
        suscripcion_id: suscripcion?.id ?? null,
        plan_id: plan.id,
        monto_gs: montoGs,
        metodo,
        ciclo_facturacion: ciclo,
        estado: "pendiente",
        fecha_pago: new Date().toISOString(),
        notas_cliente: notasCliente || "Comprobante subido desde el panel del negocio.",
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${membresia.negocio_id}/${pago.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      await supabase.from("pagos_manuales").delete().eq("id", pago.id);
      throw new Error(uploadError.message);
    }

    const { error: updateError } = await supabase
      .from("pagos_manuales")
      .update({ comprobante_url: path })
      .eq("id", pago.id);

    if (updateError) {
      await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([path]);
      await supabase.from("pagos_manuales").delete().eq("id", pago.id);
      throw new Error(updateError.message);
    }

    await supabase.from("auditoria").insert({
      usuario_id: user.id,
      negocio_id: membresia.negocio_id,
      accion: "comprobante_pago_subido",
      tabla_afectada: "pagos_manuales",
      registro_id: pago.id,
      detalles: { plan_id: plan.id, monto_gs: montoGs, metodo },
      origen: "dashboard_negocio",
    });

    revalidatePath("/dashboard/planes");
    revalidatePath("/admin");
    revalidatePath("/admin/pagos");
    revalidatePath(`/admin/negocios/${membresia.negocio_id}`);

    return NextResponse.json({
      message: "Comprobante enviado. Queda pendiente de revision.",
      pagoId: pago.id,
    });
  } catch (error) {
    console.error("Error subiendo comprobante desde dashboard:", error);
    const mensaje = error instanceof Error && error.message ? error.message : "No se pudo enviar el comprobante.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
