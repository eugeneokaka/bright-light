"use client";

import { useState } from "react";
import { inviteUser } from "@/server/actions/user-actions";
import { ROLES } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/select-field";

export function UserForm() {
  const [role, setRole] = useState<string>("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    const result = await inviteUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: role as (typeof ROLES)[number],
      phone: String(formData.get("phone") ?? ""),
    });

    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={200}
              placeholder="Jane Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              required
              placeholder="jane@example.com"
            />
            <p className="text-xs text-muted-foreground">
              A 6-digit verification code will be emailed to this address.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <SelectField
                id="role"
                value={role}
                onValueChange={setRole}
                options={ROLES.map((value) => ({ value, label: value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                maxLength={32}
                placeholder="Optional"
              />
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending invite…" : "Send invite"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
