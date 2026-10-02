import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canManageProperties } from "@/lib/permissions";
import { TowerForm } from "@/components/crm/tower-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New tower",
};

export default async function NewTowerPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageProperties(session.user.role)) {
    redirect("/crm/towers");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/towers">← Back to towers</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">New tower</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a tower, then add its floors and stalls.
      </p>

      <div className="mt-8">
        <TowerForm />
      </div>
    </main>
  );
}
