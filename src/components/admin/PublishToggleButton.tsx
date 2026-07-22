"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PublishToggleButton({ published, action }: { published: boolean; action: (published: boolean) => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => action(!published))}
      disabled={pending}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 transition-luxury hover:bg-domify-warm-white hover:text-domify-primary disabled:opacity-50"
      aria-label={published ? "Masquer" : "Publier"}
      title={published ? "Masquer du site" : "Publier sur le site"}
    >
      {published ? <Eye size={15} /> : <EyeOff size={15} />}
    </button>
  );
}
