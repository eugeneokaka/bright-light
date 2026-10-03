import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { BrandMark } from "@/components/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Activate your account",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/crm");
  }

  const params = await searchParams;
  const rawEmail = params.email;
  const defaultEmail = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-sm font-semibold tracking-tight">
              Bright Light <span className="text-muted-foreground">CRM</span>
            </span>
          </div>
          <CardTitle className="mt-4 text-xl">Activate your account</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your invite email, then create a
            password.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <AcceptInviteForm defaultEmail={defaultEmail} />
          <p className="text-center text-xs text-muted-foreground">
            Already activated?{" "}
            <Link href="/login" className="text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
