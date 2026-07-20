import { NextResponse } from "next/server";
import { getPlatformOwnerOrNull } from "@/lib/admin/guard";
import {
  extraerPaymentProofPath,
  obtenerUrlSeguraComprobantePago,
  PAYMENT_PROOFS_BUCKET,
} from "@/lib/payment-proofs";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type RouteProps = {
  params: Promise<{ pagoId: string }>;
};

function extensionDesdeMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return null;
}

async function requireOwnerJson() {
  const owner = await getPlatformOwnerOrNull();
  if (!owner.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No autorizado." },
        { status: owner.reason === "unauthenticated" ? 401 : 403 }
      ),
    };
  }

  return { ok: true as const, owner: owner.owner };
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const guard = await requireOwnerJson();
    if (!guard.ok) return guard.response;

    const { pagoId } = await params;
    const supabase = createServiceRoleClient();

    const { data: pago, error } = await supabase
      .from("pagos_manuales")
      .select("id, comprobante_url")
      .eq("id", pagoId)
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
    console.error("Error abriendo comprobante de pago:", error);
    const mensaje = error instanceof Error && error.message ? error.message : "No se pudo abrir el comprobante.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const guard = await requireOwnerJson();
    if (!guard.ok) return guard.response;

    const { pagoId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecciona un comprobante." }, { status: 400 });
    }

    const extension = extensionDesdeMime(file.type);
    if (!extension) {
      return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WEBP o PDF." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El comprobante no puede superar 5 MB." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: pago, error: pagoError } = await supabase
      .from("pagos_manuales")
      .select("id, negocio_id, comprobante_url")
      .eq("id", pagoId)
      .maybeSingle();

    if (pagoError) throw new Error(pagoError.message);
    if (!pago) return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${pago.negocio_id}/${pago.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) throw new Error(uploadError.message);

    const { error: updateError } = await supabase
      .from("pagos_manuales")
      .update({ comprobante_url: path })
      .eq("id", pago.id);

    if (updateError) {
      await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([path]);
      throw new Error(updateError.message);
    }

    const oldPath = extraerPaymentProofPath(pago.comprobante_url as string | null);
    if (oldPath) {
      await supabase.storage.from(PAYMENT_PROOFS_BUCKET).remove([oldPath]);
    }

    await supabase.from("auditoria").insert({
      usuario_id: guard.owner.id,
      negocio_id: pago.negocio_id,
      accion: "subir_comprobante_pago",
      tabla_afectada: "pagos_manuales",
      registro_id: pago.id,
      detalles: { comprobante_path: path },
      origen: "admin_panel",
    });

    return NextResponse.json({
      message: "Comprobante subido.",
      comprobanteUrl: `/api/admin/pagos/${pago.id}/comprobante`,
    });
  } catch (error) {
    console.error("Error subiendo comprobante de pago:", error);
    const mensaje = error instanceof Error && error.message ? error.message : "No se pudo subir el comprobante.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
