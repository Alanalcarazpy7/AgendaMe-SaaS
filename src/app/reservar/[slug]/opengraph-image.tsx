import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { obtenerNegocioPublico } from "@/lib/reservas/negocio-publico";

export const alt = "Reserva online con AgendaMe";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const revalidate = 300;

type ImageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function colorSeguro(color: string | null) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#12b8c8";
}

function colorDeTexto(color: string) {
  const rojo = Number.parseInt(color.slice(1, 3), 16);
  const verde = Number.parseInt(color.slice(3, 5), 16);
  const azul = Number.parseInt(color.slice(5, 7), 16);
  const luminosidad = (rojo * 299 + verde * 587 + azul * 114) / 1000;

  return luminosidad > 145 ? "#041018" : "#ffffff";
}

async function cargarImagenSegura(url: string | null) {
  if (!url) return null;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    const imageUrl = new URL(url);
    const storageUrl = new URL(supabaseUrl);
    const brandingPath = "/storage/v1/object/public/business-branding/";

    if (
      imageUrl.origin !== storageUrl.origin ||
      !imageUrl.pathname.startsWith(brandingPath)
    ) {
      return null;
    }

    const response = await fetch(imageUrl, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) return null;

    const mime = response.headers.get("content-type") ?? "";
    if (!mime.startsWith("image/")) return null;

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 3 * 1024 * 1024) return null;

    return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage({ params }: ImageProps) {
  const { slug } = await params;
  const negocio = await obtenerNegocioPublico(slug);
  const agendaMeIcon = await readFile(
    join(process.cwd(), "public", "icons", "icon-192.png"),
    "base64",
  );

  const nombre = negocio?.nombre?.trim() || "AgendaMe";
  const descripcion =
    negocio?.descripcion?.trim() ||
    "Elegí el servicio y el horario que mejor te quede.";
  const colorMarca = colorSeguro(
    negocio?.color_primario ?? negocio?.color_acento ?? null,
  );
  const textoSobreMarca = colorDeTexto(colorMarca);
  const logoNegocio = await cargarImagenSegura(negocio?.logo_url ?? null);
  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.slice(0, 1).toUpperCase())
    .join("");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#08111f",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: "14px",
            background: colorMarca,
          }}
        />

        <div
          style={{
            width: "68%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "62px 34px 52px 68px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#f8fafc",
              fontSize: "30px",
              fontWeight: 800,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${agendaMeIcon}`}
              alt=""
              width={44}
              height={44}
              style={{
                width: "44px",
                height: "44px",
                marginRight: "14px",
                objectFit: "contain",
              }}
            />
            AgendaMe
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "22px",
                color: "#8debf2",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "0",
              }}
            >
              RESERVA ONLINE
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: "700px",
                fontSize: nombre.length > 28 ? "58px" : "70px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "0",
              }}
            >
              {nombre.slice(0, 52)}
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: "660px",
                marginTop: "22px",
                color: "#cbd5e1",
                fontSize: "26px",
                lineHeight: 1.35,
              }}
            >
              {descripcion.slice(0, 115)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#f8fafc",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            Elegí servicio, profesional y horario
          </div>
        </div>

        <div
          style={{
            width: "32%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 58px 48px 18px",
          }}
        >
          <div
            style={{
              width: "320px",
              height: "410px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #26354a",
              borderRadius: "28px",
              background: "#111d2e",
              boxShadow: "0 24px 70px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "210px",
                height: "210px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: `8px solid ${colorMarca}`,
                borderRadius: "24px",
                background: "#f8fafc",
                color: "#08111f",
                fontSize: "72px",
                fontWeight: 800,
              }}
            >
              {logoNegocio ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoNegocio}
                  alt={`Logo de ${nombre}`}
                  width={210}
                  height={210}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                iniciales || "A"
              )}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "30px",
                padding: "12px 22px",
                borderRadius: "12px",
                background: colorMarca,
                color: textoSobreMarca,
                fontSize: "22px",
                fontWeight: 800,
              }}
            >
              Reservá tu turno
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
