"use client";

import { useState } from "react";
import { createFloor, updateFloor } from "@/server/actions/tower-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/crm/image-uploader";

export type FloorFormInitial = {
  id: string;
  name: string;
  level: number | null;
  description: string | null;
  images: string[] | null;
};

export function FloorForm({
  towerId,
  floor,
}: {
  towerId: string;
  floor?: FloorFormInitial;
}) {
  const [images, setImages] = useState<string[]>(floor?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isEditing = Boolean(floor);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const values = {
      towerId,
      name: String(formData.get("name") ?? ""),
      level: String(formData.get("level") ?? ""),
      description: String(formData.get("description") ?? ""),
      images,
    };

    const result =
      isEditing && floor
        ? await updateFloor({ ...values, id: floor.id })
        : await createFloor(values);

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
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Floor name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={floor?.name ?? ""}
                placeholder="Ground Floor"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                name="level"
                type="number"
                step={1}
                defaultValue={floor?.level ?? ""}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={floor?.description ?? ""}
            />
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
              {isPending
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create floor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
