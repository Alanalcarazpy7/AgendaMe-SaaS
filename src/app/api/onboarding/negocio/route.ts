import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  nombreResponsable: z.string().min(2, "Ingresá tu nombre."),
  nombre: z.string().min(2, "Ingresá el nombre del negocio."),
  slug: z
    .string()
    .min(3, "El link debe tener al menos 3 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El link solo puede tener minúsculas, números y guiones intermedios."
    ),
  rubro: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  descripcion: z.string().optional(),
});

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

  const { nombreResponsable, nombre, slug, rubro, telefono, direccion, descripcion } =
    parsed.data;

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

  const { data: negocio, error: negocioError } = await admin
    .from("negocios")
    .insert({
      nombre,
      slug,
      rubro: rubro || null,
      telefono: telefono || null,
      direccion: direccion || null,
      descripcion: descripcion || null,
      email: user.email,
    })
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
