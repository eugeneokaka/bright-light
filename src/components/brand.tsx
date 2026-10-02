import Link from "next/link";
import { cn } from "cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-brand-foreground shadow-sm shadow-brand/20",
        className,
      )}
    >
      BL
    </span>
  );
}

export function Brand({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href="/crm"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <BrandMark />
      <span
        className={cn(
          "text-sm font-semibold tracking-tight text-foreground",
          wordmarkClassName,
        )}
      >
        Bright Light <span className="text-muted-foreground">CRM</span>
      </span>
    </Link>
  );
}
