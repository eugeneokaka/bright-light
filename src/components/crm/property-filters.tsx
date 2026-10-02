"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField, type SelectFieldOption } from "@/components/select-field";
import {
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/validations/property";

const ANY = "any";

type Option = { value: string; label: string };

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

export function PropertyFilters({
  counties,
  towns,
}: {
  counties: string[];
  towns: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [county, setCounty] = useState(searchParams.get("county") ?? "");
  const [town, setTown] = useState(searchParams.get("town") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [purpose, setPurpose] = useState(searchParams.get("purpose") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") ?? "");
  const [bathrooms, setBathrooms] = useState(searchParams.get("bathrooms") ?? "");
  const [featured, setFeatured] = useState(searchParams.get("featured") ?? "");

  function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const set = (key: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed !== "") params.set(key, trimmed);
    };

    set("keyword", keyword);
    set("county", county);
    set("town", town);
    set("type", type);
    set("purpose", purpose);
    set("status", status);
    set("minPrice", minPrice);
    set("maxPrice", maxPrice);
    set("bedrooms", bedrooms);
    set("bathrooms", bathrooms);
    set("featured", featured);

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleReset() {
    setKeyword("");
    setCounty("");
    setTown("");
    setType("");
    setPurpose("");
    setStatus("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setBathrooms("");
    setFeatured("");
    router.push(pathname, { scroll: false });
  }

  const typeOptions: Option[] = PROPERTY_TYPES.map((value) => ({
    value,
    label: value.replace(/_/g, " "),
  }));
  const purposeOptions: Option[] = PROPERTY_PURPOSES.map((value) => ({
    value,
    label: value,
  }));
  const statusOptions: Option[] = PROPERTY_STATUSES.map((value) => ({
    value,
    label: value.replace(/_/g, " "),
  }));
  const countyOptions: Option[] = counties.map((value) => ({
    value,
    label: value,
  }));
  const townOptions: Option[] = towns.map((value) => ({
    value,
    label: value,
  }));

  return (
    <Card className="mt-8">
      <CardContent>
        <form onSubmit={handleApply} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Title, town, neighborhood or address"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="county">County</Label>
              <FilterSelect
                value={county}
                onChange={setCounty}
                anyLabel="All counties"
                options={countyOptions}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="town">Town</Label>
              <FilterSelect
                value={town}
                onChange={setTown}
                anyLabel="All towns"
                options={townOptions}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Property type</Label>
              <FilterSelect
                value={type}
                onChange={setType}
                anyLabel="All types"
                options={typeOptions}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <FilterSelect
                value={purpose}
                onChange={setPurpose}
                anyLabel="Buy / Rent / Invest"
                options={purposeOptions}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <FilterSelect
                value={status}
                onChange={setStatus}
                anyLabel="All statuses"
                options={statusOptions}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="featured">Featured</Label>
              <FilterSelect
                value={featured}
                onChange={setFeatured}
                anyLabel="Any"
                options={[
                  { value: "yes", label: "Featured only" },
                  { value: "no", label: "Not featured" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="minPrice">Min price (KES)</Label>
              <Input
                id="minPrice"
                type="number"
                min={0}
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="maxPrice">Max price (KES)</Label>
              <Input
                id="maxPrice"
                type="number"
                min={0}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Any"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bedrooms">Bedrooms (min)</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={bedrooms}
                onChange={(event) => setBedrooms(event.target.value)}
                placeholder="Any"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bathrooms">Bathrooms (min)</Label>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                value={bathrooms}
                onChange={(event) => setBathrooms(event.target.value)}
                placeholder="Any"
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
