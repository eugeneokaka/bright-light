import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { BrandMark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <BrandMark className="h-12 w-12 rounded-2xl text-lg" />

      <Badge variant="outline" className="mt-6 border-brand/30 text-brand">
        Nairobi · Nakuru · Kenya
      </Badge>

      <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
        <span className="bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
          Property, lead &amp; viewing management.
        </span>
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Connecting you to your dreams. The internal CRM for Bright Light Homes
        &amp; Properties.
      </p>

      <div className="mt-10">
        <Button
          asChild
          size="lg"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Link href={session ? "/crm" : "/login"}>
            {session ? "Go to dashboard" : "Sign in"}
          </Link>
        </Button>
      </div>

      <p className="mt-20 text-xs text-muted-foreground/70">
        &copy; Bright Light Homes &amp; Properties. All rights reserved.
      </p>
    </main>
  );
}
