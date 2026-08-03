import type { Metadata } from "next";
import "../globals.css";
import { AdminSidebar, type Role } from "@/components/admin/AdminSidebar";
import { Providers } from "@/components/Providers";
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
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col bg-domify-warm-white/40 lg:flex-row">
            <AdminSidebar role={role} />
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
