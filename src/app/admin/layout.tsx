import type { Metadata } from "next";
import { AdminSidebar, type Role } from "@/components/admin/AdminSidebar";
import { auth } from "@/lib/auth";
import { pwaMetadata, pwaViewport } from "@/lib/pwa-metadata";

export const viewport = pwaViewport;

export const metadata: Metadata = {
  title: "Domify Admin",
  description: "Back-office Domify",
  ...pwaMetadata,
};

const KNOWN_ROLES: Role[] = ["ADMIN", "EDITOR", "AGENT", "USER"];

function toRole(value: string | undefined): Role {
  return KNOWN_ROLES.includes(value as Role) ? (value as Role) : "USER";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = toRole(session?.user?.role);

  return (
    <div className="admin-page-shell admin-safe-bottom flex min-h-screen min-w-0 flex-col bg-domify-warm-white/40 lg:flex-row">
      <AdminSidebar role={role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
