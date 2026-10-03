"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Topbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string | null | undefined;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="print-hide sticky top-0 z-40 flex items-center justify-end gap-3 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-foreground/5"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
              {initials(name)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-foreground">
                {name}
              </span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-1.5 py-1.5">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            {role ? (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                {role.replace(/_/g, " ")}
              </p>
            ) : null}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isSigningOut}
            onSelect={(event) => {
              event.preventDefault();
              void handleSignOut();
            }}
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
