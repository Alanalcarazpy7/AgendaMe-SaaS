import { NextResponse } from "next/server";
import { requirePlatformOwnerApi } from "@/lib/admin/api-guard";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const BUCKET = "medios-pago-plataforma";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type Campo = "logo" | "qr";

function validarCampo(valor: unknown): Campo | null {
  if (valor === "logo" || valor === "qr") return valor;
  return null;
}

function columnaPorCampo(campo: Campo) {
  return campo === "logo" ? "logo_url" : "qr_url";
}

function extensionDesdeMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

function obtenerPathDesdePublicUrl(url: string | null) {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A veces el objeto recien subido tarda un instante en quedar disponible
 * en la URL publica (propagacion del storage). Reintenta unas pocas veces
 * antes de devolver la respuesta, para que el negocio no vea un logo/QR
 * roto justo despues de subirlo. Si sigue sin estar listo, igual se
 * responde éxito (el archivo y la fila ya quedaron guardados bien) y el
 * navegador lo va a poder cargar en cuanto se propague.
 */
async function esperarObjetoDisponible(url: string, intentos = 4, delayMs = 400) {
  for (let intento = 0; intento < intentos; intento += 1) {
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (response.ok) return true;
    } catch {
      // sigue intentando
    }

    if (intento < intentos - 1) await esperar(delayMs);
  }

  return false;
}

export async function POST(request: Request, context: RouteContext) {
  const guard = await requirePlatformOwnerApi();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const admin = createServiceRoleClient();

    const { data: medio, error: medioError } = await admin
      .from("medios_pago_plataforma")
      .select("id, qr_url, logo_url")
      .eq("id", id)
      .maybeSingle();

    if (medioError) throw new Error(medioError.message);

    if (!medio) {
      return NextResponse.json({ error: "Medio de pago no encontrado." }, { status: 404 });
    }

    const formData = await request.formData();
    const campo = validarCampo(formData.get("campo"));
    const file = formData.get("file");

    if (!campo) {
      return NextResponse.json({ error: "Campo inválido. Usá logo o qr." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Seleccioná una imagen." }, { status: 400 });
    }

    const extension = extensionDesdeMime(file.type);

    if (!extension) {
      return NextResponse.json(
        { error: "Formato no permitido. Usá JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "La imagen no puede superar 2 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const path = `${id}/${campo}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path);

    const columna = columnaPorCampo(campo);

    const { error: updateError } = await admin
      .from("medios_pago_plataforma")
      .update({ [columna]: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      await admin.storage.from(BUCKET).remove([path]);
      throw new Error(updateError.message);
    }

    const urlAnterior = campo === "logo" ? medio.logo_url : medio.qr_url;
    const oldPath = obtenerPathDesdePublicUrl(urlAnterior as string | null);
    if (oldPath) {
      await admin.storage.from(BUCKET).remove([oldPath]);
    }

    const disponible = await esperarObjetoDisponible(publicUrl);
    if (!disponible) {
      console.warn(`[medios-pago] La imagen subida todavía no está disponible en ${publicUrl}`);
    }

    return NextResponse.json({ message: "Imagen actualizada correctamente.", campo, url: publicUrl });
  } catch (error) {
    console.error("Error subiendo imagen de medio de pago:", error);

    const mensaje =
      error instanceof Error && error.message ? error.message : "No se pudo subir la imagen.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const guard = await requirePlatformOwnerApi();
  if (!guard.ok) return guard.response;

  const { id } = await context.params;

  try {
    const admin = createServiceRoleClient();

    const { data: medio, error: medioError } = await admin
      .from("medios_pago_plataforma")
      .select("id, qr_url, logo_url")
      .eq("id", id)
      .maybeSingle();

    if (medioError) throw new Error(medioError.message);

    if (!medio) {
      return NextResponse.json({ error: "Medio de pago no encontrado." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const campo = validarCampo(body.campo);

    if (!campo) {
      return NextResponse.json({ error: "Campo inválido. Usá logo o qr." }, { status: 400 });
    }

    const urlAnterior = campo === "logo" ? medio.logo_url : medio.qr_url;
    const oldPath = obtenerPathDesdePublicUrl(urlAnterior as string | null);
    if (oldPath) {
      await admin.storage.from(BUCKET).remove([oldPath]);
    }

    const columna = columnaPorCampo(campo);
    const { error } = await admin
      .from("medios_pago_plataforma")
      .update({ [columna]: null, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Imagen eliminada correctamente.", campo });
  } catch (error) {
    console.error("Error eliminando imagen de medio de pago:", error);

    const mensaje =
      error instanceof Error && error.message ? error.message : "No se pudo eliminar la imagen.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
