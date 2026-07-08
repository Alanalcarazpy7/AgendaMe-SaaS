import Link from "next/link";
import { Globe } from "lucide-react";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";
import { SectionWave } from "@/components/landing/section-wave";
import { getWhatsappNumber } from "@/lib/contact/whatsapp";

export function SiteFooter() {
  const whatsappNumero = getWhatsappNumber();
  const whatsappVisible = whatsappNumero.replace(/^595/, "0").replace(/(\d{4})(\d{6})/, "$1 $2");

  return (
    <>
      <div className="text-[#0B1120]">
        <SectionWave />
      </div>

      <footer className="relative overflow-hidden bg-[#0B1120] px-4 pt-16 pb-10 text-slate-300 sm:px-6">
        <div className="ag-bg-blobs-soft absolute inset-0 -z-10 opacity-40" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="ag-bg-dots pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <AgendaMeLogo theme="dark" size="lg" />
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                Reservas, citas y clientes organizados en un solo lugar para negocios de Paraguay.
              </p>
            </div>

            <div className="md:border-l md:border-white/10 md:pl-8">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Producto</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="/#como-funciona" className="w-fit transition hover:translate-x-0.5 hover:text-white">Como funciona</Link>
                <Link href="/#funciones" className="w-fit transition hover:translate-x-0.5 hover:text-white">Funciones</Link>
                <Link href="/#nichos" className="w-fit transition hover:translate-x-0.5 hover:text-white">Nichos</Link>
                <Link href="/planes" className="w-fit transition hover:translate-x-0.5 hover:text-white">Planes</Link>
                <Link href="/#faq" className="w-fit transition hover:translate-x-0.5 hover:text-white">FAQ</Link>
              </div>
            </div>

            <div className="md:border-l md:border-white/10 md:pl-8">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Cuenta</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="/#contacto" className="w-fit transition hover:translate-x-0.5 hover:text-white">Contacto</Link>
                <Link href="/auth/login" className="w-fit transition hover:translate-x-0.5 hover:text-white">Iniciar sesion</Link>
                <Link href="/auth/registro" className="w-fit transition hover:translate-x-0.5 hover:text-white">Crear cuenta</Link>
              </div>
            </div>

            <div className="md:border-l md:border-white/10 md:pl-8">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Redes y contacto</p>
              <a
                href={`https://wa.me/${whatsappNumero}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                {whatsappVisible}
              </a>

              <div className="mt-4 flex gap-3">
                <a
                  href="https://www.instagram.com/alandev_py/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:scale-110 hover:border-cyan-400/30 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61590114310700&locale=es_LA"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:scale-110 hover:border-cyan-400/30 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-sm text-slate-400 sm:flex-row">
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              AgendaMe · Paraguay
            </p>
            <p>
              © 2026 AgendaMe. Desarrollado por{" "}
              <a
                href="https://solvatech.com.py/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-white transition hover:text-primary"
              >
                SolvaTech
                <Globe className="h-3.5 w-3.5" />
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
