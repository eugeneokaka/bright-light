"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export type SelectFieldOption = { value: string; label: string };

export function SelectField({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <span
          className={
            selected ? "line-clamp-1" : "line-clamp-1 text-muted-foreground"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
