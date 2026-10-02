"use client";

import { useState } from "react";
import {
  addLeadNote,
  assignLead,
  updateLeadPriority,
  updateLeadStatus,
} from "@/server/actions/lead-actions";
import {
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type LeadPriorityValue,
  type LeadStatusValue,
} from "@/lib/validations/lead";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/select-field";
import { Textarea } from "@/components/ui/textarea";

const NONE = "none";

type LeadControl = {
  id: string;
  status: LeadStatusValue;
  priority: LeadPriorityValue;
  assignedAgentId: string | null;
};

export function LeadControls({
  lead,
  agents,
}: {
  lead: LeadControl;
  agents: { id: string; label: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  async function run(action: Promise<{ error: string } | undefined>) {
    setError(null);
    const result = await action;
    if (result?.error) {
      setError(result.error);
    }
  }

  async function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (note.trim() === "") return;
    setIsSavingNote(true);
    setError(null);
    const result = await addLeadNote(lead.id, note);
    setIsSavingNote(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setNote("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage lead</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lead-status">Status</Label>
            <SelectField
              id="lead-status"
              value={lead.status}
              onValueChange={(value) =>
                run(updateLeadStatus(lead.id, value as LeadStatusValue))
              }
              options={LEAD_STATUSES.map((value) => ({
                value,
                label: value.replace(/_/g, " "),
              }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lead-priority">Priority</Label>
            <SelectField
              id="lead-priority"
              value={lead.priority}
              onValueChange={(value) =>
                run(updateLeadPriority(lead.id, value as LeadPriorityValue))
              }
              options={LEAD_PRIORITIES.map((value) => ({
                value,
                label: value,
              }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lead-agent">Assigned agent</Label>
            <SelectField
              id="lead-agent"
              value={lead.assignedAgentId ?? NONE}
              onValueChange={(value) =>
                run(assignLead(lead.id, value === NONE ? null : value))
              }
              options={[
                { value: NONE, label: "Unassigned" },
                ...agents.map((agent) => ({
                  value: agent.id,
                  label: agent.label,
                })),
              ]}
            />
          </div>
        </div>

        <form onSubmit={handleAddNote} className="flex flex-col gap-3">
          <Label htmlFor="lead-note">Add a note</Label>
          <Textarea
            id="lead-note"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Log a call, follow-up or update…"
          />
          <div>
            <Button type="submit" disabled={isSavingNote || note.trim() === ""}>
              {isSavingNote ? "Saving…" : "Add note"}
            </Button>
          </div>
        </form>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
