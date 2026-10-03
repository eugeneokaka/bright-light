"use client";

import { useState } from "react";
import { createLead } from "@/server/actions/lead-actions";
import {
  LEAD_INTENTS,
  LEAD_PRIORITIES,
  LEAD_SOURCE_SUGGESTIONS,
  LEAD_STATUSES,
  LEAD_TYPES,
  type LeadIntentValue,
  type LeadPriorityValue,
  type LeadStatusValue,
  type LeadTypeValue,
} from "@/lib/validations/lead";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/select-field";
import { Textarea } from "@/components/ui/textarea";

const NONE = "none";

type Option = { id: string; label: string };

export function LeadForm({
  agents,
  properties,
}: {
  agents: Option[];
  properties: Option[];
}) {
  const [type, setType] = useState<LeadTypeValue>("PERSON");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<LeadStatusValue>("NEW");
  const [intent, setIntent] = useState<string>(NONE);
  const [priority, setPriority] = useState<LeadPriorityValue>("MEDIUM");
  const [assignedAgentId, setAssignedAgentId] = useState<string>(NONE);
  const [propertyId, setPropertyId] = useState<string>(NONE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    const result = await createLead({
      name: String(formData.get("name") ?? ""),
      type,
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      source,
      status,
      intent: intent === NONE ? undefined : (intent as LeadIntentValue),
      priority,
      assignedAgentId: assignedAgentId === NONE ? undefined : assignedAgentId,
      propertyId: propertyId === NONE ? undefined : propertyId,
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Customer / Project</Label>
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                placeholder="Jane Doe or Riverside Apartments"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <SelectField
                id="type"
                value={type}
                onValueChange={(value) => setType(value as LeadTypeValue)}
                options={LEAD_TYPES.map((value) => ({
                  value,
                  label: value === "PERSON" ? "Person / client" : "Project",
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                required
                minLength={7}
                placeholder="+254 7xx xxx xxx"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                required
                list="lead-source-suggestions"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="e.g. Referral, Instagram, Walk in"
              />
              <datalist id="lead-source-suggestions">
                {LEAD_SOURCE_SUGGESTIONS.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <SelectField
                id="status"
                value={status}
                onValueChange={(value) => setStatus(value as LeadStatusValue)}
                options={LEAD_STATUSES.map((value) => ({
                  value,
                  label: value.replace(/_/g, " "),
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="priority">Priority</Label>
              <SelectField
                id="priority"
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as LeadPriorityValue)
                }
                options={LEAD_PRIORITIES.map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="intent">Intent</Label>
              <SelectField
                id="intent"
                value={intent}
                onValueChange={setIntent}
                options={[
                  { value: NONE, label: "Not specified" },
                  ...LEAD_INTENTS.map((value) => ({ value, label: value })),
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="assignedAgentId">Assigned agent</Label>
              <SelectField
                id="assignedAgentId"
                value={assignedAgentId}
                onValueChange={setAssignedAgentId}
                options={[
                  { value: NONE, label: "Unassigned" },
                  ...agents.map((agent) => ({
                    value: agent.id,
                    label: agent.label,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="propertyId">Property (optional)</Label>
              <SelectField
                id="propertyId"
                value={propertyId}
                onValueChange={setPropertyId}
                options={[
                  { value: NONE, label: "No property" },
                  ...properties.map((property) => ({
                    value: property.id,
                    label: property.label,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={4} maxLength={2000} />
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Create lead"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
