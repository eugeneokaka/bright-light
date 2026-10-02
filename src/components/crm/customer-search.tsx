"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (value.trim() !== "") {
      params.set("q", value.trim());
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by name, phone or email"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
