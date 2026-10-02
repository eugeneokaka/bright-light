"use client";

import { useState } from "react";
import { createFloor } from "@/server/actions/tower-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/crm/image-uploader";

export function FloorForm({ towerId }: { towerId: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    const result = await createFloor({
      towerId,
      name: String(formData.get("name") ?? ""),
      level: String(formData.get("level") ?? ""),
      description: String(formData.get("description") ?? ""),
      images,
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Floor name</Label>
              <Input
                id="name"
                name="name"
                required
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
                placeholder="0"
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
              {isPending ? "Creating…" : "Create floor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
