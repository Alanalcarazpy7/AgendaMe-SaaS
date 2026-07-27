import Image from "next/image";

import { AgendaMeLogo } from "@/components/brand/agendame-logo";

type AuthProductPanelProps = {
  mode: "login" | "registro";
};

const PANEL_IMAGE = {
  login: {
    src: "/auth/login-agendame-3d.png",
    alt: "Ilustración de una agenda digital protegida",
  },
  registro: {
    src: "/auth/registro-agendame-3d.png",
    alt: "Ilustración de un negocio activando su agenda digital",
  },
} as const;

export function AuthProductPanel({ mode }: AuthProductPanelProps) {
  const image = PANEL_IMAGE[mode];

  return (
    <aside className="relative hidden overflow-hidden border-l border-white/15 bg-[#0b1120] lg:block">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(max-width: 1023px) 0px, 52vw"
        className="object-cover object-center"
      />

      <div className="absolute left-7 top-7 rounded-md border border-white/25 bg-[#0b1120]/76 px-5 py-4 shadow-xl shadow-black/25 backdrop-blur-md 2xl:left-9 2xl:top-9">
        <AgendaMeLogo size="md" theme="dark" />
      </div>
    </aside>
  );
}
