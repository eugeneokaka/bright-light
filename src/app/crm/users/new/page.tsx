import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { UserForm } from "@/components/crm/user-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Invite user",
};

export default async function NewUserPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user.role)) {
    redirect("/crm");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/users">← Back to users</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">Invite user</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter a name and email. The user receives a 6-digit code to set their
        password and activate the account.
      </p>

      <div className="mt-8">
        <UserForm />
      </div>
    </main>
  );
}
