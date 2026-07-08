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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
