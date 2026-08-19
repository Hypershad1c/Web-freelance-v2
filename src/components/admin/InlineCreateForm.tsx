"use client";

import { useActionState, useRef, useEffect } from "react";
import { CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import type { SimpleFormState } from "@/lib/actions/locations";

const initialState: SimpleFormState = {};

export function InlineCreateForm({
  action,
  children,
  submitLabel,
}: {
  action: (prevState: SimpleFormState, formData: FormData) => Promise<SimpleFormState>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.errors) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="admin-create-form">
      {state.message && <p className="admin-form-success"><CheckCircle2 size={16} /> {state.message}</p>}
      {state.errors && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Impossible d&apos;enregistrer :</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(state.errors).map(([field, messages]) =>
              messages?.map((msg, i) => <li key={`${field}-${i}`}>{msg}</li>)
            )}
          </ul>
        </div>
      )}
      <div className="admin-create-form__fields">{children}</div>
      <button
        type="submit"
        disabled={pending}
        className="pressable mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-domify-primary px-4 text-sm font-semibold text-white shadow-[0_14px_24px_-18px_rgba(16,47,66,0.75)] hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <><LoaderCircle size={15} className="animate-spin" /> Enregistrement...</> : <><Plus size={15} /> {submitLabel}</>}
      </button>
    </form>
  );
}
