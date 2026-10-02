"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField, type SelectFieldOption } from "@/components/select-field";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/validations/lead";

const ANY = "any";

function FilterSelect({
  value,
  onChange,
  anyLabel,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  anyLabel: string;
  options: SelectFieldOption[];
}) {
  return (
    <SelectField
      value={value === "" ? ANY : value}
      onValueChange={(next) => onChange(next === ANY ? "" : next)}
      options={[{ value: ANY, label: anyLabel }, ...options]}
    />
  );
}

export function LeadFilters({ agents }: { agents: SelectFieldOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [source, setSource] = useState(searchParams.get("source") ?? "");
  const [priority, setPriority] = useState(searchParams.get("priority") ?? "");
  const [agent, setAgent] = useState(searchParams.get("agent") ?? "");

  function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const set = (key: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed !== "") params.set(key, trimmed);
    };

    set("keyword", keyword);
    set("status", status);
    set("source", source);
    set("priority", priority);
    set("agent", agent);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleReset() {
    setKeyword("");
    setStatus("");
    setSource("");
    setPriority("");
    setAgent("");
    router.push(pathname, { scroll: false });
  }

  return (
    <Card className="mt-8">
      <CardContent>
        <form onSubmit={handleApply} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Name, phone or email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <FilterSelect
                value={status}
                onChange={setStatus}
                anyLabel="All statuses"
                options={LEAD_STATUSES.map((value) => ({
                  value,
                  label: value.replace(/_/g, " "),
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="source">Source</Label>
              <FilterSelect
                value={source}
                onChange={setSource}
                anyLabel="All sources"
                options={LEAD_SOURCES.map((value) => ({
                  value,
                  label: value.replace(/_/g, " "),
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="priority">Priority</Label>
              <FilterSelect
                value={priority}
                onChange={setPriority}
                anyLabel="Any priority"
                options={LEAD_PRIORITIES.map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="agent">Assigned agent</Label>
              <FilterSelect
                value={agent}
                onChange={setAgent}
                anyLabel="Any agent"
                options={agents}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
