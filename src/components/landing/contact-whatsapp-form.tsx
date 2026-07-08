"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";

type ContactWhatsappFormProps = {
  planes: string[];
};

export function ContactWhatsappForm({ planes }: ContactWhatsappFormProps) {
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [rubro, setRubro] = useState("");
  const [telefono, setTelefono] = useState("");
  const [plan, setPlan] = useState(planes[0] ?? "Gratis");
  const [mensaje, setMensaje] = useState("Quiero probar AgendaMe y entender cual plan conviene para mi negocio.");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const texto = [
      "Hola, quiero consultar por AgendaMe.",
      nombre ? `Nombre: ${nombre}` : "",
      negocio ? `Negocio: ${negocio}` : "",
      rubro ? `Rubro: ${rubro}` : "",
      telefono ? `Telefono: ${telefono}` : "",
      plan ? `Plan de interes: ${plan}` : "",
      mensaje ? `Mensaje: ${mensaje}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsappUrl(texto), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border bg-card p-5 shadow-xl shadow-slate-950/10 ring-1 ring-foreground/5 dark:shadow-black/30">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>Nombre</span>
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Nombre del negocio</span>
          <input value={negocio} onChange={(event) => setNegocio(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Rubro</span>
          <input value={rubro} onChange={(event) => setRubro(event.target.value)} placeholder="Barberia, veterinaria, estetica..." className="h-11 w-full rounded-xl border bg-background px-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Telefono</span>
          <input value={telefono} onChange={(event) => setTelefono(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>

        <label className="space-y-2 text-sm font-medium sm:col-span-2">
          <span>Plan de interes</span>
          <select value={plan} onChange={(event) => setPlan(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30">
            {planes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium sm:col-span-2">
          <span>Mensaje</span>
          <textarea value={mensaje} onChange={(event) => setMensaje(event.target.value)} rows={4} className="w-full rounded-xl border bg-background px-3 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </label>
      </div>

      <button type="submit" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:bg-primary/90 sm:w-auto">
        Enviar por WhatsApp
        <Send className="ml-2 h-4 w-4" />
      </button>
    </form>
  );
}
