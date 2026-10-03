import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { isSuperAdmin, type Role } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRowActions } from "@/components/crm/user-row-actions";

export const metadata = {
  title: "Users",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INVITED":
      return "secondary";
    case "SUSPENDED":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user.role)) {
    redirect("/crm");
  }

  const params = await searchParams;
  const invited = params.invited === "1";

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} user{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/users/new">Invite user</Link>
        </Button>
      </div>

      {invited ? (
        <Alert className="mt-6">
          <AlertDescription>
            Invitation sent. A verification code has been emailed to the user.
          </AlertDescription>
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No users yet.</p>
        </div>
      ) : (
        <Card className="mt-8 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const status = row.status ?? "ACTIVE";

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(status)}>
                        {status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.emailVerified ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <UserRowActions
                        userId={row.id}
                        role={(row.role ?? "STAFF") as Role}
                        status={row.status}
                        emailVerified={row.emailVerified}
                        isSelf={row.id === session.user.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </main>
  );
}
