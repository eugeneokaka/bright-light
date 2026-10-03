import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { expireRentals } from "@/server/rentals";
import { AppSidebar, MobileNav } from "@/components/crm/app-sidebar";
import { Topbar } from "@/components/crm/topbar";

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

  const superAdmin = isSuperAdmin(session.user.role);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar isSuperAdmin={superAdmin} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
        />
        <MobileNav isSuperAdmin={superAdmin} />

        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
