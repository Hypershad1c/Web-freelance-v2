"use client";

import { useTransition } from "react";
import { Send, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitPropertyForApproval } from "@/lib/actions/properties";

export function SubmitForApprovalButton({ id, pending }: { id: string; pending: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      await submitPropertyForApproval(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={pending || isPending}
      className="flex items-center gap-2 rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-55"
    >
      {isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
      {pending ? "Soumis pour validation" : "Soumettre à validation"}
    </button>
  );
}
