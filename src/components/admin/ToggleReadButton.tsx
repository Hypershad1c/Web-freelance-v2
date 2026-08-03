"use client";

import { useTransition } from "react";
import { Mail, MailOpen } from "lucide-react";

export function ToggleReadButton({ read, action }: { read: boolean; action: (read: boolean) => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => action(!read))}
      disabled={pending}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 transition-luxury hover:bg-domify-warm-white hover:text-domify-primary disabled:opacity-50"
      aria-label={read ? "Marquer comme non lu" : "Marquer comme lu"}
      title={read ? "Marquer comme non lu" : "Marquer comme lu"}
    >
      {read ? <MailOpen size={15} /> : <Mail size={15} />}
    </button>
  );
}
