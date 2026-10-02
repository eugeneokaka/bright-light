"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { createTransaction } from "@/server/actions/transaction-actions";
import {
  TRANSACTION_STATUSES,
  type TransactionStatusValue,
} from "@/lib/validations/transaction";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/select-field";
import { Textarea } from "@/components/ui/textarea";

type PropertyOption = { id: string; title: string };

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? "").trim();
  if (raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function TransactionForm({
  properties,
  defaultPropertyId,
}: {
  properties: PropertyOption[];
  defaultPropertyId?: string;
}) {
  const [propertyId, setPropertyId] = useState(() =>
    defaultPropertyId && properties.some((item) => item.id === defaultPropertyId)
      ? defaultPropertyId
      : "",
  );
  const [status, setStatus] = useState<TransactionStatusValue>("SOLD");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const hasProperties = properties.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!propertyId) {
      setError("Please select a property.");
      return;
    }

    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    const result = await createTransaction({
      propertyId,
      status,
      buyerName: String(formData.get("buyerName") ?? ""),
      buyerPhone: String(formData.get("buyerPhone") ?? ""),
      buyerEmail: String(formData.get("buyerEmail") ?? ""),
      amount: toNumber(formData.get("amount")) ?? 0,
      transactionDate: String(formData.get("transactionDate") ?? ""),
      rentalExpiresAt: String(formData.get("rentalExpiresAt") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="propertyId">Property</Label>
              {propertyId ? (
                <SelectField
                  id="propertyId"
                  value={propertyId}
                  onValueChange={setPropertyId}
                  placeholder="Select a property"
                  options={properties.map((property) => ({
                    value: property.id,
                    label: property.title,
                  }))}
                />
              ) : (
                <Link
                  href="/crm/properties"
                  className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  Select a property
                  <ChevronDownIcon className="size-4 opacity-50" />
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Type</Label>
              <SelectField
                id="status"
                value={status}
                onValueChange={(value) =>
                  setStatus(value as TransactionStatusValue)
                }
                options={TRANSACTION_STATUSES.map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step={1}
                required
                placeholder="15000000"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="buyerName">
                {status === "RENTED" ? "Tenant name" : "Buyer name"}
              </Label>
              <Input
                id="buyerName"
                name="buyerName"
                required
                minLength={2}
                maxLength={200}
                placeholder="Full name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="transactionDate">Date</Label>
              <Input
                id="transactionDate"
                name="transactionDate"
                type="date"
                defaultValue={todayString()}
              />
            </div>

            {status === "RENTED" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="rentalExpiresAt">Lease end date</Label>
                <Input
                  id="rentalExpiresAt"
                  name="rentalExpiresAt"
                  type="date"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The property returns to Active when this date passes.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="buyerPhone">Phone</Label>
              <Input
                id="buyerPhone"
                name="buyerPhone"
                maxLength={32}
                placeholder="+254 7xx xxx xxx"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="buyerEmail">Email</Label>
              <Input
                id="buyerEmail"
                name="buyerEmail"
                type="email"
                maxLength={200}
                placeholder="name@example.com"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} maxLength={2000} />
            </div>
          </div>

          {!hasProperties ? (
            <Alert>
              <AlertDescription>
                Add a property first — a transaction must be linked to a
                property.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div>
            <Button
              type="submit"
              disabled={isPending || !hasProperties || !propertyId}
            >
              {isPending ? "Recording…" : "Record transaction"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
