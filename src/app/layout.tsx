import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { MonitoringProviders } from "@/components/monitoring/monitoring-providers";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = "AgendaMe | Sistema de reservas y citas online para Paraguay";
const DESCRIPCION =
  "Agenda online para barberías, peluquerías, spas, clínicas y estéticas en Paraguay. Recibí reservas, gestioná citas, clientes, empleados y recordatorios desde un panel profesional. Gratis hasta 20 citas al mes.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: TITULO,
    template: "%s | AgendaMe",
  },
  description: DESCRIPCION,
  keywords: [
    "sistema de reservas online",
    "agenda online Paraguay",
    "software para barbería",
    "software para peluquería",
    "sistema de citas para clínicas",
    "agenda para spa y estética",
    "reservas online negocios Paraguay",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PY",
    siteName: "AgendaMe",
    url: "/",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
  },
  icons: {
    icon: "/brand/icon-agendame.svg",
    shortcut: "/brand/icon-agendame.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgendaMe",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
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

function ThemeInitScript() {
  return (
    <script
      id="agendame-theme-init"
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: TEMA_INIT_SCRIPT }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
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
        <ThemeInitScript />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        {children}
        <Toaster richColors closeButton position="top-right" />
        <MonitoringProviders />
      </body>
    </html>
  );
}
