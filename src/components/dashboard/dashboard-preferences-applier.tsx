"use client";

import { useEffect } from "react";

type Props = {
  tema?: string | null;
  colorAcento?: string | null;
};

export function DashboardPreferencesApplier({ tema, colorAcento }: Props) {
  useEffect(() => {
    const root = document.documentElement;

    function aplicarTema() {
      if (tema === "oscuro") {
        root.classList.add("dark");
        return;
      }

      if (tema === "claro") {
        root.classList.remove("dark");
        return;
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    aplicarTema();

    if (colorAcento && /^#[0-9A-Fa-f]{6}$/.test(colorAcento)) {
      root.style.setProperty("--agendame-accent", colorAcento);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = () => {
      if (!tema || tema === "sistema") aplicarTema();
    };

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [tema, colorAcento]);

  return null;
}