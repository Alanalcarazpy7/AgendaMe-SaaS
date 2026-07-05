import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const BUCKET = "business-branding";
const MAX_FILE_SIZE = 3 * 1024 * 1024;

type TipoBranding = "logo" | "banner";

function extensionDesdeMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

function validarTipo(valor: unknown): TipoBranding | null {
  if (valor === "logo" || valor === "banner") return valor;
  return null;
}

function columnaPorTipo(tipo: TipoBranding) {
  return tipo === "logo" ? "logo_url" : "banner_url";
}

function obtenerPathDesdePublicUrl(url: string | null) {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

async function obtenerNegocioDelUsuario() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return {
      error: "No autenticado.",
      status: 401,
      negocioId: null,
      negocio: null,
    };
  }

  const supabase = createServiceRoleClient();

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError) {
    throw new Error(membresiaError.message);
  }

  if (!membresia) {
    return {
      error: "No tenés un negocio activo.",
      status: 404,
      negocioId: null,
      negocio: null,
    };
  }

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre, logo_url, banner_url, color_primario, color_acento")
    .eq("id", membresia.negocio_id)
    .maybeSingle();

  if (negocioError) {
    throw new Error(negocioError.message);
  }

  if (!negocio) {
    return {
      error: "Negocio no encontrado.",
      status: 404,
      negocioId: membresia.negocio_id as string,
      negocio: null,
    };
  }

  return {
    error: null,
    status: 200,
    negocioId: membresia.negocio_id as string,
    negocio: negocio as {
      id: string;
      nombre: string;
      logo_url: string | null;
      banner_url: string | null;
      color_primario: string | null;
      color_acento: string | null;
    },
  };
}

export async function GET() {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;


  try {
    const contexto = await obtenerNegocioDelUsuario();

    if (contexto.error || !contexto.negocio) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status }
      );
    }

    return NextResponse.json({
      negocio: contexto.negocio,
    });
  } catch (error) {
    console.error("Error obteniendo branding:", error);

    return NextResponse.json(
      { error: "No se pudo cargar la personalización." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;


  try {
    const contexto = await obtenerNegocioDelUsuario();

    if (contexto.error || !contexto.negocioId || !contexto.negocio) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status }
      );
    }

    const formData = await request.formData();
    const tipo = validarTipo(formData.get("tipo"));
    const file = formData.get("file");

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo inválido. Usá logo o banner." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Seleccioná una imagen." },
        { status: 400 }
      );
    }

    const extension = extensionDesdeMime(file.type);

    if (!extension) {
      return NextResponse.json(
        { error: "Formato no permitido. Usá JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen no puede superar 3 MB." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${contexto.negocioId}/${tipo}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const columna = columnaPorTipo(tipo);
    const urlAnterior =
      tipo === "logo" ? contexto.negocio.logo_url : contexto.negocio.banner_url;

    const { error: updateError } = await supabase
      .from("negocios")
      .update({
        [columna]: publicUrl,
      })
      .eq("id", contexto.negocioId);

    if (updateError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(updateError.message);
    }

    const oldPath = obtenerPathDesdePublicUrl(urlAnterior);

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    return NextResponse.json({
      message: "Imagen actualizada correctamente.",
      tipo,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error actualizando branding:", error);

    return NextResponse.json(
      { error: "No se pudo subir la imagen." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;


  try {
    const contexto = await obtenerNegocioDelUsuario();

    if (contexto.error || !contexto.negocioId || !contexto.negocio) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status }
      );
    }

    const body = await request.json();
    const tipo = validarTipo(body.tipo);

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo inválido. Usá logo o banner." },
        { status: 400 }
      );
    }

    const columna = columnaPorTipo(tipo);
    const urlAnterior =
      tipo === "logo" ? contexto.negocio.logo_url : contexto.negocio.banner_url;

    const supabase = createServiceRoleClient();

    const oldPath = obtenerPathDesdePublicUrl(urlAnterior);

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    const { error } = await supabase
      .from("negocios")
      .update({
        [columna]: null,
      })
      .eq("id", contexto.negocioId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Imagen eliminada correctamente.",
      tipo,
    });
  } catch (error) {
    console.error("Error eliminando branding:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar la imagen." },
      { status: 500 }
    );
  }
}