import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canManageProperties } from "@/lib/permissions";
import { PropertyForm } from "@/components/crm/property-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New listing",
};

export default async function NewPropertyPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageProperties(session.user.role)) {
    redirect("/crm/properties");
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/properties">← Back to properties</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">New listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a property listing. Uploads and details are saved to the CRM.
      </p>

      <div className="mt-8">
        <PropertyForm />
      </div>
    </main>
  );
}
