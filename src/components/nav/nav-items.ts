import {
  LayoutDashboard,
  Home,
  Boxes,
  FileText,
  Sparkles,
  MessageSquare,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary navigation (D6 §4/§7). */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/household", label: "Household", icon: Home },
  { href: "/services", label: "Services", icon: Boxes },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];
