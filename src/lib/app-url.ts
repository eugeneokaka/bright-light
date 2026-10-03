function toUrl(value: string | undefined) {
  if (!value) return undefined;
  return value.startsWith("http") ? value : `https://${value}`;
}

export function getAppUrl() {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    toUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    toUrl(process.env.VERCEL_URL) ??
    "http://localhost:3000"
  );
}
