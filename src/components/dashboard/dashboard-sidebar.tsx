"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Scissors,
  Settings,
  Users,
  BriefcaseBusiness,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type DashboardSidebarProps = {
  userEmail?: string;
};

const menuItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    label: "Servicios",
    href: "/dashboard/servicios",
    icon: Scissors,
  },
  {
    label: "Empleados",
    href: "/dashboard/empleados",
    icon: BriefcaseBusiness,
  },
  {
    label: "Citas",
    href: "/dashboard/citas",
    icon: CalendarDays,
  },
  {
    label: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
];

export function DashboardSidebar({ userEmail }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r bg-background">
      <div className="border-b p-6">
        <Link href="/dashboard" className="block">
          <p className="text-2xl font-bold tracking-tight">AgendaMe</p>
          <p className="mt-1 text-sm text-muted-foreground">Panel del negocio</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const activo =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                activo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        {userEmail && (
          <p className="mb-3 truncate text-xs text-muted-foreground">
            {userEmail}
          </p>
        )}

        <SignOutButton variant="ghost" className="w-full justify-start" />
      </div>
    </aside>
  );
}