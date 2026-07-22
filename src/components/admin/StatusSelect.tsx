"use client";

import { useTransition } from "react";

export function StatusSelect({
  value,
  options,
  action,
}: {
  value: string;
  options: { value: string; label: string }[];
  action: (status: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={value}
      disabled={pending}
      onChange={(e) => startTransition(() => action(e.target.value))}
      className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-domify-dark/70 disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
