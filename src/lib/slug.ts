export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(input: string): string {
  const base = slugify(input) || "property";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
