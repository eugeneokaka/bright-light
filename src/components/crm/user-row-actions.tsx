"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resendInvite,
  updateUserRole,
  updateUserStatus,
} from "@/server/actions/user-actions";
import { ROLES, type Role } from "@/lib/permissions";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";

type RowResult = { error: string } | { success: string } | undefined;

export function UserRowActions({
  userId,
  role,
  status,
  emailVerified,
  isSelf,
}: {
  userId: string;
  role: Role;
  status: "ACTIVE" | "INVITED" | "SUSPENDED" | null;
  emailVerified: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<RowResult>) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await action();

      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setMessage(result.success);
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center justify-end gap-2">
        <div className="w-36">
          <SelectField
            value={role}
            disabled={isSelf || isPending}
            onValueChange={(value) =>
              run(() => updateUserRole(userId, value as Role))
            }
            options={ROLES.map((value) => ({ value, label: value }))}
          />
        </div>

        {!emailVerified ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => resendInvite(userId))}
          >
            Resend
          </Button>
        ) : null}

        <Button
          type="button"
          variant={status === "SUSPENDED" ? "outline" : "ghost"}
          size="sm"
          disabled={isSelf || isPending}
          onClick={() =>
            run(() =>
              updateUserStatus(
                userId,
                status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
              ),
            )
          }
        >
          {status === "SUSPENDED" ? "Activate" : "Suspend"}
        </Button>
      </div>

      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : message ? (
        <span className="text-xs text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}
