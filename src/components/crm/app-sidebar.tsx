"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import {
  Building,
  Building2,
  Contact,
  Handshake,
  LayoutDashboard,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const links: NavItem[] = [
  { href: "/crm", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/crm/leads", label: "Leads", icon: Users },
  { href: "/crm/customers", label: "Customers", icon: Contact },
  { href: "/crm/properties", label: "Properties", icon: Building2 },
  { href: "/crm/towers", label: "Towers", icon: Building },
  { href: "/crm/transactions", label: "Transactions", icon: Handshake },
];

const adminLinks: NavItem[] = [
  { href: "/crm/users", label: "Users", icon: ShieldCheck },
];

function Logo() {
  return (
    <Link href="/crm" className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-6 w-6 text-brand"
        fill="currentColor"
      >
        <rect x="2.5" y="13" width="4.2" height="8" rx="1.2" />
        <rect x="9.5" y="8" width="4.2" height="13" rx="1.2" />
        <rect x="16.5" y="3" width="4.2" height="18" rx="1.2" />
      </svg>
      <span className="text-lg font-bold tracking-[0.2em] text-foreground">
        CRM
      </span>
    </Link>
  );
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function Mountains() {
  return (
    <svg
      viewBox="0 0 240 120"
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-brand/15"
      preserveAspectRatio="none"
    >
      <path
        d="M0 120 L48 62 L84 96 L120 44 L156 92 L196 54 L240 100 L240 120 Z"
        fill="currentColor"
      />
      <path
        d="M0 120 L48 62 L84 96 L120 44 L156 92 L196 54 L240 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-brand/40"
      />
    </svg>
  );
}

export function AppSidebar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const items = isSuperAdmin ? [...links, ...adminLinks] : links;

  return (
    <aside className="print-hide sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 lg:flex">
      <div className="px-6 py-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-brand/15 font-medium text-brand"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px]",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative overflow-hidden px-6 pb-6 pt-10">
        <Mountains />
        <p className="relative text-sm font-medium leading-relaxed text-foreground">
          Better relationships.
          <br />
          Bigger opportunities.
        </p>
        <span className="relative mt-3 block h-0.5 w-8 rounded-full bg-brand" />
      </div>
    </aside>
  );
}

export function MobileNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const items = isSuperAdmin ? [...links, ...adminLinks] : links;

  return (
    <nav className="print-hide flex gap-1 overflow-x-auto border-b border-border/60 px-4 py-2 lg:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-brand/15 font-medium text-brand"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
