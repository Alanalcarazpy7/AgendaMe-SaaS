import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "AgendaMe - Reservas y citas online para tu negocio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const agendaMeIcon = await readFile(
    join(process.cwd(), "public", "icons", "icon-192.png"),
    "base64",
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: "#08111f",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
          padding: "64px 70px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: "14px",
            background: "#12b8c8",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#f8fafc",
            fontSize: "32px",
            fontWeight: 800,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${agendaMeIcon}`}
            alt=""
            width={48}
            height={48}
            style={{ width: "48px", height: "48px", marginRight: "16px", objectFit: "contain" }}
          />
          AgendaMe
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "70px", maxWidth: "980px" }}>
          <div
            style={{
              display: "flex",
              marginBottom: "24px",
              color: "#8debf2",
              fontSize: "26px",
              fontWeight: 700,
            }}
          >
            SISTEMA DE RESERVAS ONLINE - PARAGUAY
          </div>
          <div style={{ display: "flex", fontSize: "66px", lineHeight: 1.08, fontWeight: 800 }}>
            Agendá barberías, peluquerías, spas y clínicas sin llamadas ni WhatsApp manual
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "30px",
              color: "#cbd5e1",
              fontSize: "28px",
              lineHeight: 1.4,
            }}
          >
            Citas, clientes y empleados en un panel. Gratis hasta 20 citas al mes.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
