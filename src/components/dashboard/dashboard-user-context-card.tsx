import Link from "next/link";
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
    <section className="mb-5 rounded-3xl border bg-card px-4 py-3 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName}
              className="h-11 w-11 rounded-full border object-cover shadow-sm"
            />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: userColor ?? "var(--primary)" }}
            >
              {iniciales(userName, userEmail)}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">
              {userName}
            </h2>

            <p className="truncate text-xs text-muted-foreground">
              {userCargo ? `${userCargo} · ` : ""}
              {rolLabel(accessRole)} ·{" "}
              {accessScope === "global" ? "Vista global" : scopeLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border bg-muted/50 px-3 py-1 font-medium text-muted-foreground">
            {negocioNombre}
          </span>

          <span className="rounded-full border bg-muted/50 px-3 py-1 font-medium text-muted-foreground">
            Plan {planClave}
          </span>

          <Link
            href="/dashboard/mi-cuenta"
            className="rounded-full border px-3 py-1 font-semibold outline-none transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Mi cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
