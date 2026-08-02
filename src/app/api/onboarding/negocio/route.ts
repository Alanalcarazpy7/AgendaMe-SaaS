import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buscarRubroInicial,
  type RubroNegocio,
} from "@/lib/negocios/rubros";

const schema = z.object({
  nombreResponsable: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre.")
    .max(100, "El nombre del responsable es demasiado largo."),
  nombre: z
    .string()
    .trim()
    .min(2, "Ingresá el nombre del negocio.")
    .max(120, "El nombre del negocio es demasiado largo."),
  slug: z
    .string()
    .trim()
    .min(3, "El link debe tener al menos 3 caracteres.")
    .max(80, "El link no puede superar los 80 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El link solo puede tener minúsculas, números y guiones intermedios."
    ),
  rubroClave: z
    .string()
    .trim()
    .min(2, "Elegí el rubro que mejor representa a tu negocio."),
  telefono: z.string().trim().max(40, "El teléfono es demasiado largo.").optional(),
  direccion: z.string().trim().max(180, "La dirección es demasiado larga.").optional(),
  descripcion: z.string().trim().max(280, "La descripción no puede superar los 280 caracteres.").optional(),
});

const slugSchema = z
  .string()
  .trim()
  .min(3, "El enlace debe tener al menos 3 caracteres.")
  .max(80, "El enlace no puede superar los 80 caracteres.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "El enlace solo puede tener minúsculas, números y guiones intermedios.",
  );

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "No tenés sesión activa." },
      { status: 401 },
    );
  }

  const parsedSlug = slugSchema.safeParse(
    request.nextUrl.searchParams.get("slug") ?? "",
  );

  if (!parsedSlug.success) {
    return NextResponse.json(
      { error: parsedSlug.error.issues[0]?.message ?? "Enlace inválido." },
      { status: 400 },
    );
  }

  const slug = parsedSlug.data;
  const base = slug.slice(0, 68).replace(/-+$/g, "");
  const candidatos = [
    slug,
    `${base}-agenda`,
    `${base}-reservas`,
    `${base}-py`,
  ];
  const admin = createAdminClient();
  const { data: coincidencias, error } = await admin
    .from("negocios")
    .select("slug")
    .in("slug", candidatos);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo comprobar el enlace." },
      { status: 500 },
    );
  }

  const ocupados = new Set((coincidencias ?? []).map((item) => item.slug));

  return NextResponse.json({
    disponible: !ocupados.has(slug),
    sugerencias: candidatos.slice(1).filter((item) => !ocupados.has(item)),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "No tenés sesión activa." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const {
    nombreResponsable,
    nombre,
    slug,
    rubroClave,
    telefono,
    direccion,
    descripcion,
  } = parsed.data;

  const { data: rubroCatalogo, error: rubroCatalogoError } = await admin
    .from("rubros_negocio")
    .select("id, clave, nombre, descripcion, icono, orden")
    .eq("clave", rubroClave)
    .eq("activo", true)
    .maybeSingle();

  const catalogoTodaviaNoAplicado =
    rubroCatalogoError?.code === "42P01" ||
    rubroCatalogoError?.code === "PGRST205" ||
    rubroCatalogoError?.message.toLowerCase().includes("rubros_negocio");

  if (rubroCatalogoError && !catalogoTodaviaNoAplicado) {
    return NextResponse.json(
      { error: "No se pudo validar el rubro. Intentá nuevamente." },
      { status: 500 },
    );
  }

  const rubroSeleccionado = rubroCatalogo
    ? (rubroCatalogo as RubroNegocio)
    : buscarRubroInicial(rubroClave);

  if (!rubroSeleccionado) {
    return NextResponse.json(
      { error: "El rubro seleccionado no está disponible." },
      { status: 400 },
    );
  }

  const { data: yaTieneNegocio, error: miembroExistenteError } = await admin
    .from("negocio_usuarios")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (miembroExistenteError) {
    return NextResponse.json(
      { error: miembroExistenteError.message || "No se pudo verificar tu negocio actual." },
      { status: 500 }
    );
  }

  if (yaTieneNegocio && yaTieneNegocio.length > 0) {
    return NextResponse.json(
      { error: "Este usuario ya tiene un negocio configurado." },
      { status: 409 }
    );
  }

  const { error: perfilError } = await admin.from("perfiles_usuario").upsert(
    {
      id: user.id,
      usuario_id: user.id,
      nombre_completo: nombreResponsable,
      email: user.email,
      rol_global: "usuario",
      tipo_cuenta: "negocio",
    },
    {
      onConflict: "id",
    }
  );

  if (perfilError) {
    return NextResponse.json(
      { error: perfilError.message || "No se pudo crear el perfil del usuario." },
      { status: 500 }
    );
  }

  const negocioNuevo: {
    nombre: string;
    slug: string;
    rubro: string;
    rubro_id?: string;
    telefono: string | null;
    direccion: string | null;
    descripcion: string | null;
    email: string | undefined;
  } = {
    nombre,
    slug,
    rubro: rubroSeleccionado.nombre,
    telefono: telefono || null,
    direccion: direccion || null,
    descripcion: descripcion || null,
    email: user.email,
  };

  if (rubroCatalogo) {
    negocioNuevo.rubro_id = rubroSeleccionado.id;
  }

  const { data: negocio, error: negocioError } = await admin
    .from("negocios")
    .insert(negocioNuevo)
    .select("id, nombre, slug")
    .single();

  if (negocioError) {
    if (negocioError.code === "23505") {
      return NextResponse.json(
        { error: "Ese link público ya está en uso. Elegí otro." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: negocioError.message },
      { status: 500 }
    );
  }

  const { error: relacionError } = await admin.from("negocio_usuarios").insert({
    negocio_id: negocio.id,
    usuario_id: user.id,
    rol: "admin",
    activo: true,
  });

  if (relacionError) {
    await admin.from("negocios").delete().eq("id", negocio.id);

    return NextResponse.json(
      { error: relacionError.message || "No se pudo asociar el usuario al negocio." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    negocio,
  });
}
