"use client";

import { useState } from "react";
import Link from "next/link";
import { createStall } from "@/server/actions/tower-actions";
import {
  STALL_STATUSES,
  type StallStatusValue,
} from "@/lib/validations/tower";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/select-field";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/crm/image-uploader";

type FloorOption = { id: string; name: string };

function toNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? "").trim();
  if (raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function StallForm({
  towerId,
  floors,
}: {
  towerId: string;
  floors: FloorOption[];
}) {
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const [status, setStatus] = useState<StallStatusValue>("AVAILABLE");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const hasFloors = floors.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!floorId) {
      setError("Please select a floor.");
      return;
    }

    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    const result = await createStall({
      towerId,
      floorId,
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      status,
      price: toNumber(formData.get("price")),
      area: toNumber(formData.get("area")),
      description: String(formData.get("description") ?? ""),
      images,
    });

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  if (!hasFloors) {
    return (
      <Alert>
        <AlertDescription>
          Add a floor to this tower first — a stall belongs to a floor.{" "}
          <Link href={`/crm/towers/${towerId}/floors/new`} className="underline">
            Add a floor
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="floorId">Floor</Label>
              <SelectField
                id="floorId"
                value={floorId}
                onValueChange={setFloorId}
                placeholder="Select a floor"
                options={floors.map((floor) => ({
                  value: floor.id,
                  label: floor.name,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Stall code</Label>
              <Input
                id="code"
                name="code"
                required
                placeholder="A-01"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Optional" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <SelectField
                id="status"
                value={status}
                onValueChange={(value) =>
                  setStatus(value as StallStatusValue)
                }
                options={STALL_STATUSES.map((value) => ({
                  value,
                  label: value.replace(/_/g, " "),
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price (KES)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                name="area"
                type="number"
                min={0}
                step="any"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Images</Label>
            <ImageUploader value={images} onChange={setImages} max={6} />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create stall"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
