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

      <footer className="relative overflow-hidden bg-[#0B1120] px-4 py-14 text-slate-300 sm:px-6">
        <div className="ag-bg-blobs-soft absolute inset-0 -z-10 opacity-40" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <AgendaMeLogo theme="dark" size="lg" />
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                Reservas, citas y clientes organizados en un solo lugar para negocios de Paraguay.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Producto</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="/#como-funciona" className="transition hover:text-white">Como funciona</Link>
                <Link href="/#funciones" className="transition hover:text-white">Funciones</Link>
                <Link href="/#nichos" className="transition hover:text-white">Nichos</Link>
                <Link href="/planes" className="transition hover:text-white">Planes</Link>
                <Link href="/#faq" className="transition hover:text-white">FAQ</Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Cuenta</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="/#contacto" className="transition hover:text-white">Contacto</Link>
                <Link href="/auth/login" className="transition hover:text-white">Iniciar sesion</Link>
                <Link href="/auth/registro" className="transition hover:text-white">Crear cuenta</Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Redes y contacto</p>
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
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61590114310700&locale=es_LA"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row">
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
