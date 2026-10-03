"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TransactionPrintToolbar() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-hide mb-8 flex items-center justify-between gap-3">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/transactions">
          <ArrowLeftIcon className="size-4" />
          Back to transactions
        </Link>
      </Button>

      <Button type="button" size="sm" onClick={() => window.print()}>
        <PrinterIcon className="size-4" />
        Print / Save as PDF
      </Button>
    </div>
  );
}
