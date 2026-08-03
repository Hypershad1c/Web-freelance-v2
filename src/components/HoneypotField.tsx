"use client";

export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="text"
      name="website"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      tabIndex={-1}
      aria-hidden="true"
      className="absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );
}
