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
  { href: "/dashboard/main", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/household", label: "Household", icon: Home },
  { href: "/dashboard/services", label: "Services", icon: Boxes },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/dashboard/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
