import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const BUCKET = "service-images";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

type ServicioImagenRouteProps = {
  params: Promise<{
    servicioId: string;
  }>;
};

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

async function obtenerContexto(servicioId: string) {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return {
      error: "No autenticado.",
      status: 401,
      negocioId: null,
      servicio: null,
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
      servicio: null,
    };
  }

  const { data: servicio, error: servicioError } = await supabase
    .from("servicios")
    .select("id, negocio_id, nombre, imagen_url")
    .eq("id", servicioId)
    .eq("negocio_id", membresia.negocio_id)
    .maybeSingle();

  if (servicioError) {
    throw new Error(servicioError.message);
  }

  if (!servicio) {
    return {
      error: "Servicio no encontrado.",
      status: 404,
      negocioId: membresia.negocio_id as string,
      servicio: null,
    };
  }

  return {
    error: null,
    status: 200,
    negocioId: membresia.negocio_id as string,
    servicio: servicio as {
      id: string;
      negocio_id: string;
      nombre: string;
      imagen_url: string | null;
    },
  };
}

export async function POST(
  request: Request,
  { params }: ServicioImagenRouteProps
) {
  try {
    const { servicioId } = await params;
    const contexto = await obtenerContexto(servicioId);

    if (contexto.error || !contexto.negocioId || !contexto.servicio) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Seleccioná una imagen.",
        },
        {
          status: 400,
        }
      );
    }

    const extension = extensionDesdeMime(file.type);

    if (!extension) {
      return NextResponse.json(
        {
          error: "Formato no permitido. Usá JPG, PNG o WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "La imagen no puede superar 2 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createServiceRoleClient();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${contexto.negocioId}/${contexto.servicio.id}/${filename}`;

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

    const { error: updateError } = await supabase
      .from("servicios")
      .update({
        imagen_url: publicUrl,
      })
      .eq("id", contexto.servicio.id)
      .eq("negocio_id", contexto.negocioId);

    if (updateError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(updateError.message);
    }

    const oldPath = obtenerPathDesdePublicUrl(contexto.servicio.imagen_url);

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    return NextResponse.json({
      message: "Imagen actualizada correctamente.",
      imagenUrl: publicUrl,
    });
  } catch (error) {
    console.error("Error subiendo imagen del servicio:", error);

    return NextResponse.json(
      {
        error: "No se pudo subir la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: ServicioImagenRouteProps
) {
  try {
    const { servicioId } = await params;
    const contexto = await obtenerContexto(servicioId);

    if (contexto.error || !contexto.negocioId || !contexto.servicio) {
      return NextResponse.json(
        { error: contexto.error },
        { status: contexto.status }
      );
    }

    const supabase = createServiceRoleClient();

    const oldPath = obtenerPathDesdePublicUrl(contexto.servicio.imagen_url);

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    const { error } = await supabase
      .from("servicios")
      .update({
        imagen_url: null,
      })
      .eq("id", contexto.servicio.id)
      .eq("negocio_id", contexto.negocioId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Imagen eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando imagen del servicio:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}