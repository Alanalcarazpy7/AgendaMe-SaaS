import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function extensionPorMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;
    const formData = await request.formData();

    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ninguna imagen." },
        { status: 400 }
      );
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Usá JPG, PNG, WEBP o GIF." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar 5 MB." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient() as any;

    const ext = extensionPorMime(file.type);
    const path = `${access.user.id}/avatar-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = publicData.publicUrl;

    await supabase
      .from("perfiles_usuario")
      .upsert(
        {
          usuario_id: access.user.id,
          nombre: access.user.nombre,
          avatar_url: avatarUrl,
          tema: access.user.tema ?? "sistema",
          color_acento: access.user.color_acento ?? null,
          recibir_notificaciones: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "usuario_id",
        }
      );

    await supabase
      .from("sucursal_usuarios")
      .update({
        avatar_url: avatarUrl,
      })
      .eq("usuario_id", access.user.id);

    await supabase.auth.admin.updateUserById(access.user.id, {
      user_metadata: {
        nombre: access.user.nombre,
        name: access.user.nombre,
        avatar_url: avatarUrl,
      },
    });

    return NextResponse.json({
      message: "Avatar actualizado correctamente.",
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error("Error subiendo avatar:", error);

    return NextResponse.json(
      { error: "No se pudo subir el avatar." },
      { status: 500 }
    );
  }
}