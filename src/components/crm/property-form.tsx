"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { createProperty } from "@/server/actions/property-actions";
import {
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type PropertyPurposeValue,
  type PropertyStatusValue,
  type PropertyTypeValue,
} from "@/lib/validations/property";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/select-field";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type UploadedImage = { url: string; key: string; name?: string };

function toNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? "").trim();
  if (raw === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const sectionTitle =
  "text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export function PropertyForm() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [propertyType, setPropertyType] =
    useState<PropertyTypeValue>("APARTMENT");
  const [purpose, setPurpose] = useState<PropertyPurposeValue>("SALE");
  const [status, setStatus] = useState<PropertyStatusValue>("DRAFT");
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const { startUpload, isUploading } = useUploadThing("propertyImage", {
    onClientUploadComplete: (files) => {
      setImages((current) => [
        ...current,
        ...files.map((file) => ({
          url: file.ufsUrl,
          key: file.key,
          name: file.name,
        })),
      ]);
    },
    onUploadError: (uploadError) => {
      setError(uploadError.message);
    },
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      await startUpload(files);
    }
    event.target.value = "";
  }

  function removeImage(key: string) {
    setImages((current) => current.filter((image) => image.key !== key));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const amenities = String(formData.get("amenities") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const result = await createProperty({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      propertyType,
      purpose,
      status,
      price: toNumber(formData.get("price")) ?? 0,
      buyingPrice: toNumber(formData.get("buyingPrice")),
      county: String(formData.get("county") ?? ""),
      town: String(formData.get("town") ?? ""),
      neighborhood: String(formData.get("neighborhood") ?? ""),
      address: String(formData.get("address") ?? ""),
      mapUrl: String(formData.get("mapUrl") ?? ""),
      latitude: toNumber(formData.get("latitude")),
      longitude: toNumber(formData.get("longitude")),
      bedrooms: toNumber(formData.get("bedrooms")),
      bathrooms: toNumber(formData.get("bathrooms")),
      size: toNumber(formData.get("size")),
      sizeUnit: String(formData.get("sizeUnit") ?? ""),
      parking: toNumber(formData.get("parking")),
      amenities,
      featured,
      images: images.map((image) => ({ url: image.url, key: image.key })),
    });

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 pt-2">
          <section className="flex flex-col gap-3">
            <h2 className={sectionTitle}>Photos</h2>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-8 text-center transition-colors hover:border-ring">
              <span className="text-sm text-foreground/80">
                {isUploading ? "Uploading…" : "Click to upload images"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                PNG, JPG or WEBP · up to 8MB · max 10
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>

            {images.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image) => (
                  <li
                    key={image.key}
                    className="group relative overflow-hidden rounded-md border border-border"
                  >
                    <img
                      src={image.url}
                      alt={image.name ?? "Property image"}
                      className="h-24 w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => removeImage(image.key)}
                      className="absolute right-1 top-1"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <Separator />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h2 className={`${sectionTitle} sm:col-span-2`}>Basics</h2>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={200}
                placeholder="3 Bedroom Apartment in Kilimani"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                maxLength={5000}
                placeholder="Describe the property, features and nearby amenities."
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="propertyType">Property type</Label>
              <SelectField
                id="propertyType"
                value={propertyType}
                onValueChange={(value) =>
                  setPropertyType(value as PropertyTypeValue)
                }
                options={PROPERTY_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <SelectField
                id="purpose"
                value={purpose}
                onValueChange={(value) =>
                  setPurpose(value as PropertyPurposeValue)
                }
                options={PROPERTY_PURPOSES.map((value) => ({
                  value,
                  label: value,
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
                required
                placeholder="15000000"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="buyingPrice">Buying price (KES)</Label>
              <Input
                id="buyingPrice"
                name="buyingPrice"
                type="number"
                min={0}
                step={1}
                placeholder="Optional — used to calculate profit"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <SelectField
                id="status"
                value={status}
                onValueChange={(value) =>
                  setStatus(value as PropertyStatusValue)
                }
                options={PROPERTY_STATUSES.map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked === true)}
              />
              <Label htmlFor="featured">Mark as featured</Label>
            </div>
          </section>

          <Separator />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h2 className={`${sectionTitle} sm:col-span-2`}>Location</h2>

            <div className="flex flex-col gap-2">
              <Label htmlFor="county">County</Label>
              <Input id="county" name="county" placeholder="Nairobi" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="town">Town</Label>
              <Input id="town" name="town" placeholder="Kilimani" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input id="neighborhood" name="neighborhood" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="-1.2921"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="36.8219"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="mapUrl">Google Maps link</Label>
              <Input
                id="mapUrl"
                name="mapUrl"
                type="url"
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-xs text-muted-foreground">
                Paste a Google Maps link. It opens in Google Maps when clicked
                from the property list.
              </p>
            </div>
          </section>

          <Separator />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <h2 className={`${sectionTitle} sm:col-span-3`}>Details</h2>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min={0}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min={0}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="parking">Parking</Label>
              <Input
                id="parking"
                name="parking"
                type="number"
                min={0}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                name="size"
                type="number"
                min={0}
                step="any"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sizeUnit">Size unit</Label>
              <Input id="sizeUnit" name="sizeUnit" placeholder="SQFT" />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label htmlFor="amenities">Amenities (comma separated)</Label>
              <Input
                id="amenities"
                name="amenities"
                placeholder="Borehole, Backup generator, CCTV, Gym"
              />
            </div>
          </section>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending ? "Creating…" : "Create listing"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
