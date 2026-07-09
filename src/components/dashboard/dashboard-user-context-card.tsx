import Link from "next/link";
import { Building2, UserCircle2 } from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";

type Props = {
  userName: string;
  userEmail?: string | null;
  userAvatarUrl?: string | null;
  userCargo?: string | null;
  userColor?: string | null;
  negocioNombre: string;
  planClave: string;
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  scopeLabel: string;
};

function rolLabel(rol: DashboardAccessRole) {
  const labels: Record<DashboardAccessRole, string> = {
    admin_global: "Admin global",
    gerente_sucursal: "Gerente",
    recepcionista_sucursal: "Recepción",
    empleado_sucursal: "Personal",
  };

  return labels[rol] ?? rol;
}

function iniciales(nombre?: string, email?: string | null) {
  const base = (nombre || email || "Usuario").trim();

  const partes = base
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

export function DashboardUserContextCard({
  userName,
  userEmail,
  userAvatarUrl,
  userCargo,
  userColor,
  negocioNombre,
  planClave,
  accessRole,
  accessScope,
  scopeLabel,
}: Props) {
  return (
    <section className="mb-5 rounded-[1.75rem] border border-border/80 bg-card/90 px-4 py-3 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName}
              className="h-11 w-11 rounded-2xl border object-cover shadow-sm"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: userColor ?? "var(--primary)" }}
            >
              {iniciales(userName, userEmail)}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Panel privado
            </p>

            <h2 className="truncate text-base font-bold">{userName}</h2>

            <p className="truncate text-xs text-muted-foreground">
              {userCargo ? `${userCargo} · ` : ""}
              {rolLabel(accessRole)} ·{" "}
              {accessScope === "global" ? "Vista global" : scopeLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-2xl border bg-muted/50 px-3 py-1.5 font-medium text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {negocioNombre}
          </span>

          <span className="rounded-2xl border bg-muted/50 px-3 py-1.5 font-medium text-muted-foreground">
            Plan {planClave}
          </span>

          <Link
            href="/dashboard/mi-cuenta"
            className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 font-semibold outline-none transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <UserCircle2 className="h-3.5 w-3.5" />
            Mi cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
