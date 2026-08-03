"use client";

import { useTransition } from "react";
import { togglePermission } from "@/lib/actions/users";

export function PermissionsPanel({
  userId,
  permissions,
  grantedIds,
}: {
  userId: string;
  permissions: { id: string; key: string; label: string }[];
  grantedIds: string[];
}) {
  const [pending, startTransition] = useTransition();

  if (permissions.length === 0) {
    return (
      <p className="text-sm text-domify-dark/50">
        Aucune permission définie. Ajoutez-en depuis <a href="/admin/roles" className="text-domify-primary font-medium">Rôles &amp; permissions</a>.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {permissions.map((p) => {
        const granted = grantedIds.includes(p.id);
        return (
          <label key={p.id} className="flex items-center gap-2 rounded-lg bg-domify-warm-white px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              defaultChecked={granted}
              disabled={pending}
              onChange={(e) => startTransition(() => togglePermission(userId, p.id, e.target.checked))}
              className="h-4 w-4"
            />
            <span>
              <span className="font-medium text-domify-dark">{p.label}</span>
              <span className="ml-1.5 text-xs text-domify-dark/40">{p.key}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
