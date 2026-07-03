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

const menuItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: Home,
    disponible: true,
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    disponible: true,
  },
  {
    label: "Servicios",
    href: "/dashboard/servicios",
    icon: Scissors,
    disponible: true,
  },
  {
    label: "Empleados",
    href: "/dashboard/empleados",
    icon: BriefcaseBusiness,
    disponible: true,
  },
  {
    label: "Citas",
    href: "/dashboard/citas",
    icon: CalendarDays,
    disponible: true,
  },
  {
    label: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    disponible: true,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const activo =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href) && item.href !== "#";

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
              activo
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="mr-3 h-4 w-4" />
            {item.label}

            {!item.disponible && (
              <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                pronto
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}