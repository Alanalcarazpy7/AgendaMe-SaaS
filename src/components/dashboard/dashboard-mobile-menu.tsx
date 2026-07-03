"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Menu,
  Scissors,
  Settings,
  Users,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

type DashboardMobileMenuProps = {
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

export function DashboardMobileMenu({ userEmail }: DashboardMobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard">
          <p className="text-lg font-bold">AgendaMe</p>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border p-2"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />

          <div className="absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <p className="text-2xl font-bold">AgendaMe</p>
                <p className="text-sm text-muted-foreground">Panel del negocio</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border p-2"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
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
                    onClick={() => setOpen(false)}
                    className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition ${
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

              <SignOutButton variant="outline" className="w-full justify-center" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}