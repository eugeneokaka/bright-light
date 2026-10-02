"use client";

import { useState } from "react";
import { createTower } from "@/server/actions/tower-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/crm/image-uploader";

export function TowerForm() {
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    const result = await createTower({
      name: String(formData.get("name") ?? ""),
      location: String(formData.get("location") ?? ""),
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Tower name</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="Sunrise Tower"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Nairobi" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Images</Label>
            <ImageUploader value={images} onChange={setImages} />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create tower"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
