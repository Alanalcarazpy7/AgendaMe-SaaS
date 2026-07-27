"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { getVisibleNavItems, type NavKey } from "@/components/dashboard/dashboard-sidebar";

const PRIORIDAD: NavKey[] = ["inicio", "citas", "clientes", "reservas", "servicios", "empleados"];

export function getBottomNavItems(
  rol: DashboardAccessRole,
  scope: DashboardAccessScope,
  planClave: string
) {
  const visibles = getVisibleNavItems(rol, scope, planClave);

  return PRIORIDAD.map((key) => visibles.find((item) => item.key === key))
    .filter((item): item is (typeof visibles)[number] => Boolean(item))
    .slice(0, 3);
}

type Props = {
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  planClave: string;
  onOpenMenu: () => void;
};

export function DashboardMobileBottomNav({
  accessRole,
  accessScope,
  planClave,
  onOpenMenu,
}: Props) {
  const pathname = usePathname();
  const principales = getBottomNavItems(accessRole, accessScope, planClave);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-[1.75rem] border border-border/70 bg-background/95 p-1.5 shadow-[0_18px_45px_rgb(15_23_42/0.18)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/90 dark:shadow-black/45 dark:ring-white/5">
        {principales.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour-id={`bottom-${item.key}`}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2.5 text-[10.5px] font-bold transition-all duration-200 ease-[var(--ease-out)] ${
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          data-tour-id="bottom-mas"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2.5 text-[10.5px] font-bold text-muted-foreground transition-all duration-200 ease-[var(--ease-out)] hover:bg-accent hover:text-foreground"
        >
          <LayoutGrid className="h-5 w-5" />
          Más
        </button>
      </div>
    </nav>
  );
}
