"use client";

import { useActionState, useRef, useEffect } from "react";
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
    <form ref={formRef} action={formAction} className="rounded-2xl bg-white p-6 shadow-luxury">
      {state.message && <p className="mb-4 text-sm text-domify-primary">{state.message}</p>}
      {state.errors && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Impossible d&apos;enregistrer :</p>
          <ul className="mt-1 list-disc pl-5">
            {Object.entries(state.errors).map(([field, messages]) =>
              messages?.map((msg, i) => <li key={`${field}-${i}`}>{msg}</li>)
            )}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-xl bg-domify-gold px-5 py-2.5 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : submitLabel}
      </button>
    </form>
  );
}
