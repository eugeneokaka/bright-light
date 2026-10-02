"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/crm", label: "Dashboard", exact: true },
  { href: "/crm/leads", label: "Leads" },
  { href: "/crm/customers", label: "Customers" },
  { href: "/crm/properties", label: "Properties" },
  { href: "/crm/towers", label: "Towers" },
  { href: "/crm/transactions", label: "Transactions" },
];

export function CrmNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
