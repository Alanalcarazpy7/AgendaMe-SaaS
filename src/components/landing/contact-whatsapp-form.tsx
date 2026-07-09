"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";

type ContactWhatsappFormProps = {
  planes: string[];
};

const inputClass =
  "h-12 w-full rounded-xl border bg-background px-3.5 text-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15";

export function ContactWhatsappForm({ planes }: ContactWhatsappFormProps) {
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [rubro, setRubro] = useState("");
  const [telefono, setTelefono] = useState("");
  const [plan, setPlan] = useState(planes[0] ?? "Gratis");
  const [mensaje, setMensaje] = useState("Quiero probar AgendaMe y entender cuál plan conviene para mi negocio.");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const texto = [
      "Hola, quiero consultar por AgendaMe.",
      nombre ? `Nombre: ${nombre}` : "",
      negocio ? `Negocio: ${negocio}` : "",
      rubro ? `Rubro: ${rubro}` : "",
      telefono ? `Teléfono: ${telefono}` : "",
      plan ? `Plan de interés: ${plan}` : "",
      mensaje ? `Mensaje: ${mensaje}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsappUrl(texto), "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[2rem] border bg-card p-6 shadow-xl shadow-slate-950/10 ring-1 ring-foreground/5 dark:shadow-black/30 sm:p-7"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>Nombre</span>
          <input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej: Ana González"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Nombre del negocio</span>
          <input
            value={negocio}
            onChange={(event) => setNegocio(event.target.value)}
            placeholder="Ej: Barbería San Miguel"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Rubro</span>
          <input
            value={rubro}
            onChange={(event) => setRubro(event.target.value)}
            placeholder="Barbería, veterinaria, estética..."
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Teléfono</span>
          <input
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            placeholder="Ej: 0994 295092"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 text-sm font-medium sm:col-span-2">
          <span>Plan de interés</span>
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            className={inputClass}
          >
            {planes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium sm:col-span-2">
          <span>Mensaje</span>
          <textarea
            value={mensaje}
            onChange={(event) => setMensaje(event.target.value)}
            rows={4}
            className="w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-ring focus:ring-4 focus:ring-ring/15"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 text-sm font-bold text-white shadow-lg shadow-[var(--whatsapp)]/30 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)] sm:w-auto"
      >
        Enviar por WhatsApp
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
