import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  Layers,
  Mail,
  RefreshCcw,
  ScrollText,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Vista general", icon: LayoutDashboard },
  { href: "/admin/negocios", label: "Negocios", icon: Building2 },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard },
  { href: "/admin/renovaciones", label: "Renovaciones", icon: RefreshCcw },
  { href: "/admin/pagos", label: "Pagos", icon: Wallet },
  { href: "/admin/planes", label: "Planes", icon: Layers },
  { href: "/admin/analitica", label: "Analítica", icon: BarChart3 },
  { href: "/admin/invitaciones", label: "Invitaciones", icon: Mail },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];
