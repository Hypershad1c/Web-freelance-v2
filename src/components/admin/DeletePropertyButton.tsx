"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProperty } from "@/lib/actions/properties";

export function DeletePropertyButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Supprimer « ${title} » ? Cette action est irréversible.`)) return;
    startTransition(() => {
      deleteProperty(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 transition-luxury hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      aria-label="Supprimer"
    >
      <Trash2 size={15} />
    </button>
  );
}
