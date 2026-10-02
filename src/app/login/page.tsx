import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/crm");
  }

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
          <CardTitle className="mt-4 text-xl">Sign in</CardTitle>
          <CardDescription>Access the Bright Light CRM.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <LoginForm />
          <p className="text-xs text-muted-foreground">
            Need an account? Contact a Super Admin or Director.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
