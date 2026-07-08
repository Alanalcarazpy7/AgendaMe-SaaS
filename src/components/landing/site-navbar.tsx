"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { WhatsAppIcon } from "@/components/landing/social-icons";

const links = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Funciones", href: "#funciones" },
  { label: "Nichos", href: "#nichos" },
  { label: "Planes", href: "/planes" },
  { label: "FAQ", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
];

const sectionIds = links
  .filter((link) => link.href.startsWith("#"))
  .map((link) => link.href.slice(1));

export function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState<string | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || typeof IntersectionObserver === "undefined") return;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          setActiveHash(visible.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    if (href === "/planes") return pathname === "/planes";
    return pathname === "/" && activeHash === href.slice(1);
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled
          ? "border-border/70 bg-background/85 shadow-md shadow-slate-950/5 backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="AgendaMe"
        >
          <AgendaMeLogo theme="auto" size="lg" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-transform duration-200 ease-[var(--ease-out)] hover:scale-[1.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isActive(link.href) ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className="absolute inset-0 -z-10 scale-90 rounded-lg bg-primary/10 opacity-0 transition-all duration-200 ease-[var(--ease-out)] group-hover:scale-100 group-hover:opacity-100"
                aria-hidden="true"
              />
              {link.label}
              <span
                className={`absolute inset-x-3 -bottom-[1px] h-0.5 origin-center rounded-full bg-primary transition-transform duration-300 ease-[var(--ease-out)] ${
                  isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#contacto"
            className="hidden h-10 items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 text-sm font-semibold text-white shadow-sm shadow-[var(--whatsapp)]/30 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>

          <Link
            href="/auth/login"
            className="hidden h-10 items-center justify-center rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex"
          >
            Iniciar sesion
          </Link>

          <Link
            href="/auth/registro"
            className="hidden h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
          >
            Crear cuenta gratis
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-card transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="ag-reveal ag-reveal-visible absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            style={{ transitionDuration: "200ms" }}
            onClick={() => setOpen(false)}
            aria-label="Cerrar menu"
          />

          <div className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <AgendaMeLogo size="md" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Cerrar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-3.5 text-base font-semibold transition ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-3 border-t p-4">
              <a
                href="#contacto"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] text-sm font-semibold text-white shadow-sm shadow-[var(--whatsapp)]/30 transition hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Hablar por WhatsApp
              </a>
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border bg-card text-sm font-semibold shadow-sm transition hover:bg-accent"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/auth/registro"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:bg-primary/90"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
