import type { Metadata } from "next";
import "../globals.css";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Providers } from "@/components/Providers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Domify Admin",
  description: "Back-office Domify",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role ?? "USER";

  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          <div className="flex min-h-screen bg-domify-warm-white/40">
            <AdminSidebar role={role} />
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}