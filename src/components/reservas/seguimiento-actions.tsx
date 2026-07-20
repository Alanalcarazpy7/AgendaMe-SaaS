"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type SeguimientoActionsProps = {
  token: string | null;
  telefono?: string | null;
  label?: string;
};

function normalizarTelefonoWhatsApp(telefono?: string | null) {
  if (!telefono) return "";

  const digits = telefono.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("595")) return digits;

  if (digits.startsWith("0")) {
    return `595${digits.slice(1)}`;
  }

  return digits;
}

export function SeguimientoActions({
  token,
  telefono,
  label = "Copiar link",
}: SeguimientoActionsProps) {
  const [copied, setCopied] = useState(false);

  const seguimientoUrl = useMemo(() => {
    if (!token) return "";

    if (typeof window === "undefined") {
      return `/reserva/estado/${token}`;
    }

    return `${window.location.origin}/reserva/estado/${token}`;
  }, [token]);

  if (!token) return null;

  const telefonoWhatsApp = normalizarTelefonoWhatsApp(telefono);

  const mensaje = encodeURIComponent(
    `Hola, te paso el link para consultar el estado de tu reserva: ${seguimientoUrl}`
  );

  const whatsappUrl = telefonoWhatsApp
    ? `https://wa.me/${telefonoWhatsApp}?text=${mensaje}`
    : `https://wa.me/?text=${mensaje}`;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(seguimientoUrl);
      setCopied(true);
      toast.success("Link copiado");

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copiarLink}
        className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
      >
        {copied ? (
          <Check className="mr-2 h-4 w-4 text-green-600" />
        ) : (
          <Copy className="mr-2 h-4 w-4" />
        )}
        {copied ? "Copiado" : label}
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center rounded-md bg-green-600 px-3 text-sm font-medium text-white shadow-xs transition hover:bg-green-700"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Enviar WhatsApp
      </a>
    </div>
  );
}
