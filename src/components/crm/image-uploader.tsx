"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";

export function ImageUploader({
  value,
  onChange,
  max = 8,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (files) => {
      onChange([...value, ...files.map((file) => file.ufsUrl)]);
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

  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-6 text-center transition-colors hover:border-ring">
        <span className="text-sm text-foreground/80">
          {isUploading ? "Uploading…" : "Click to upload images"}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          PNG, JPG or WEBP · up to 8MB · max {max}
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((url) => (
            <li
              key={url}
              className="group relative overflow-hidden rounded-md border border-border"
            >
              <img
                src={url}
                alt="Upload preview"
                className="h-24 w-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => onChange(value.filter((item) => item !== url))}
                className="absolute right-1 top-1"
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
