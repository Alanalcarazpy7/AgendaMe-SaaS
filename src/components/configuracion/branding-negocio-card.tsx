"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

type BrandingNegocio = {
  nombre: string;
  logo_url: string | null;
  banner_url: string | null;
  color_primario: string | null;
  color_acento: string | null;
};

type TipoBranding = "logo" | "banner";

export function BrandingNegocioCard() {
  const [negocio, setNegocio] = useState<BrandingNegocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<TipoBranding | null>(null);
  const [deleting, setDeleting] = useState<TipoBranding | null>(null);
  const [error, setError] = useState("");

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  async function cargar() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard/negocio/branding");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo cargar la personalización.");
        return;
      }

      setNegocio(data.negocio);
    } catch {
      setError("No se pudo cargar la personalización.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function subir(tipo: TipoBranding, file: File | null) {
    if (!file) return;

    try {
      setUploading(tipo);
      setError("");

      const formData = new FormData();
      formData.append("tipo", tipo);
      formData.append("file", file);

      const response = await fetch("/api/dashboard/negocio/branding", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo subir la imagen.");
        return;
      }

      setNegocio((actual) => {
        if (!actual) return actual;

        return {
          ...actual,
          [tipo === "logo" ? "logo_url" : "banner_url"]: data.url,
        };
      });
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setUploading(null);

      if (tipo === "logo" && logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      if (tipo === "banner" && bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
    }
  }

  async function eliminar(tipo: TipoBranding) {
    try {
      setDeleting(tipo);
      setError("");

      const response = await fetch("/api/dashboard/negocio/branding", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo eliminar la imagen.");
        return;
      }

      setNegocio((actual) => {
        if (!actual) return actual;

        return {
          ...actual,
          [tipo === "logo" ? "logo_url" : "banner_url"]: null,
        };
      });
    } catch {
      setError("No se pudo eliminar la imagen.");
    } finally {
      setDeleting(null);
    }
  }

  const colorMarca =
    negocio?.color_primario ?? negocio?.color_acento ?? "#111827";

  return (
    <section className="rounded-3xl border bg-background p-6 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Logo y banner del negocio</h2>
        </div>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Personalizá cómo se ve tu negocio en el link público de reservas y en
          el panel interno. Recomendado: logo cuadrado y banner horizontal.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando personalización...
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
          <article className="rounded-3xl border bg-muted/20 p-5">
            <p className="font-semibold">Logo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Se muestra como identidad principal del negocio.
            </p>

            <div className="mt-4 flex items-center gap-4">
              {negocio?.logo_url ? (
                <img
                  src={negocio.logo_url}
                  alt="Logo del negocio"
                  className="h-24 w-24 rounded-3xl border object-cover"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl text-3xl font-bold text-white"
                  style={{ backgroundColor: colorMarca }}
                >
                  {negocio?.nombre?.slice(0, 1).toUpperCase() ?? "N"}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    subir("logo", event.target.files?.[0] ?? null)
                  }
                />

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading === "logo" || deleting === "logo"}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploading === "logo" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {negocio?.logo_url ? "Cambiar" : "Subir"}
                </Button>

                {negocio?.logo_url && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={uploading === "logo" || deleting === "logo"}
                    onClick={() => eliminar("logo")}
                  >
                    {deleting === "logo" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-3xl border bg-muted/20 p-5">
            <p className="font-semibold">Banner</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Se muestra arriba del formulario público de reservas.
            </p>

            <div className="relative mt-4 h-40 overflow-hidden rounded-3xl border bg-black">
              {negocio?.banner_url ? (
                <>
                  <img
                    src={negocio.banner_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-100 blur-sm"
                  />
                  <div className="absolute inset-0 bg-black/25" />
                  <img
                    src={negocio.banner_url}
                    alt="Banner del negocio"
                    className="relative z-10 h-full w-full object-contain"
                  />
                </>
              ) : (
                <div
                  className="flex h-40 w-full items-center justify-center text-sm font-medium text-white"
                  style={{ backgroundColor: colorMarca }}
                >
                  Sin banner
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) =>
                  subir("banner", event.target.files?.[0] ?? null)
                }
              />

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading === "banner" || deleting === "banner"}
                onClick={() => bannerInputRef.current?.click()}
              >
                {uploading === "banner" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {negocio?.banner_url ? "Cambiar banner" : "Subir banner"}
              </Button>

              {negocio?.banner_url && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={uploading === "banner" || deleting === "banner"}
                  onClick={() => eliminar("banner")}
                >
                  {deleting === "banner" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Quitar banner
                </Button>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}