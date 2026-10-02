import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { expireRentals } from "@/server/rentals";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Brand } from "@/components/brand";
import { CrmNav } from "@/components/crm/crm-nav";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  await expireRentals();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Brand />
            <CrmNav className="hidden md:flex" />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>

        <div className="border-t border-border/60 px-4 md:hidden">
          <CrmNav className="overflow-x-auto py-2" />
        </div>
      </header>

      {children}
    </div>
  );
}
