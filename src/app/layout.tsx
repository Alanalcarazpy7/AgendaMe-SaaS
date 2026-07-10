import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgendaMe | Reservas y citas online para negocios",
  description:
    "AgendaMe es un SaaS para recibir reservas online, gestionar citas, clientes, empleados, servicios, recordatorios y planes desde un panel profesional.",
  icons: {
    icon: "/brand/icon-agendame.svg",
    shortcut: "/brand/icon-agendame.svg",
    apple: "/brand/icon-agendame.svg",
  },
};

// Se ejecuta de forma sincrónica antes del primer paint (script bloqueante
// en <head>, sin defer/async) para aplicar el tema guardado en localStorage
// antes de que React hidrate. Evita el "flash" de tema claro al recargar
// con modo oscuro activo. No reemplaza la preferencia real (que sigue
// viviendo en perfiles_usuario.tema, ver DashboardPreferencesApplier): es
// solo una caché local de lectura instantánea para el primer paint.
const TEMA_INIT_SCRIPT = `
(function () {
  try {
    var tema = localStorage.getItem("agendame-tema");
    var prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var oscuro = tema === "oscuro" || (tema !== "claro" && prefiereOscuro);
    document.documentElement.classList.toggle("dark", oscuro);
    var acento = localStorage.getItem("agendame-color-acento");
    if (acento && /^#[0-9A-Fa-f]{6}$/.test(acento)) {
      document.documentElement.style.setProperty("--agendame-accent", acento);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
