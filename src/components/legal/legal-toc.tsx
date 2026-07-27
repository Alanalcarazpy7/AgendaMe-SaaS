"use client";

import { useEffect, useState } from "react";

type TocItem = { id: string; titulo: string };

export function LegalToc({ items }: { items: TocItem[] }) {
  const [activo, setActivo] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const secciones = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (secciones.length === 0) return;

    const umbral = 140;
    let frame = 0;

    function calcular() {
      let actual = secciones[0].id;

      for (const seccion of secciones) {
        if (seccion.getBoundingClientRect().top - umbral <= 0) {
          actual = seccion.id;
        } else {
          break;
        }
      }

      setActivo(actual);
    }

    function onScroll() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(calcular);
    }

    calcular();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  return (
    <nav aria-label="Secciones" className="hidden lg:block">
      <div className="sticky top-28">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          En esta página
        </p>
        <ul className="mt-4 space-y-0.5 border-l border-border/70">
          {items.map((item, index) => {
            const esActivo = activo === item.id;

            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block truncate border-l-2 py-1.5 pl-4 text-sm transition-[color,border-color] duration-150 ${
                    esActivo
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {index + 1}. {item.titulo}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
