"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AddNewItem = { href: string; label: string };

export function AddNewMenu({ items }: { items: AddNewItem[] }) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4" />
            Add new
          </span>
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-(--radix-dropdown-menu-trigger-width)">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
